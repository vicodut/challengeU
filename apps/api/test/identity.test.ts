import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SEED_USERS, seedUsers } from '../src/db/seed-users';
import { CreateAccount } from '../src/modules/identity';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { PG_POOL } from '../src/shared/db/database.module';
import type { Pool } from 'pg';

const PROBLEM = 'application/problem+json';

describe('identity: Basic auth and current user', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it.each(SEED_USERS)('logs in $username and returns their own profile', async (user) => {
    const response = await request(testApp.http)
      .get('/api/v1/me')
      .set('Authorization', basicAuthHeader(user.username, user.password))
      .expect(200);

    expect(response.body).toEqual({
      userId: expect.any(String) as string,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      timeZone: user.timeZone,
    });
  });

  it('rejects a wrong password with a 401 Problem Details', async () => {
    const response = await request(testApp.http)
      .get('/api/v1/me')
      .set('Authorization', basicAuthHeader('studentA', 'nope'))
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM);
    expect(response.body).toEqual({
      type: 'urn:challengeu:problem:invalid-credentials',
      title: 'Unauthorized',
      status: 401,
      code: 'INVALID_CREDENTIALS',
      detail: expect.any(String) as string,
    });
  });

  it('rejects an unknown user, a missing header and a malformed header with 401', async () => {
    await request(testApp.http)
      .get('/api/v1/me')
      .set('Authorization', basicAuthHeader('ghost', 'x$123'))
      .expect(401);
    await request(testApp.http).get('/api/v1/me').expect(401);
    await request(testApp.http).get('/api/v1/me').set('Authorization', 'Bearer abc').expect(401);
    await request(testApp.http).get('/api/v1/me').set('Authorization', 'Basic !!!').expect(401);
  });

  it('keeps health and docs reachable without credentials', async () => {
    await request(testApp.http).get('/api/v1/health').expect(200);
    await request(testApp.http).get('/docs').expect(200);
    await request(testApp.http).get('/docs-json').expect(200);
  });

  it('stores passwords as argon2id hashes, never in clear', async () => {
    const pool = testApp.app.get<Pool>(PG_POOL);
    const { rows } = await pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE username = 'admin'",
    );

    expect(rows[0]?.password_hash).toMatch(/^\$argon2id\$/);
  });

  it('creates one role row per user', async () => {
    const pool = testApp.app.get<Pool>(PG_POOL);
    const { rows } = await pool.query<{ role: string; n: string }>(
      `SELECT 'student' AS role, count(*) AS n FROM students
       UNION ALL SELECT 'coach', count(*) FROM coaches
       UNION ALL SELECT 'admin', count(*) FROM admins`,
    );

    expect(Object.fromEntries(rows.map((r) => [r.role, Number(r.n)]))).toEqual({
      student: 2,
      coach: 2,
      admin: 1,
    });
  });

  it('seeding twice is idempotent', async () => {
    await seedUsers(testApp.app.get(CreateAccount));
    const pool = testApp.app.get<Pool>(PG_POOL);
    const { rows } = await pool.query<{ n: string }>('SELECT count(*) AS n FROM users');

    expect(Number(rows[0]?.n)).toBe(5);
  });

  it('refuses an account with a non-IANA time zone (422) at the use case', async () => {
    await expect(
      testApp.app.get(CreateAccount).execute({
        username: 'x',
        password: 'x',
        displayName: 'X',
        timeZone: 'Mars/Olympus',
        role: 'student',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TIME_ZONE', kind: 'unprocessable' });
  });
});

describe('role restrictions', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('lets the allowed role through', async () => {
    await request(testApp.http)
      .get('/api/v1/test/admin-only')
      .set('Authorization', basicAuthHeader('admin', 'admin$123'))
      .expect(200);
  });

  it.each([
    ['coachA', 'coachA$123'],
    ['studentA', 'studentA$123'],
  ])('rejects %s on an admin-only route with 403 Problem Details', async (user, password) => {
    const response = await request(testApp.http)
      .get('/api/v1/test/admin-only')
      .set('Authorization', basicAuthHeader(user, password))
      .expect(403);

    expect(response.headers['content-type']).toContain(PROBLEM);
    expect(response.body).toMatchObject({ status: 403, code: 'ROLE_FORBIDDEN' });
  });

  it('accepts any of several allowed roles and rejects the rest', async () => {
    await request(testApp.http)
      .get('/api/v1/test/coach-or-student')
      .set('Authorization', basicAuthHeader('coachB', 'coachB$123'))
      .expect(200);
    await request(testApp.http)
      .get('/api/v1/test/coach-or-student')
      .set('Authorization', basicAuthHeader('admin', 'admin$123'))
      .expect(403);
  });

  it('answers 401 before 403 when credentials are missing', async () => {
    await request(testApp.http).get('/api/v1/test/admin-only').expect(401);
  });

  it('lets @Public routes through without credentials', async () => {
    await request(testApp.http).get('/api/v1/test/public').expect(200);
  });
});

describe('Problem Details error contract', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('turns validation failures into 422 with the offending fields', async () => {
    const response = await request(testApp.http)
      .post('/api/v1/test/echo')
      .send({ name: 'ab', extra: 1 })
      .expect(422);

    expect(response.headers['content-type']).toContain(PROBLEM);
    expect(response.body).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Unprocessable Entity',
      errors: [
        { field: 'extra', messages: [expect.any(String) as string] },
        { field: 'name', messages: [expect.any(String) as string] },
      ],
    });
  });

  it('accepts a valid body', async () => {
    await request(testApp.http).post('/api/v1/test/echo').send({ name: 'abc' }).expect(201);
  });

  it('renders unknown routes as 404 Problem Details', async () => {
    const response = await request(testApp.http).get('/api/v1/nope').expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('renders malformed JSON as 400 Problem Details', async () => {
    const response = await request(testApp.http)
      .post('/api/v1/test/echo')
      .set('Content-Type', 'application/json')
      .send('{bad')
      .expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'BAD_REQUEST' });
  });

  it('hides the details of unexpected errors behind a 500', async () => {
    const response = await request(testApp.http).get('/api/v1/test/boom').expect(500);

    expect(response.body).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
    expect(JSON.stringify(response.body)).not.toContain('secret internal detail');
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ENROLLMENT_REPOSITORY } from '../src/modules/enrollment';
import { DrizzleEnrollmentRepository } from '../src/modules/enrollment/infrastructure/drizzle-enrollment.repository';
import { DRIZZLE, type Database } from '../src/shared/db/database.module';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const admin = basicAuthHeader('admin', 'admin$123');

interface Student {
  id: string;
  displayName: string;
  timeZone: string;
  programId: string;
  programName: string;
  status: string;
}

describe('enrollment: students', () => {
  let testApp: TestApp;
  let academic: string;
  let failEnrollment = false;

  const body = (overrides: Record<string, unknown> = {}) => ({
    username: 'studentC',
    password: 'studentC$123',
    displayName: 'Student C',
    timeZone: 'America/Toronto',
    programId: academic,
    ...overrides,
  });
  const register = (payload: object, auth = admin) =>
    request(testApp.http).post('/api/v1/students').set('Authorization', auth).send(payload);
  const list = async () =>
    (
      (await request(testApp.http).get('/api/v1/students').set('Authorization', admin).expect(200))
        .body as { items: Student[] }
    ).items;

  beforeAll(async () => {
    testApp = await createTestApp({
      // Fails the enrollment insert on demand, after the account has been created.
      configure: (builder) =>
        builder.overrideProvider(ENROLLMENT_REPOSITORY).useFactory({
          factory: (db: Database) =>
            new Proxy(new DrizzleEnrollmentRepository(db), {
              get: (target, key, receiver) =>
                key === 'add' && failEnrollment
                  ? () => Promise.reject(new Error('boom'))
                  : (Reflect.get(target, key, receiver) as unknown),
            }),
          inject: [DRIZZLE],
        }),
    });
    await testApp.seed();
    const programs = await request(testApp.http)
      .get('/api/v1/programs')
      .set('Authorization', admin);
    academic =
      (programs.body as { items: { id: string; name: string }[] }).items.find(
        (p) => p.name === 'Academic Success',
      )?.id ?? '';
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('lists the seeded students with their program and status', async () => {
    const items = await list();
    expect(
      items.map(({ displayName, programName, status }) => [displayName, programName, status]),
    ).toEqual([
      ['Student A', 'Academic Success', 'active'],
      ['Student B', 'Career Launch', 'active'],
    ]);
  });

  it('registers a student: 201, can sign in, listed, readable by id and shown on the program', async () => {
    const created = await register(body()).expect(201);
    const { id } = created.body as { id: string };

    await request(testApp.http)
      .get('/api/v1/me')
      .set('Authorization', basicAuthHeader('studentC', 'studentC$123'))
      .expect(200);
    const one = await request(testApp.http)
      .get(`/api/v1/students/${id}`)
      .set('Authorization', admin)
      .expect(200);
    expect(one.body).toMatchObject({
      id,
      displayName: 'Student C',
      timeZone: 'America/Toronto',
      programId: academic,
      programName: 'Academic Success',
      status: 'active',
    });
    expect((await list()).map((s) => s.id)).toContain(id);
    const program = await request(testApp.http)
      .get(`/api/v1/programs/${academic}`)
      .set('Authorization', admin);
    expect((program.body as { students: { id: string }[] }).students.map((s) => s.id)).toContain(
      id,
    );
  });

  it('answers a duplicate username with 409 USERNAME_TAKEN', async () => {
    const response = await register(body({ username: 'studentA' })).expect(409);
    expect(response.body).toMatchObject({ code: 'USERNAME_TAKEN' });
  });

  it('answers an unknown program with 404 and creates no account', async () => {
    const response = await register(
      body({ username: 'ghost', programId: '11111111-1111-4111-8111-111111111111' }),
    ).expect(404);
    expect(response.body).toMatchObject({ code: 'PROGRAM_NOT_FOUND' });
    await request(testApp.http)
      .get('/api/v1/me')
      .set('Authorization', basicAuthHeader('ghost', 'studentC$123'))
      .expect(401);
  });

  it('rejects an invalid time zone with 422 and a missing field with 422', async () => {
    const response = await register(body({ username: 'zoned', timeZone: 'Mars/Base' })).expect(422);
    expect(response.body).toMatchObject({ code: 'INVALID_TIME_ZONE' });
    await register({ username: 'x' }).expect(422);
  });

  it('leaves no account behind when the enrollment fails', async () => {
    failEnrollment = true;
    await register(body({ username: 'orphan' })).expect(500);
    failEnrollment = false;
    await request(testApp.http)
      .get('/api/v1/me')
      .set('Authorization', basicAuthHeader('orphan', 'studentC$123'))
      .expect(401);
    await register(body({ username: 'orphan' })).expect(201);
  });

  it('answers an unknown or malformed student id with 404 or 422', async () => {
    await request(testApp.http)
      .get('/api/v1/students/11111111-1111-4111-8111-111111111111')
      .set('Authorization', admin)
      .expect(404);
    await request(testApp.http)
      .get('/api/v1/students/nope')
      .set('Authorization', admin)
      .expect(422);
  });

  it.each([
    ['coachA', 'coachA$123'],
    ['studentA', 'studentA$123'],
  ])('is admin-only: %s gets 403, anonymous gets 401', async (user, password) => {
    const auth = basicAuthHeader(user, password);
    await register(body({ username: 'nope' }), auth).expect(403);
    await request(testApp.http).get('/api/v1/students').set('Authorization', auth).expect(403);
    await request(testApp.http).get('/api/v1/students').expect(401);
  });

  describe('suspend and reactivate', () => {
    const studentA = basicAuthHeader('studentA', 'studentA$123');
    const me = async (auth: string) =>
      (await request(testApp.http).get('/api/v1/me').set('Authorization', auth).expect(200))
        .body as {
        studentStatus?: string;
      };
    const setStatus = (id: string, status: unknown, auth = admin) =>
      request(testApp.http)
        .patch(`/api/v1/students/${id}`)
        .set('Authorization', auth)
        .send({ status });
    let id: string;

    beforeAll(async () => {
      id = (await list()).find((s) => s.displayName === 'Student A')?.id ?? '';
    });

    it('suspends then reactivates, stamping the change time and reflecting it in /me', async () => {
      expect((await me(studentA)).studentStatus).toBe('active');

      testApp.clock.set('2030-02-01T10:00:00.000Z');
      const suspended = await setStatus(id, 'suspended').expect(200);
      expect(suspended.body).toMatchObject({
        id,
        status: 'suspended',
        statusChangedAt: '2030-02-01T10:00:00.000Z',
      });
      expect((await me(studentA)).studentStatus).toBe('suspended');

      testApp.clock.set('2030-02-02T10:00:00.000Z');
      await setStatus(id, 'active').expect(200);
      expect((await me(studentA)).studentStatus).toBe('active');

      // Repeating the current status changes nothing, including the change time.
      testApp.clock.set('2030-02-03T10:00:00.000Z');
      const again = await setStatus(id, 'active').expect(200);
      expect(again.body).toMatchObject({ statusChangedAt: '2030-02-02T10:00:00.000Z' });
    });

    it('omits studentStatus for non-students', async () => {
      expect(await me(admin)).not.toHaveProperty('studentStatus');
    });

    it('answers an unknown student 404, a bad status 422', async () => {
      await setStatus('11111111-1111-4111-8111-111111111111', 'suspended').expect(404);
      await setStatus(id, 'banned').expect(422);
    });

    it.each([
      ['coachA', 'coachA$123'],
      ['studentA', 'studentA$123'],
    ])('is admin-only: %s gets 403', async (user, password) => {
      await setStatus(id, 'suspended', basicAuthHeader(user, password)).expect(403);
      await request(testApp.http)
        .patch(`/api/v1/students/${id}`)
        .send({ status: 'active' })
        .expect(401);
    });
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CheckBookingEligibility } from '../src/modules/enrollment';
import { DRIZZLE, type Database } from '../src/shared/db/database.module';
import { enrollments } from '../src/modules/enrollment/infrastructure/schema';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { eq } from 'drizzle-orm';

const admin = basicAuthHeader('admin', 'admin$123');
const studentA = basicAuthHeader('studentA', 'studentA$123');
const studentB = basicAuthHeader('studentB', 'studentB$123');

interface Coach {
  id: string;
  displayName: string;
  timeZone: string;
}

describe('enrollment: student sees the coaches of their program', () => {
  let testApp: TestApp;
  let coachA: string;
  let coachB: string;
  const get = (path: string, auth: string) =>
    request(testApp.http).get(`/api/v1${path}`).set('Authorization', auth);
  const names = async (auth: string) =>
    ((await get('/coaches', auth).expect(200)).body as { items: Coach[] }).items.map(
      (c) => c.displayName,
    );

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
    const all = ((await get('/coaches', admin)).body as { items: Coach[] }).items;
    coachA = all.find((c) => c.displayName === 'Coach A')?.id ?? '';
    coachB = all.find((c) => c.displayName === 'Coach B')?.id ?? '';
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('lists only the coaches of the own program', async () => {
    expect(await names(studentA)).toEqual(['Coach A', 'Coach B']);
    expect(await names(studentB)).toEqual(['Coach B']);
    expect(await names(admin)).toEqual(['Coach A', 'Coach B']);
  });

  it('opens a coach of the own program, without credentials in the payload', async () => {
    const response = await get(`/coaches/${coachB}`, studentB).expect(200);
    expect(response.body).toEqual({
      id: coachB,
      displayName: 'Coach B',
      timeZone: 'Europe/Paris',
    });
  });

  it('answers 404 for a coach outside the own program, and for a non-coach id', async () => {
    const response = await get(`/coaches/${coachA}`, studentB).expect(404);
    expect(response.body).toMatchObject({ code: 'COACH_NOT_VISIBLE' });
    await get('/coaches/00000000-0000-4000-8000-000000000000', studentA).expect(404);
    await get('/coaches/not-a-uuid', studentA).expect(422);
  });

  it('keeps coaches closed to coaches and anonymous callers', async () => {
    await get('/coaches', basicAuthHeader('coachA', 'coachA$123')).expect(403);
    await request(testApp.http).get('/api/v1/coaches').expect(401);
  });

  it('reports booking eligibility: allowed, coach not in program, suspended', async () => {
    const check = testApp.app.get(CheckBookingEligibility);
    const me = async (auth: string) =>
      ((await get('/me', auth).expect(200)).body as { userId: string }).userId;
    const [a, b] = [await me(studentA), await me(studentB)];

    expect(await check.execute(a, coachA)).toBe('allowed');
    expect(await check.execute(b, coachB)).toBe('allowed');
    expect(await check.execute(b, coachA)).toBe('coach_not_in_program');
    expect(await check.execute('00000000-0000-4000-8000-000000000000', coachA)).toBe(
      'coach_not_in_program',
    );

    await testApp.app
      .get<Database>(DRIZZLE)
      .update(enrollments)
      .set({ status: 'suspended' })
      .where(eq(enrollments.studentId, a));
    expect(await check.execute(a, coachA)).toBe('suspended');
    expect(await check.execute(a, 'unknown-coach')).toBe('coach_not_in_program');
  });
});

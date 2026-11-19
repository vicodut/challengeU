import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const admin = basicAuthHeader('admin', 'admin$123');

interface Coach {
  id: string;
  displayName: string;
  timeZone: string;
}
interface Program {
  id: string;
  name: string;
  coaches: { id: string; displayName: string }[];
  students: unknown[];
}

function pick<T extends { id: string }>(items: T[], match: (item: T) => boolean): string {
  const found = items.find(match);
  if (!found) throw new Error('fixture missing');
  return found.id;
}

describe('enrollment: program coaches', () => {
  let testApp: TestApp;
  let coaches: Coach[];
  let coachA: string;
  let coachB: string;
  let academic: string;
  let career: string;

  const getProgram = (id: string) =>
    request(testApp.http).get(`/api/v1/programs/${id}`).set('Authorization', admin);
  const assign = (programId: string, coachId: string) =>
    request(testApp.http)
      .post(`/api/v1/programs/${programId}/coaches`)
      .set('Authorization', admin)
      .send({ coachId });

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
    const list = await request(testApp.http)
      .get('/api/v1/coaches')
      .set('Authorization', admin)
      .expect(200);
    coaches = (list.body as { items: Coach[] }).items;
    const programs = await request(testApp.http)
      .get('/api/v1/programs')
      .set('Authorization', admin);
    const items = (programs.body as { items: { id: string; name: string }[] }).items;
    academic = pick(items, (p) => p.name === 'Academic Success');
    career = pick(items, (p) => p.name === 'Career Launch');
    coachA = pick(coaches, (c) => c.displayName === 'Coach A');
    coachB = pick(coaches, (c) => c.displayName === 'Coach B');
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('lists all coaches with id, display name and time zone', () => {
    expect(coaches).toEqual([
      { id: expect.any(String) as string, displayName: 'Coach A', timeZone: 'America/Toronto' },
      { id: expect.any(String) as string, displayName: 'Coach B', timeZone: 'Europe/Paris' },
    ]);
  });

  it('shows the seeded coaches per program, with a coach in two programs', async () => {
    const a = (await getProgram(academic).expect(200)).body as Program;
    const c = (await getProgram(career).expect(200)).body as Program;
    expect(a).toEqual({
      id: academic,
      name: 'Academic Success',
      coaches: coaches.map(({ id, displayName }) => ({ id, displayName })),
      students: [],
    });
    expect(c.coaches).toEqual([{ id: coachB, displayName: 'Coach B' }]);
  });

  it('assigns a coach and treats assigning twice as a no-op', async () => {
    const created = await request(testApp.http)
      .post('/api/v1/programs')
      .set('Authorization', admin)
      .send({ name: 'Leadership' })
      .expect(201);
    const { id } = created.body as { id: string };

    await assign(id, coachA).expect(204);
    await assign(id, coachA).expect(204);

    expect(((await getProgram(id).expect(200)).body as Program).coaches).toEqual([
      { id: coachA, displayName: 'Coach A' },
    ]);
  });

  it('returns 404 for an unknown program', async () => {
    const unknown = '00000000-0000-4000-8000-000000000000';
    const response = await getProgram(unknown).expect(404);
    expect(response.body).toMatchObject({ code: 'PROGRAM_NOT_FOUND' });
    await assign(unknown, coachA).expect(404);
  });

  it('rejects a user who is not a coach with 422', async () => {
    const response = await assign(academic, '00000000-0000-4000-8000-000000000000').expect(422);
    expect(response.body).toMatchObject({ code: 'COACH_NOT_FOUND' });
  });

  it('rejects a malformed id or body with 422', async () => {
    await getProgram('not-a-uuid').expect(422);
    await request(testApp.http)
      .post(`/api/v1/programs/${academic}/coaches`)
      .set('Authorization', admin)
      .send({})
      .expect(422);
  });

  it('keeps coach and program detail routes admin-only', async () => {
    const auth = basicAuthHeader('coachA', 'coachA$123');
    await request(testApp.http).get('/api/v1/coaches').set('Authorization', auth).expect(403);
    await request(testApp.http)
      .get(`/api/v1/programs/${academic}`)
      .set('Authorization', auth)
      .expect(403);
  });
});

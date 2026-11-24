import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const admin = basicAuthHeader('admin', 'admin$123');

interface Student {
  id: string;
  displayName: string;
  programId: string;
  programName: string;
  status: string;
  statusChangedAt: string;
}

describe('enrollment: update a student', () => {
  let testApp: TestApp;
  let studentA: Student;
  let career: string;
  const patch = (id: string, payload: object, auth = admin) =>
    request(testApp.http).patch(`/api/v1/students/${id}`).set('Authorization', auth).send(payload);
  const read = async (id: string) =>
    (await request(testApp.http).get(`/api/v1/students/${id}`).set('Authorization', admin))
      .body as Student;

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
    const students = await request(testApp.http)
      .get('/api/v1/students')
      .set('Authorization', admin);
    const items = (students.body as { items: Student[] }).items;
    studentA = items.find((s) => s.displayName === 'Student A') ?? (items[0] as Student);
    career = items.find((s) => s.displayName === 'Student B')?.programId ?? '';
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('is admin only', async () => {
    await patch(
      studentA.id,
      { programId: career },
      basicAuthHeader('studentA', 'studentA$123'),
    ).expect(403);
  });

  it('moves a student to another program and keeps the status date', async () => {
    const response = await patch(studentA.id, { programId: career }).expect(200);
    expect(response.body).toMatchObject({
      programId: career,
      programName: 'Career Launch',
      status: 'active',
      statusChangedAt: studentA.statusChangedAt,
    });
  });

  it('answers a move to the same program with a no-op 200', async () => {
    const before = await read(studentA.id);
    const response = await patch(studentA.id, { programId: career }).expect(200);
    expect(response.body).toEqual(before);
  });

  it('moves a suspended student', async () => {
    await patch(studentA.id, { status: 'suspended' }).expect(200);
    const moved = await patch(studentA.id, { programId: studentA.programId }).expect(200);
    expect(moved.body).toMatchObject({ programId: studentA.programId, status: 'suspended' });
  });

  it('applies program and status together, stamping the status date from the clock', async () => {
    testApp.clock.set('2030-06-01T12:00:00.000Z');
    const response = await patch(studentA.id, { programId: career, status: 'active' }).expect(200);
    expect(response.body).toMatchObject({
      programId: career,
      status: 'active',
      statusChangedAt: '2030-06-01T12:00:00.000Z',
    });
  });

  it('applies nothing when the program is unknown: 404 and the status is unchanged', async () => {
    const before = await read(studentA.id);
    const response = await patch(studentA.id, {
      programId: '11111111-1111-4111-8111-111111111111',
      status: 'suspended',
    }).expect(404);
    expect(response.body).toMatchObject({ code: 'PROGRAM_NOT_FOUND' });
    expect(await read(studentA.id)).toEqual(before);
  });

  it('rejects an empty update with 422 EMPTY_UPDATE', async () => {
    const response = await patch(studentA.id, {}).expect(422);
    expect(response.body).toMatchObject({ code: 'EMPTY_UPDATE' });
  });

  it('rejects an invalid status and an unknown student', async () => {
    await patch(studentA.id, { status: 'gone' }).expect(422);
    await patch('11111111-1111-4111-8111-111111111111', { status: 'active' }).expect(404);
  });
});

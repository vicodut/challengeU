import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const coachA = basicAuthHeader('coachA', 'coachA$123');
const coachB = basicAuthHeader('coachB', 'coachB$123');

describe('coach deletes an empty availability block', () => {
  let testApp: TestApp;
  const api = (method: 'get' | 'delete', auth: string, path = '') =>
    request(testApp.http)[method](`/api/v1/availability${path}`).set('Authorization', auth);
  const publish = async (auth: string, startsAt: string) =>
    (
      await request(testApp.http)
        .post('/api/v1/availability')
        .set('Authorization', auth)
        .send({ startsAt, durationMinutes: 30 })
        .expect(201)
    ).body as { id: string };

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('deletes an empty block, which is then no longer listed or openable', async () => {
    const { id } = await publish(coachA, '2030-01-02T10:00:00.000Z');

    const res = await api('delete', coachA, `/${id}`).expect(200);
    expect(res.body).toEqual({ cancelledSessionCount: 0 });

    const list = (await api('get', coachA).expect(200)).body as { items: { id: string }[] };
    expect(list.items.map((b) => b.id)).not.toContain(id);
    await api('get', coachA, `/${id}`).expect(404);
    await api('delete', coachA, `/${id}`).expect(404);
  });

  it("answers 404 for another coach's block and leaves it in place", async () => {
    const { id } = await publish(coachB, '2030-01-02T12:00:00.000Z');

    const res = await api('delete', coachA, `/${id}`).expect(404);
    expect(res.body).toMatchObject({ code: 'BLOCK_NOT_FOUND' });
    await api('get', coachB, `/${id}`).expect(200);
  });

  it('answers 404 for a malformed id', async () => {
    await api('delete', coachA, '/nope').expect(404);
  });
});

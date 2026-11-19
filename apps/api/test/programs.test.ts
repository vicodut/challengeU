import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const admin = basicAuthHeader('admin', 'admin$123');

describe('enrollment: programs', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
    await testApp.seed();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('lists the seeded programs', async () => {
    const response = await request(testApp.http)
      .get('/api/v1/programs')
      .set('Authorization', admin)
      .expect(200);

    expect(response.body).toEqual({
      items: [
        { id: expect.any(String) as string, name: 'Academic Success' },
        { id: expect.any(String) as string, name: 'Career Launch' },
      ],
    });
  });

  it('lets an admin create a program that then shows in the list', async () => {
    const created = await request(testApp.http)
      .post('/api/v1/programs')
      .set('Authorization', admin)
      .send({ name: '  Leadership  ' })
      .expect(201);
    expect(created.body).toEqual({ id: expect.any(String) as string, name: 'Leadership' });

    const list = await request(testApp.http)
      .get('/api/v1/programs')
      .set('Authorization', admin)
      .expect(200);
    expect((list.body as { items: { name: string }[] }).items.map((p) => p.name)).toContain(
      'Leadership',
    );
  });

  it('rejects a duplicate name with 409', async () => {
    const response = await request(testApp.http)
      .post('/api/v1/programs')
      .set('Authorization', admin)
      .send({ name: 'Career Launch' })
      .expect(409);
    expect(response.body).toMatchObject({ code: 'PROGRAM_NAME_TAKEN' });
  });

  it.each([{}, { name: '   ' }, { name: '' }, { name: 'x'.repeat(101) }])(
    'rejects an invalid body %j with 422',
    async (body) => {
      await request(testApp.http)
        .post('/api/v1/programs')
        .set('Authorization', admin)
        .send(body)
        .expect(422);
    },
  );

  it.each([
    ['studentA', 'studentA$123'],
    ['coachA', 'coachA$123'],
  ])('gives %s a 403 on both routes', async (username, password) => {
    const auth = basicAuthHeader(username, password);
    await request(testApp.http).get('/api/v1/programs').set('Authorization', auth).expect(403);
    await request(testApp.http)
      .post('/api/v1/programs')
      .set('Authorization', auth)
      .send({ name: 'Nope' })
      .expect(403);
  });

  it('requires authentication', async () => {
    await request(testApp.http).get('/api/v1/programs').expect(401);
  });
});

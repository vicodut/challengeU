import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const coachA = basicAuthHeader('coachA', 'coachA$123');
const coachB = basicAuthHeader('coachB', 'coachB$123');

interface Listed {
  id: string;
  startsAt: string;
  durationMinutes: number;
  bookedSessionCount: number;
}
interface Page {
  items: Listed[];
  nextCursor: string | null;
}

describe('coach lists and opens their availability blocks', () => {
  let testApp: TestApp;
  const get = (auth: string, path: string) =>
    request(testApp.http).get(`/api/v1/availability${path}`).set('Authorization', auth);
  const publish = (auth: string, startsAt: string, durationMinutes: number) =>
    request(testApp.http)
      .post('/api/v1/availability')
      .set('Authorization', auth)
      .send({ startsAt, durationMinutes })
      .expect(201);
  const starts = Array.from({ length: 5 }, (_, i) => `2030-01-0${String(i + 2)}T10:00:00.000Z`);

  beforeAll(async () => {
    testApp = await createTestApp(); // the fake clock reads 2030-01-01T00:00Z
    await testApp.seed();
    for (const startsAt of starts) await publish(coachA, startsAt, 30);
    await publish(coachB, '2030-01-02T12:00:00Z', 60);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("lists only the caller's blocks, by start, with a zero booked count", async () => {
    const body = (await get(coachA, '').expect(200)).body as Page;

    expect(body.items.map((b) => b.startsAt)).toEqual(starts);
    expect(body.items[0]).toMatchObject({ durationMinutes: 30, bookedSessionCount: 0 });
    expect(body.nextCursor).toBeNull();
  });

  it('pages through all blocks with limit and cursor', async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const body = (await get(coachA, `?limit=2${cursor ? `&cursor=${cursor}` : ''}`).expect(200))
        .body as Page;
      seen.push(...body.items.map((b) => b.startsAt));
      cursor = body.nextCursor;
      pages += 1;
    } while (cursor);

    expect(pages).toBe(3);
    expect(seen).toEqual(starts);
  });

  it('filters by from (default now) and to (exclusive)', async () => {
    const window = (await get(coachA, '?from=2030-01-03T00:00:00Z&to=2030-01-05T10:00:00Z'))
      .body as Page;
    expect(window.items.map((b) => b.startsAt)).toEqual(starts.slice(1, 3));

    testApp.clock.set('2030-01-04T00:00:00Z');
    const fromNow = (await get(coachA, '')).body as Page;
    testApp.clock.set('2030-01-01T00:00:00Z');
    expect(fromNow.items.map((b) => b.startsAt)).toEqual(starts.slice(2));
  });

  it.each(['?limit=0', '?limit=201', '?limit=x', '?from=yesterday', '?cursor=garbage'])(
    'rejects %s with 422',
    async (query) => {
      await get(coachA, query).expect(422);
    },
  );

  it('opens an owned block and hides it from everyone else (404)', async () => {
    const [first] = ((await get(coachA, '').expect(200)).body as Page).items as [Listed];

    expect((await get(coachA, `/${first.id}`).expect(200)).body).toEqual(first);
    await get(coachB, `/${first.id}`).expect(404);
    await get(coachA, '/00000000-0000-4000-8000-000000000000').expect(404);
    await get(coachA, '/not-a-uuid').expect(404);
    await get(basicAuthHeader('studentA', 'studentA$123'), `/${first.id}`).expect(403);
    await request(testApp.http).get(`/api/v1/availability/${first.id}`).expect(401);
  });
});

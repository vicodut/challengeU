import request from 'supertest';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedBlocks } from '../src/db/seed-blocks';
import { PublishBlock } from '../src/modules/booking';
import { AuthenticateUser } from '../src/modules/identity';
import { PG_POOL } from '../src/shared/db/database.module';
import { basicAuthHeader } from './helpers/basic-auth';
import { createTestApp, type TestApp } from './helpers/create-test-app';

const coachA = basicAuthHeader('coachA', 'coachA$123');
const coachB = basicAuthHeader('coachB', 'coachB$123');

describe('coach publishes an availability block', () => {
  let testApp: TestApp;
  const publish = (auth: string, body: object) =>
    request(testApp.http).post('/api/v1/availability').set('Authorization', auth).send(body);

  beforeAll(async () => {
    testApp = await createTestApp(); // the fake clock reads 2030-01-01T00:00Z
    await testApp.seed();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('creates a 60-minute and a 30-minute block (201)', async () => {
    const hour = await publish(coachA, {
      startsAt: '2030-01-07T14:00:00.000Z',
      durationMinutes: 60,
    });
    const half = await publish(coachA, { startsAt: '2030-01-07T15:30:00Z', durationMinutes: 30 });

    expect(hour.status).toBe(201);
    expect(hour.body).toEqual({
      id: expect.any(String) as string,
      startsAt: '2030-01-07T14:00:00.000Z',
      durationMinutes: 60,
    });
    expect(half.status).toBe(201);
  });

  it('accepts a block arbitrarily far ahead', async () => {
    await publish(coachA, { startsAt: '2090-06-01T09:00:00Z', durationMinutes: 30 }).expect(201);
  });

  it('allows back-to-back blocks and the same time for another coach', async () => {
    await publish(coachA, { startsAt: '2030-01-07T13:00:00Z', durationMinutes: 60 }).expect(201);
    await publish(coachB, { startsAt: '2030-01-07T20:00:00Z', durationMinutes: 60 }).expect(201);
  });

  it('is coach only', async () => {
    const body = { startsAt: '2030-01-08T14:00:00Z', durationMinutes: 60 };
    await publish(basicAuthHeader('studentA', 'studentA$123'), body).expect(403);
    await publish(basicAuthHeader('admin', 'admin$123'), body).expect(403);
    await request(testApp.http).post('/api/v1/availability').send(body).expect(401);
  });

  it.each([15, 45, 90, 0, -30])('rejects a %i-minute duration', async (durationMinutes) => {
    const response = await publish(coachA, { startsAt: '2030-01-09T14:00:00Z', durationMinutes });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'INVALID_BLOCK_DURATION' });
  });

  it.each([
    '2030-01-09T14:15:00Z',
    '2030-01-09T14:45:00Z',
    '2030-01-09T14:00:30Z',
    '2030-01-09T14:00:00.500Z',
  ])('rejects %s as not aligned', async (startsAt) => {
    const response = await publish(coachA, { startsAt, durationMinutes: 30 });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'BLOCK_NOT_ALIGNED' });
  });

  it('rejects a block in the past, judged by the injected clock', async () => {
    const body = { startsAt: '2030-01-10T10:00:00Z', durationMinutes: 30 };
    testApp.clock.set('2030-01-10T10:00:00Z');
    const atNow = await publish(coachA, body);
    testApp.clock.set('2030-01-10T09:59:00Z');
    const inFuture = await publish(coachA, body);
    testApp.clock.set('2030-01-01T00:00:00Z');

    expect(atNow.status).toBe(422);
    expect(atNow.body).toMatchObject({ code: 'BLOCK_IN_PAST' });
    expect(inFuture.status).toBe(201);
  });

  it('rejects a start that is not a UTC instant or an integer duration with a validation error', async () => {
    for (const body of [
      { startsAt: '2030-01-11T14:00:00+02:00', durationMinutes: 30 },
      { startsAt: 'tomorrow', durationMinutes: 30 },
      { durationMinutes: 30 },
      { startsAt: '2030-01-11T14:00:00Z', durationMinutes: '30' },
    ]) {
      const response = await publish(coachA, body);
      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR' });
    }
  });

  it.each([
    ['the same time', '2030-01-12T14:00:00Z', 60],
    ['inside', '2030-01-12T14:30:00Z', 30],
    ['overlapping the start', '2030-01-12T13:30:00Z', 60],
    ['overlapping the end', '2030-01-12T14:30:00Z', 60],
    ['covering it', '2030-01-12T13:30:00Z', 60],
  ])('rejects a block %s as an overlap (409)', async (_label, startsAt, durationMinutes) => {
    await publish(coachA, { startsAt: '2030-01-12T14:00:00Z', durationMinutes: 60 }).catch(
      () => undefined,
    );
    const response = await publish(coachA, { startsAt, durationMinutes });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: 'BLOCK_OVERLAP' });
  });

  it('answers BLOCK_OVERLAP when the database constraint catches an overlap the pre-check missed', async () => {
    const blocks = testApp.app.get(PublishBlock)['blocks'];
    const original = blocks.overlaps.bind(blocks);
    blocks.overlaps = () => Promise.resolve(false); // simulate losing the race to the pre-check
    try {
      const response = await publish(coachA, {
        startsAt: '2030-01-12T14:00:00Z',
        durationMinutes: 30,
      });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({ code: 'BLOCK_OVERLAP' });
    } finally {
      blocks.overlaps = original;
    }
  });

  it('gives exactly one 201 when overlapping publishes race', async () => {
    const starts = ['14:00', '14:00', '14:30', '14:00', '14:30', '14:00', '14:30', '14:00'];
    const responses = await Promise.all(
      starts.map((time) =>
        publish(coachA, { startsAt: `2030-01-15T${time}:00Z`, durationMinutes: 60 }),
      ),
    );
    const statuses = responses.map((response) => response.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(starts.length - 1);
    const pool = testApp.app.get<Pool>(PG_POOL);
    const { rows } = await pool.query(
      "SELECT 1 FROM availability_blocks WHERE starts_at >= '2030-01-15T00:00Z' AND starts_at < '2030-01-16T00:00Z'",
    );
    expect(rows).toHaveLength(1);
  });

  it('seeds idempotent 30- and 60-minute blocks for both coaches over the next 2 weeks', async () => {
    const now = new Date('2030-01-01T12:00:00Z');
    const seed = () =>
      seedBlocks(testApp.app.get(PublishBlock), testApp.app.get(AuthenticateUser), now);
    await seed();
    await seed();
    const pool = testApp.app.get<Pool>(PG_POOL);
    const { rows } = await pool.query<{ username: string; minutes: number; n: string }>(
      `SELECT u.username, extract(epoch FROM b.ends_at - b.starts_at)::int / 60 AS minutes, count(*) AS n
       FROM availability_blocks b JOIN users u ON u.id = b.coach_id
       WHERE u.username IN ('coachA', 'coachB') AND b.starts_at BETWEEN '2030-01-02' AND '2030-01-16'
       GROUP BY 1, 2 ORDER BY 1, 2`,
    );

    // 10 weekdays x (2 sixty-minute + 2 thirty-minute) blocks per coach; extras from earlier tests aside.
    expect(rows.map((r) => [r.username, r.minutes])).toEqual([
      ['coachA', 30],
      ['coachA', 60],
      ['coachB', 30],
      ['coachB', 60],
    ]);
    expect(Number(rows.find((r) => r.username === 'coachB' && r.minutes === 30)?.n)).toBe(20);
  });
});

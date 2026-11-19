import { describe, expect, it } from 'vitest';
import { zonedToUtc } from '@/shared/lib/zoned-time';

const iso = (local: string, zone: string) => zonedToUtc(local, zone)?.toISOString() ?? null;

describe('zonedToUtc', () => {
  it.each([
    ['2030-01-07T09:00', 'America/Toronto', '2030-01-07T14:00:00.000Z'],
    ['2030-07-01T09:00', 'America/Toronto', '2030-07-01T13:00:00.000Z'],
    ['2024-01-08T09:00', 'America/Vancouver', '2024-01-08T17:00:00.000Z'],
    ['2030-07-01T09:30', 'Europe/Paris', '2030-07-01T07:30:00.000Z'],
    ['2030-01-07T09:00', 'Asia/Kolkata', '2030-01-07T03:30:00.000Z'],
  ])('converts %s in %s', (local, zone, utc) => {
    expect(iso(local, zone)).toBe(utc);
  });

  it('refuses a time the clocks skip (spring forward) and a time they repeat (fall back)', () => {
    expect(iso('2030-03-10T02:30', 'America/Toronto')).toBeNull();
    expect(iso('2030-11-03T01:30', 'America/Toronto')).toBeNull();
    expect(iso('2030-03-31T02:30', 'Europe/Paris')).toBeNull();
    expect(iso('2030-10-27T02:30', 'Europe/Paris')).toBeNull();
  });

  it('converts times either side of a change normally', () => {
    expect(iso('2030-03-10T03:00', 'America/Toronto')).toBe('2030-03-10T07:00:00.000Z');
    expect(iso('2030-11-03T02:00', 'America/Toronto')).toBe('2030-11-03T07:00:00.000Z');
  });

  it('refuses malformed input', () => {
    expect(iso('', 'Europe/Paris')).toBeNull();
  });
});

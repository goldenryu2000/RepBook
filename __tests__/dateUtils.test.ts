/**
 * @file dateUtils.test.ts
 * Tests for the local-timezone-aware date string utility.
 * This logic exists inline in index.tsx; we extract it here to verify correctness.
 *
 * The bug: new Date().toISOString() always returns UTC. For users east of UTC,
 * midnight local time is still "yesterday" in UTC.
 * Fix: subtract getTimezoneOffset() before calling toISOString().
 */

import { describe, expect, it } from '@jest/globals';

/** Mirror of the local-date function used in index.tsx */
function toLocalDateStr(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().split('T')[0];
}

describe('toLocalDateStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = toLocalDateStr(new Date('2026-04-19T10:00:00'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns local date, not UTC date, for a UTC-midnight boundary', () => {
    // Simulate a user at UTC+5:30 (India): at UTC 23:30 on April 18, local time is 05:00 April 19
    const utcDate = new Date('2026-04-18T23:30:00.000Z');
    // Mock getTimezoneOffset to return -330 (IST is UTC+5:30 → offset = -330 min)
    const origFn = utcDate.getTimezoneOffset.bind(utcDate);
    utcDate.getTimezoneOffset = () => -330;

    const result = toLocalDateStr(utcDate);
    expect(result).toBe('2026-04-19'); // local date, not 2026-04-18

    // Restore original
    utcDate.getTimezoneOffset = origFn;
  });

  it('handles UTC negative offset (UTC-5) without shifting date forward', () => {
    // At UTC 02:00 on April 19, a UTC-5 user is still in April 18
    const utcDate = new Date('2026-04-19T02:00:00.000Z');
    utcDate.getTimezoneOffset = () => 300; // UTC-5 = +300 min offset

    const result = toLocalDateStr(utcDate);
    expect(result).toBe('2026-04-18'); // local date is still the 18th
  });
});

/**
 * @file templateScheduling.test.ts
 * Tests for the template priority/scheduling logic used in the Log tab.
 *
 * Logic under test (mirrors index.tsx):
 *   1. A template matches today if it has today's date in assigned_dates OR today's day-of-week in assigned_days.
 *   2. Templates with an exact date match rank above recurring day matches.
 */

import { describe, expect, it } from '@jest/globals';
import type { Template, TemplateExercise } from '../types';

type FullTemplate = Template & { exercises: TemplateExercise[] };

// ─── Helpers mirroring index.tsx logic ───────────────────────────────────────

function toLocalDateStr(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().split('T')[0];
}

function getScheduledToday(
  templates: FullTemplate[],
  now: Date
): { suggested: FullTemplate | null; pending: FullTemplate[] } {
  const todayIdx = now.getDay();
  const todayStr = toLocalDateStr(now);

  const todays = templates.filter(t => {
    const hasDate = t.assigned_dates?.includes(todayStr);
    const hasDay = t.assigned_days?.includes(todayIdx);
    return hasDate || hasDay;
  });

  // Templates with an exact date match should surface first
  todays.sort((a, b) => {
    const aDate = a.assigned_dates?.includes(todayStr) ? 1 : 0;
    const bDate = b.assigned_dates?.includes(todayStr) ? 1 : 0;
    return bDate - aDate;
  });

  return {
    suggested: todays.length > 0 ? todays[0] : null,
    pending: todays.slice(1),
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-19T10:00:00.000Z'); // Sunday, day index 0
const TODAY_STR = toLocalDateStr(TODAY);

const makeTemplate = (overrides: Partial<FullTemplate>): FullTemplate => ({
  id: 'tpl-default',
  name: 'Default',
  assigned_days: [],
  assigned_dates: [],
  created_at: '2026-01-01T00:00:00Z',
  exercises: [],
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getScheduledToday', () => {
  it('returns null suggested when no templates match today', () => {
    const templates = [makeTemplate({ assigned_days: [1, 2], assigned_dates: [] })]; // Mon & Tue only
    const { suggested, pending } = getScheduledToday(templates, TODAY);
    expect(suggested).toBeNull();
    expect(pending).toHaveLength(0);
  });

  it('matches a template by day-of-week', () => {
    const t = makeTemplate({ id: 'day-match', assigned_days: [0], assigned_dates: [] }); // Sun = 0
    const { suggested } = getScheduledToday([t], TODAY);
    expect(suggested?.id).toBe('day-match');
  });

  it('matches a template by specific date', () => {
    const t = makeTemplate({ id: 'date-match', assigned_days: [], assigned_dates: [TODAY_STR] });
    const { suggested } = getScheduledToday([t], TODAY);
    expect(suggested?.id).toBe('date-match');
  });

  it('prioritises a specific-date template over a recurring-day template', () => {
    const dayTemplate = makeTemplate({ id: 'recurring', name: 'Recurring', assigned_days: [0] });
    const dateTemplate = makeTemplate({
      id: 'specific',
      name: 'Specific',
      assigned_dates: [TODAY_STR],
    });

    const { suggested, pending } = getScheduledToday([dayTemplate, dateTemplate], TODAY);
    expect(suggested?.id).toBe('specific');
    expect(pending[0].id).toBe('recurring');
  });

  it('puts all extra matches into pending', () => {
    const t1 = makeTemplate({ id: 't1', assigned_days: [0] });
    const t2 = makeTemplate({ id: 't2', assigned_days: [0] });
    const t3 = makeTemplate({ id: 't3', assigned_dates: [TODAY_STR] });

    const { suggested, pending } = getScheduledToday([t1, t2, t3], TODAY);
    expect(suggested?.id).toBe('t3');
    expect(pending).toHaveLength(2);
  });

  it('ignores templates assigned to other days or dates', () => {
    const templates = [
      makeTemplate({ id: 'other-day', assigned_days: [3] }), // Wednesday
      makeTemplate({ id: 'other-date', assigned_dates: ['2026-01-01'] }),
    ];
    const { suggested } = getScheduledToday(templates, TODAY);
    expect(suggested).toBeNull();
  });
});

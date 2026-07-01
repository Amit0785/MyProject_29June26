import { normalizeReminderDate } from '../src/utils/helpers/date';

describe('normalizeReminderDate', () => {
  it('keeps a YYYY-MM-DD due date at the start of the selected day', () => {
    const date = normalizeReminderDate('2026-07-15');

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(15);
    expect(date?.getHours()).toBe(0);
    expect(date?.getMinutes()).toBe(0);
    expect(date?.getSeconds()).toBe(0);
  });

  it('preserves the time for full datetime strings', () => {
    const date = normalizeReminderDate('2026-07-15T14:30:00.000Z');

    expect(date).not.toBeNull();
    expect(date?.getHours()).toBe(14);
    expect(date?.getMinutes()).toBe(30);
  });

  it('returns null for an invalid date string', () => {
    expect(normalizeReminderDate('not-a-date')).toBeNull();
  });
});

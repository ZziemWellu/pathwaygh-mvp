import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('formats day-month-year, not the US month/day order', () => {
    expect(formatDate('2026-10-22T15:30:00Z')).toBe('22 Oct 2026');
  });

  it('spells the month out in long form', () => {
    expect(formatDate('2026-10-22T15:30:00Z', { long: true })).toBe('22 October 2026');
  });

  it('reads a bare calendar date as that day in every timezone', () => {
    // new Date('2026-12-31') is UTC midnight, which is 30 Dec west of UTC.
    expect(formatDate('2026-12-31', { long: true })).toBe('31 December 2026');
  });

  it('accepts Date objects', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('5 Jan 2026');
  });

  it('returns the fallback for missing or unparseable values', () => {
    expect(formatDate(null, { fallback: 'N/A' })).toBe('N/A');
    expect(formatDate(undefined, { fallback: 'Recently' })).toBe('Recently');
    expect(formatDate('', { fallback: 'N/A' })).toBe('N/A');
    expect(formatDate('Announced annually', { fallback: 'N/A' })).toBe('N/A');
    expect(formatDate(null)).toBe('');
  });
});

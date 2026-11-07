import { describe, expect, it } from 'vitest';
import { practiceLabel, seniorExamName } from './examNames';

describe('exam names', () => {
  it('uses SSCE for Nigeria and WASSCE everywhere else', () => {
    expect(seniorExamName('NG')).toBe('SSCE');
    for (const country of ['GH', 'SL', 'LR', 'GM', undefined]) {
      expect(seniorExamName(country)).toBe('WASSCE');
    }
  });

  it.each([
    ['jhs', 'GH', 'BECE practice questions'],
    ['jhs', 'NG', 'BECE practice questions'],
    ['shs', 'GH', 'WASSCE practice questions'],
    ['shs', 'NG', 'SSCE practice questions'],
    ['primary', 'GH', 'Practice questions'],
    [null, 'GH', 'Practice questions'],
  ])('labels practice for %s in %s as "%s"', (level, country, expected) => {
    expect(practiceLabel(level, country)).toBe(expected);
  });

  it('never calls these questions past questions', () => {
    for (const level of ['primary', 'jhs', 'shs', null]) {
      expect(practiceLabel(level, 'GH')).not.toMatch(/past/i);
    }
  });
});

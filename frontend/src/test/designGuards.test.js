import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canUseSchoolSelection, getNavItems } from '../components/common/navItems';

const t = (key) => key;
const ids = (user) => getNavItems(user, t).map((item) => item.id);

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return ['.jsx', '.css'].includes(extname(name)) && !name.includes('.test.') ? [path] : [];
  });

const remOf = (text) => parseFloat(text);

describe('text sizes', () => {
  const files = sourceFiles(resolve(process.cwd(), 'src'));
  const contents = files.map((file) => [file, readFileSync(file, 'utf8')]);

  it('are never fixed in pixels, so the text-size setting and phone settings can scale them', () => {
    const fixed = contents.flatMap(([file, text]) =>
      (text.match(/fontSize: *['"]\d+(\.\d+)?px|font-size: *\d+(\.\d+)?px/g) || []).map((match) => `${file}: ${match}`),
    );
    expect(fixed).toEqual([]);
  });

  it('never go below 13px at the normal setting', () => {
    const small = contents.flatMap(([file, text]) =>
      [...text.matchAll(/(?:fontSize: *['"]|font-size: *)(\d*\.?\d+)rem/g)]
        .filter((match) => remOf(match[1]) * 16 < 13)
        .map((match) => `${file}: ${match[0]}`),
    );
    expect(small).toEqual([]);
  });
});

describe('menu', () => {
  it('keeps the agreed order, with Profile reached from the name instead', () => {
    expect(ids({ level: 'shs', country: 'GH' })).toEqual([
      'home', 'plan', 'learn', 'practice', 'flashcards', 'progress', 'explore', 'community',
    ]);
  });

  it('hides Community from primary pupils', () => {
    expect(ids({ level: 'primary', country: 'GH' })).not.toContain('community');
  });

  it('only offers School Selection to JHS students in Ghana, and staff', () => {
    expect(canUseSchoolSelection({ level: 'jhs', country: 'GH' })).toBe(true);
    expect(canUseSchoolSelection({ level: 'shs', country: 'GH' })).toBeFalsy();
    expect(canUseSchoolSelection({ level: 'jhs', country: 'NG' })).toBeFalsy();
    expect(canUseSchoolSelection({ is_school_admin: true, country: 'NG' })).toBe(true);
  });
});

/**
 * Tests for the verse and reflection datasets.
 * Validates data integrity, required fields, and theme coverage.
 */
import verses from '../src/data/verses';
import reflections from '../src/data/reflections';

describe('Verse dataset', () => {
  test('contains at least 50 verses', () => {
    expect(verses.length).toBeGreaterThanOrEqual(50);
  });

  test('every verse has required fields', () => {
    verses.forEach((v) => {
      expect(v).toHaveProperty('id');
      expect(v).toHaveProperty('theme');
      expect(v).toHaveProperty('reference');
      expect(v).toHaveProperty('esv');
      expect(v).toHaveProperty('niv');
      expect(v).toHaveProperty('kjv');
    });
  });

  test('every verse has non-empty text for all translations', () => {
    verses.forEach((v) => {
      expect(v.esv.length).toBeGreaterThan(0);
      expect(v.niv.length).toBeGreaterThan(0);
      expect(v.kjv.length).toBeGreaterThan(0);
    });
  });

  test('verse IDs are unique', () => {
    const ids = verses.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('covers all four themes', () => {
    const themes = new Set(verses.map((v) => v.theme));
    expect(themes).toContain('wisdom');
    expect(themes).toContain('peace');
    expect(themes).toContain('discipline');
    expect(themes).toContain('work');
  });

  test('each theme has at least 5 verses', () => {
    const byTheme = {};
    verses.forEach((v) => {
      byTheme[v.theme] = (byTheme[v.theme] || 0) + 1;
    });
    Object.values(byTheme).forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(5);
    });
  });

  test('references follow "Book Chapter:Verse" format', () => {
    verses.forEach((v) => {
      expect(v.reference).toMatch(/^[\w\s]+ \d+:\d/);
    });
  });
});

describe('Reflections dataset', () => {
  test('has preFocus and breakTime arrays', () => {
    expect(Array.isArray(reflections.preFocus)).toBe(true);
    expect(Array.isArray(reflections.breakTime)).toBe(true);
  });

  test('each has at least 5 prompts', () => {
    expect(reflections.preFocus.length).toBeGreaterThanOrEqual(5);
    expect(reflections.breakTime.length).toBeGreaterThanOrEqual(5);
  });

  test('all prompts are non-empty strings', () => {
    [...reflections.preFocus, ...reflections.breakTime].forEach((p) => {
      expect(typeof p).toBe('string');
      expect(p.length).toBeGreaterThan(0);
    });
  });
});

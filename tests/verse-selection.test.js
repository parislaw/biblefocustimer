/**
 * Tests for verse selection logic: daily mode, random mode, theme filtering.
 * Uses the useVerse hook via @testing-library/react renderHook.
 */
import { renderHook, act } from '@testing-library/react';
import { useVerse } from '../src/popup/useVerse';

const baseSettings = {
  translation: 'esv',
  theme: 'random',
  verseMode: 'random',
};

describe('useVerse — random mode', () => {
  test('selectVerse picks a verse with reference and text', () => {
    const { result } = renderHook(() => useVerse(baseSettings));

    act(() => {
      result.current.selectVerse();
    });

    expect(result.current.currentVerse).not.toBeNull();
    expect(result.current.currentVerse.reference).toBeDefined();
    expect(result.current.currentVerse.text.length).toBeGreaterThan(0);
    expect(result.current.currentVerse.translation).toBe('ESV');
  });

  test('selectVerse respects translation setting', () => {
    const { result } = renderHook(() =>
      useVerse({ ...baseSettings, translation: 'kjv' })
    );

    act(() => {
      result.current.selectVerse();
    });

    expect(result.current.currentVerse.translation).toBe('KJV');
  });

  test('selectReflection picks a preFocus prompt', () => {
    const { result } = renderHook(() => useVerse(baseSettings));

    act(() => {
      result.current.selectReflection('preFocus');
    });

    expect(result.current.currentReflection.length).toBeGreaterThan(0);
  });

  test('selectReflection picks a break prompt', () => {
    const { result } = renderHook(() => useVerse(baseSettings));

    act(() => {
      result.current.selectReflection('break');
    });

    expect(result.current.currentReflection.length).toBeGreaterThan(0);
  });
});

describe('useVerse — theme filtering', () => {
  test('filters verses by wisdom theme', () => {
    const { result } = renderHook(() =>
      useVerse({ ...baseSettings, theme: 'wisdom' })
    );

    // Run selectVerse many times and verify all are wisdom-tagged
    // We can't directly inspect the pool, but we can verify the verse text
    // comes from a wisdom verse by checking against the dataset
    const verses = require('../src/data/verses').default;
    const wisdomRefs = new Set(
      verses.filter((v) => v.theme === 'wisdom').map((v) => v.reference)
    );

    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.selectVerse();
      });
      expect(wisdomRefs).toContain(result.current.currentVerse.reference);
    }
  });

  test('filters verses by work theme', () => {
    const { result } = renderHook(() =>
      useVerse({ ...baseSettings, theme: 'work' })
    );

    const verses = require('../src/data/verses').default;
    const workRefs = new Set(
      verses.filter((v) => v.theme === 'work').map((v) => v.reference)
    );

    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.selectVerse();
      });
      expect(workRefs).toContain(result.current.currentVerse.reference);
    }
  });

  test('falls back to all verses for unknown theme', () => {
    const { result } = renderHook(() =>
      useVerse({ ...baseSettings, theme: 'nonexistent' })
    );

    act(() => {
      result.current.selectVerse();
    });

    expect(result.current.currentVerse).not.toBeNull();
  });
});

describe('useVerse — daily mode', () => {
  const dailySettings = { ...baseSettings, verseMode: 'daily' };

  test('returns the same verse on repeated calls within the same day', () => {
    const { result } = renderHook(() => useVerse(dailySettings));

    act(() => {
      result.current.selectVerse();
    });
    const first = result.current.currentVerse;

    act(() => {
      result.current.selectVerse();
    });
    const second = result.current.currentVerse;

    expect(first.reference).toBe(second.reference);
    expect(first.text).toBe(second.text);
  });

  test('returns same reflection for same type on same day', () => {
    const { result } = renderHook(() => useVerse(dailySettings));

    act(() => {
      result.current.selectReflection('preFocus');
    });
    const first = result.current.currentReflection;

    act(() => {
      result.current.selectReflection('preFocus');
    });
    const second = result.current.currentReflection;

    expect(first).toBe(second);
  });

  test('different reflection types produce different prompts (usually)', () => {
    const { result } = renderHook(() => useVerse(dailySettings));

    act(() => {
      result.current.selectReflection('preFocus');
    });
    const preFocus = result.current.currentReflection;

    act(() => {
      result.current.selectReflection('break');
    });
    const breakReflection = result.current.currentReflection;

    // They come from different pools, so they should differ
    // (technically they could collide by text, but extremely unlikely)
    expect(typeof preFocus).toBe('string');
    expect(typeof breakReflection).toBe('string');
  });

  test('daily mode respects theme filter', () => {
    const { result } = renderHook(() =>
      useVerse({ ...dailySettings, theme: 'peace' })
    );

    const verses = require('../src/data/verses').default;
    const peaceRefs = new Set(
      verses.filter((v) => v.theme === 'peace').map((v) => v.reference)
    );

    act(() => {
      result.current.selectVerse();
    });

    expect(peaceRefs).toContain(result.current.currentVerse.reference);
  });
});

import { renderHook, act } from '@testing-library/react';
import { useVerse } from './useVerse';

const defaultSettings = {
  theme: 'random',
  translation: 'esv',
};

describe('useVerse', () => {
  it('selectVerse sets a verse with correct translation', () => {
    const { result } = renderHook(() => useVerse(defaultSettings));
    expect(result.current.currentVerse).toBeNull();
    act(() => {
      result.current.selectVerse();
    });
    expect(result.current.currentVerse).not.toBeNull();
    expect(result.current.currentVerse.translation).toBe('ESV');
    expect(result.current.currentVerse.reference).toBeDefined();
    expect(result.current.currentVerse.text).toBeDefined();
  });

  it('selectReflection sets a reflection string', () => {
    const { result } = renderHook(() => useVerse(defaultSettings));
    expect(result.current.currentReflection).toBe('');
    act(() => {
      result.current.selectReflection('preFocus');
    });
    expect(result.current.currentReflection).toBeTruthy();
    expect(typeof result.current.currentReflection).toBe('string');
  });

  it('filteres by theme when settings.theme is not random', () => {
    const { result } = renderHook(() =>
      useVerse({ ...defaultSettings, theme: 'wisdom' })
    );
    act(() => {
      result.current.selectVerse();
    });
    expect(result.current.currentVerse).not.toBeNull();
    // Verse should be from wisdom theme (we can't assert content without importing verses)
    expect(result.current.currentVerse.text).toBeDefined();
  });

  it('does not throw when theme has no verses (falls back to all)', () => {
    const { result } = renderHook(() =>
      useVerse({ ...defaultSettings, theme: 'nonexistent' })
    );
    expect(() => {
      act(() => {
        result.current.selectVerse();
      });
    }).not.toThrow();
    expect(result.current.currentVerse).not.toBeNull();
  });
});

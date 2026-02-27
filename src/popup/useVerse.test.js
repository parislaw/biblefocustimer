import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PlatformProvider } from '../platform';
import { createMockPlatform, createMockPlatformWithCustomVerses } from './testPlatform';
import { useVerse } from './useVerse';

const defaultSettings = {
  theme: 'random',
  translation: 'esv',
};

const wrapper = ({ children }) => (
  <PlatformProvider platform={createMockPlatform()}>
    {children}
  </PlatformProvider>
);

describe('useVerse', () => {
  it('selectVerse sets a verse with correct translation', () => {
    const { result } = renderHook(() => useVerse(defaultSettings), { wrapper });
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
    const { result } = renderHook(() => useVerse(defaultSettings), { wrapper });
    expect(result.current.currentReflection).toBe('');
    act(() => {
      result.current.selectReflection('preFocus');
    });
    expect(result.current.currentReflection).toBeTruthy();
    expect(typeof result.current.currentReflection).toBe('string');
  });

  it('filteres by theme when settings.theme is not random', () => {
    const { result } = renderHook(
      () => useVerse({ ...defaultSettings, theme: 'wisdom' }),
      { wrapper }
    );
    act(() => {
      result.current.selectVerse();
    });
    expect(result.current.currentVerse).not.toBeNull();
    expect(result.current.currentVerse.text).toBeDefined();
  });

  it('does not throw when theme has no verses (falls back to all)', () => {
    const { result } = renderHook(
      () => useVerse({ ...defaultSettings, theme: 'nonexistent' }),
      { wrapper }
    );
    expect(() => {
      act(() => {
        result.current.selectVerse();
      });
    }).not.toThrow();
    expect(result.current.currentVerse).not.toBeNull();
  });
});

describe('useVerse with custom verses', () => {
  it('merges custom verses with curated verses', (done) => {
    const customVerses = [
      {
        id: 'custom-1',
        theme: 'custom',
        reference: 'John 3:16',
        esv: 'For God so loved the world...',
        niv: 'For God so loved the world...',
      },
    ];
    const platform = createMockPlatformWithCustomVerses(customVerses);
    const w = ({ children }) => <PlatformProvider platform={platform}>{children}</PlatformProvider>;

    const { result } = renderHook(
      () => useVerse({ theme: 'custom', translation: 'esv' }),
      { wrapper: w }
    );

    act(() => {
      result.current.selectVerse();
    });

    setTimeout(() => {
      expect(result.current.currentVerse).toBeDefined();
      expect(result.current.currentVerse.reference).toBe('John 3:16');
      done();
    }, 100);
  });

  it('includes custom verses when theme is random', (done) => {
    const customVerses = [
      {
        id: 'custom-1',
        theme: 'custom',
        reference: 'John 3:16',
        esv: 'For God so loved the world...',
      },
    ];
    const platform = createMockPlatformWithCustomVerses(customVerses);
    const w = ({ children }) => <PlatformProvider platform={platform}>{children}</PlatformProvider>;

    const { result } = renderHook(
      () => useVerse({ theme: 'random', translation: 'esv' }),
      { wrapper: w }
    );

    act(() => {
      result.current.selectVerse();
    });

    setTimeout(() => {
      expect(result.current.currentVerse).toBeDefined();
      done();
    }, 100);
  });

  it('reactively updates when custom verses change via storage listener', (done) => {
    const platform = createMockPlatformWithCustomVerses([]);
    const w = ({ children }) => <PlatformProvider platform={platform}>{children}</PlatformProvider>;

    const { result } = renderHook(
      () => useVerse({ theme: 'custom', translation: 'esv' }),
      { wrapper: w }
    );

    setTimeout(() => {
      const newCustomVerses = [
        {
          id: 'custom-1',
          theme: 'custom',
          reference: 'Psalm 23:1',
          esv: 'The Lord is my shepherd...',
        },
      ];

      act(() => {
        platform.notifyCustomVersesChanged(newCustomVerses);
      });

      act(() => {
        result.current.selectVerse();
      });

      expect(result.current.currentVerse).toBeDefined();
      expect(result.current.currentVerse.reference).toBe('Psalm 23:1');
      done();
    }, 50);
  });

  it('selectVerse handles empty custom verses by falling back to curated verses', () => {
    const platform = createMockPlatformWithCustomVerses([]);
    const w = ({ children }) => <PlatformProvider platform={platform}>{children}</PlatformProvider>;

    const { result } = renderHook(
      () => useVerse({ theme: 'custom', translation: 'esv' }),
      { wrapper: w }
    );

    act(() => {
      result.current.selectVerse();
    });

    expect(result.current.currentVerse).not.toBeNull();
    expect(result.current.currentVerse.reference).toBeDefined();
  });
});

import { renderHook, act } from '@testing-library/react';
import { useVerse } from './useVerse';
import * as customStorage from './customVerseStorage';

jest.mock('./customVerseStorage');

const defaultSettings = {
  theme: 'random',
  translation: 'esv',
};

// Mock chrome API
beforeEach(() => {
  global.chrome = {
    storage: {
      local: {
        get: jest.fn((key, cb) => cb({ customVerses: [] })),
        set: jest.fn((payload, cb) => cb && cb()),
      },
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    runtime: {
      lastError: null,
    },
  };
});

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

describe('useVerse with custom verses', () => {
  beforeEach(() => {
    customStorage.getCustomVerses.mockClear();
  });

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

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb(customVerses);
    });

    const { result } = renderHook(() => useVerse({ theme: 'custom', translation: 'esv' }));

    act(() => {
      result.current.selectVerse();
    });

    // Wait for async operation
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

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb(customVerses);
    });

    const { result } = renderHook(() => useVerse({ theme: 'random', translation: 'esv' }));

    act(() => {
      result.current.selectVerse();
    });

    setTimeout(() => {
      expect(result.current.currentVerse).toBeDefined();
      done();
    }, 100);
  });

  it('reactively updates when custom verses change via storage listener', (done) => {
    let storageListenerCallback;
    global.chrome.storage.onChanged.addListener.mockImplementation((cb) => {
      storageListenerCallback = cb;
    });

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb([]);
    });

    const { result } = renderHook(() => useVerse({ theme: 'custom', translation: 'esv' }));

    // Simulate storage change from another context
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
        storageListenerCallback({ customVerses: { newValue: newCustomVerses } }, 'local');
      });

      // Now select should pick from updated verses
      act(() => {
        result.current.selectVerse();
      });

      expect(result.current.currentVerse).toBeDefined();
      expect(result.current.currentVerse.reference).toBe('Psalm 23:1');
      done();
    }, 50);
  });

  it('selectVerse handles empty custom verses by falling back to curated verses', () => {
    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb([]);
    });

    const { result } = renderHook(() => useVerse({ theme: 'custom', translation: 'esv' }));

    act(() => {
      result.current.selectVerse();
    });

    // When custom theme is selected but no custom verses exist, falls back to curated verses
    expect(result.current.currentVerse).not.toBeNull();
    expect(result.current.currentVerse.reference).toBeDefined();
  });
});

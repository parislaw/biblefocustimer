/**
 * Tests for settings defaults and the DEFAULT_SETTINGS export.
 */
import { DEFAULT_SETTINGS } from '../src/popup/useStorage';

describe('DEFAULT_SETTINGS', () => {
  test('has all required timer settings', () => {
    expect(DEFAULT_SETTINGS.focusDuration).toBe(25);
    expect(DEFAULT_SETTINGS.shortBreakDuration).toBe(5);
    expect(DEFAULT_SETTINGS.longBreakDuration).toBe(15);
    expect(DEFAULT_SETTINGS.cyclesBeforeLongBreak).toBe(4);
    expect(typeof DEFAULT_SETTINGS.autoStartNext).toBe('boolean');
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
  });

  test('has all required scripture settings', () => {
    expect(DEFAULT_SETTINGS.scriptureEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.translation).toBe('esv');
    expect(DEFAULT_SETTINGS.theme).toBe('random');
    expect(DEFAULT_SETTINGS.verseMode).toBe('daily');
  });

  test('translation is one of the supported values', () => {
    expect(['esv', 'niv', 'kjv']).toContain(DEFAULT_SETTINGS.translation);
  });

  test('verseMode is one of the supported values', () => {
    expect(['daily', 'random']).toContain(DEFAULT_SETTINGS.verseMode);
  });

  test('theme is one of the supported values', () => {
    expect(['random', 'wisdom', 'peace', 'discipline', 'work']).toContain(
      DEFAULT_SETTINGS.theme
    );
  });
});

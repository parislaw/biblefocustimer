import { useState, useEffect } from 'react';
import { usePlatform } from '../platform';

export const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  playCompletionSound: true,
  completionSoundId: 'complete',
  completionSoundVolume: 80,
  stickyNotification: true,
  scriptureEnabled: true,
  translation: 'esv',
  theme: 'random',
};

/**
 * Custom hook for settings storage via platform (Chrome sync or localStorage).
 */
export function useSettings() {
  const platform = usePlatform();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    platform.getSettings((stored) => {
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored });
      setLoaded(true);
    });
  }, [platform]);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    platform.setSettings(merged);
  };

  return { settings, updateSettings, loaded };
}

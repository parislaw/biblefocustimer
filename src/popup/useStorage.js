import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  scriptureEnabled: true,
  translation: 'esv',
  theme: 'random',
};

/**
 * Custom hook for Chrome storage sync with fallback to localStorage.
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('settings', (result) => {
        if (result.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
        }
        setLoaded(true);
      });
    } else {
      try {
        const stored = localStorage.getItem('selah-settings');
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (e) {
        // ignore
      }
      setLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ settings: merged });
      // Notify background so it can update its cached settings
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          { type: 'SETTINGS_UPDATED', settings: merged },
          () => {} // ignore response
        );
      }
    } else {
      try {
        localStorage.setItem('selah-settings', JSON.stringify(merged));
      } catch (e) {
        // ignore
      }
    }
  };

  return { settings, updateSettings, loaded };
}

export { DEFAULT_SETTINGS };

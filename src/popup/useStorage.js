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
        if (chrome.runtime.lastError) {
          console.error('Failed to load settings from Chrome storage:', chrome.runtime.lastError);
        } else if (result.settings) {
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
        console.error('Failed to load settings from localStorage:', e);
      }
      setLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ settings: merged }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to save settings to Chrome storage:', chrome.runtime.lastError);
        }
      });
    } else {
      try {
        localStorage.setItem('selah-settings', JSON.stringify(merged));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
        if (e.name === 'QuotaExceededError') {
          console.error('Storage quota exceeded. Please clear browser data.');
        }
      }
    }
  };

  return { settings, updateSettings, loaded };
}

export { DEFAULT_SETTINGS };

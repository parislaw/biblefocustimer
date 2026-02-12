import React from 'react';

const TRANSLATIONS = [
  { value: 'esv', label: 'ESV' },
  { value: 'niv', label: 'NIV' },
  { value: 'kjv', label: 'KJV' },
];

const THEMES = [
  { value: 'random', label: 'Random' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'peace', label: 'Peace' },
  { value: 'discipline', label: 'Discipline' },
  { value: 'work', label: 'Work & Diligence' },
];

export default function SettingsView({ settings, updateSettings, onClose }) {
  const validateNumericInput = (value, min, max, defaultValue) => {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < min) {
      return min;
    }
    if (parsed > max) {
      return max;
    }
    return parsed;
  };

  const handleChange = (key, value) => {
    // Validate numeric inputs
    let validatedValue = value;

    if (key === 'focusDuration') {
      validatedValue = validateNumericInput(value, 1, 120, 25);
    } else if (key === 'shortBreakDuration') {
      validatedValue = validateNumericInput(value, 1, 30, 5);
    } else if (key === 'longBreakDuration') {
      validatedValue = validateNumericInput(value, 1, 60, 15);
    } else if (key === 'cyclesBeforeLongBreak') {
      validatedValue = validateNumericInput(value, 0, 10, 4);
    }

    updateSettings({ [key]: validatedValue });
  };

  return (
    <div className="view settings-view" role="main" aria-label="Settings">
      <header className="settings-header">
        <h2 className="view-heading">Settings</h2>
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close settings"
          title="Close settings (Escape)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="settings-section">
        <h3 className="settings-section-title">Timer</h3>

        <label className="setting-row" htmlFor="focus-duration">
          <span id="focus-duration-label">Focus duration</span>
          <div className="setting-input-group">
            <input
              id="focus-duration"
              type="number"
              min="1"
              max="120"
              value={settings.focusDuration}
              onChange={(e) => handleChange('focusDuration', e.target.value)}
              aria-labelledby="focus-duration-label"
              aria-describedby="focus-duration-help"
            />
            <span className="setting-unit" id="focus-duration-help">min</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="short-break">
          <span id="short-break-label">Short break</span>
          <div className="setting-input-group">
            <input
              id="short-break"
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
              aria-labelledby="short-break-label"
              aria-describedby="short-break-help"
            />
            <span className="setting-unit" id="short-break-help">min</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="long-break">
          <span id="long-break-label">Long break</span>
          <div className="setting-input-group">
            <input
              id="long-break"
              type="number"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', e.target.value)}
              aria-labelledby="long-break-label"
              aria-describedby="long-break-help"
            />
            <span className="setting-unit" id="long-break-help">min</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="cycles-before-long">
          <span id="cycles-label">Cycles before long break</span>
          <div className="setting-input-group">
            <input
              id="cycles-before-long"
              type="number"
              min="0"
              max="10"
              value={settings.cyclesBeforeLongBreak}
              onChange={(e) => handleChange('cyclesBeforeLongBreak', e.target.value)}
              aria-labelledby="cycles-label"
              aria-describedby="cycles-help"
            />
            <span className="setting-unit" id="cycles-help">(0 to disable)</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="auto-start-toggle">
          <span id="auto-start-label">Auto-start next session</span>
          <input
            id="auto-start-toggle"
            type="checkbox"
            checked={settings.autoStartNext}
            onChange={(e) => handleChange('autoStartNext', e.target.checked)}
            aria-labelledby="auto-start-label"
            aria-describedby="auto-start-help"
          />
          <span className="sr-only" id="auto-start-help">Enable to automatically start the next session when the current one ends</span>
        </label>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Scripture</h3>

        <label className="setting-row" htmlFor="scripture-toggle">
          <span id="scripture-label">Show Scripture</span>
          <input
            id="scripture-toggle"
            type="checkbox"
            checked={settings.scriptureEnabled}
            onChange={(e) => handleChange('scriptureEnabled', e.target.checked)}
            aria-labelledby="scripture-label"
            aria-describedby="scripture-help"
          />
          <span className="sr-only" id="scripture-help">Enable to display Bible verses and reflections during focus sessions</span>
        </label>

        <label className="setting-row" htmlFor="translation-select">
          <span id="translation-label">Translation</span>
          <select
            id="translation-select"
            value={settings.translation}
            onChange={(e) => handleChange('translation', e.target.value)}
            aria-labelledby="translation-label"
            disabled={!settings.scriptureEnabled}
          >
            {TRANSLATIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="setting-row" htmlFor="theme-select">
          <span id="theme-label">Theme</span>
          <select
            id="theme-select"
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            aria-labelledby="theme-label"
            disabled={!settings.scriptureEnabled}
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-footer">
        <p className="settings-note">
          Scripture translations sourced for personal devotional use.
        </p>
      </div>
    </div>
  );
}

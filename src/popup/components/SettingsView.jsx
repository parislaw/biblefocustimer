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

const VERSE_MODES = [
  { value: 'daily', label: 'Daily' },
  { value: 'random', label: 'Random' },
];

export default function SettingsView({ settings, updateSettings, onClose }) {
  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="view settings-view">
      <header className="settings-header">
        <h2 className="view-heading">Settings</h2>
        <button className="btn-icon" onClick={onClose} title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="settings-section">
        <h3 className="settings-section-title">Timer</h3>

        <label className="setting-row">
          <span>Focus duration</span>
          <div className="setting-input-group">
            <input
              type="number"
              min="1"
              max="120"
              value={settings.focusDuration}
              onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
            />
            <span className="setting-unit">min</span>
          </div>
        </label>

        <label className="setting-row">
          <span>Short break</span>
          <div className="setting-input-group">
            <input
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value) || 5)}
            />
            <span className="setting-unit">min</span>
          </div>
        </label>

        <label className="setting-row">
          <span>Long break</span>
          <div className="setting-input-group">
            <input
              type="number"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 15)}
            />
            <span className="setting-unit">min</span>
          </div>
        </label>

        <label className="setting-row">
          <span>Cycles before long break</span>
          <div className="setting-input-group">
            <input
              type="number"
              min="0"
              max="10"
              value={settings.cyclesBeforeLongBreak}
              onChange={(e) => handleChange('cyclesBeforeLongBreak', parseInt(e.target.value) || 4)}
            />
          </div>
        </label>

        <label className="setting-row">
          <span>Auto-start next session</span>
          <input
            type="checkbox"
            checked={settings.autoStartNext}
            onChange={(e) => handleChange('autoStartNext', e.target.checked)}
          />
        </label>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Scripture</h3>

        <label className="setting-row">
          <span>Show Scripture</span>
          <input
            type="checkbox"
            checked={settings.scriptureEnabled}
            onChange={(e) => handleChange('scriptureEnabled', e.target.checked)}
          />
        </label>

        <label className="setting-row">
          <span>Translation</span>
          <select
            value={settings.translation}
            onChange={(e) => handleChange('translation', e.target.value)}
          >
            {TRANSLATIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="setting-row">
          <span>Theme</span>
          <select
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="setting-row">
          <span>Verse cadence</span>
          <select
            value={settings.verseMode || 'daily'}
            onChange={(e) => handleChange('verseMode', e.target.value)}
          >
            {VERSE_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
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

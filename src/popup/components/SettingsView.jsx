import React, { useState } from 'react';
import { usePlatform } from '../../platform';
import CustomVerseForm from './CustomVerseForm';
import CustomVerseList from './CustomVerseList';

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
  { value: 'custom', label: 'Custom Verses' },
];

const COMPLETION_SOUNDS = [
  { id: 'praise', label: "Children's Praise", file: 'jesuschristisgod-children-saying-yay-praise-and-worship-jesus-299607.mp3' },
  { id: 'bell-1', label: 'Temple Bell 1', file: 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-1-241683.mp3' },
  { id: 'bell-3', label: 'Temple Bell 3', file: 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-3-241681.mp3' },
  { id: 'bell-4', label: 'Temple Bell 4', file: 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-4-241680.mp3' },
];

export default function SettingsView({ settings, updateSettings, customVerses = [], persistCustomVerses, onClose }) {
  const platform = usePlatform();
  const [activeTab, setActiveTab] = useState('timer');
  const [editingVerse, setEditingVerse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [testingSound, setTestingSound] = useState(false);

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
    } else if (key === 'completionSoundVolume') {
      const n = parseInt(value, 10);
      validatedValue = isNaN(n) ? 80 : Math.min(100, Math.max(0, n));
    }

    updateSettings({ [key]: validatedValue });
  };

  const handleTestSound = () => {
    setTestingSound(true);
    const url = platform.getCompletionSoundUrl(settings);
    const volume = platform.getCompletionSoundVolume(settings);
    platform.playCompletionSound(url, volume).finally(() => setTestingSound(false));
  };

  const handleAddVerse = (verseData) => {
    const updatedVerses = editingVerse
      ? customVerses.map((v) => (v.id === verseData.id ? verseData : v))
      : [...customVerses, verseData];

    setEditingVerse(null);
    setShowForm(false);
    if (persistCustomVerses) persistCustomVerses(updatedVerses);
  };

  const handleDeleteVerse = (verseId) => {
    const updatedVerses = customVerses.filter((v) => v.id !== verseId);
    if (persistCustomVerses) persistCustomVerses(updatedVerses);
  };

  const handleEditVerse = (verse) => {
    setEditingVerse(verse);
    setShowForm(true);
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

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
          role="tab"
          aria-selected={activeTab === 'timer'}
        >
          Timer
        </button>
        <button
          className={`tab-button ${activeTab === 'scripture' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripture')}
          role="tab"
          aria-selected={activeTab === 'scripture'}
        >
          Scripture
        </button>
        <button
          className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
          role="tab"
          aria-selected={activeTab === 'custom'}
        >
          Custom Verses
        </button>
      </div>

      {activeTab === 'timer' && (
        <div className="settings-section" role="tabpanel">
          <h3 className="settings-section-title">Timer Settings</h3>

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

          <label className="setting-row" htmlFor="play-sound-toggle">
            <span id="play-sound-label">Play sound when timer completes</span>
            <input
              id="play-sound-toggle"
              type="checkbox"
              checked={settings.playCompletionSound}
              onChange={(e) => handleChange('playCompletionSound', e.target.checked)}
              aria-labelledby="play-sound-label"
              aria-describedby="play-sound-help"
            />
            <span className="sr-only" id="play-sound-help">Play a short sound when a focus or break session ends</span>
          </label>

          {settings.playCompletionSound && (
            <>
              <label className="setting-row" htmlFor="completion-sound-select">
                <span id="completion-sound-label">Completion sound</span>
                <select
                  id="completion-sound-select"
                  value={settings.completionSoundId || 'praise'}
                  onChange={(e) => handleChange('completionSoundId', e.target.value)}
                  aria-labelledby="completion-sound-label"
                >
                  {COMPLETION_SOUNDS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="setting-row setting-row-volume" role="group" aria-labelledby="volume-label">
                <span id="volume-label">Volume</span>
                <div className="setting-volume-group">
                  <input
                    id="volume-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={settings.completionSoundVolume ?? 80}
                    onChange={(e) => handleChange('completionSoundVolume', parseInt(e.target.value, 10))}
                    aria-labelledby="volume-label"
                    aria-valuetext={`${settings.completionSoundVolume ?? 80}%`}
                  />
                  <span className="setting-volume-value" aria-live="polite">
                    {settings.completionSoundVolume ?? 80}%
                  </span>
                </div>
              </div>

              <div className="setting-row">
                <span id="test-sound-label">Test sound</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTestSound}
                  disabled={testingSound}
                  aria-labelledby="test-sound-label"
                >
                  {testingSound ? 'Playing…' : 'Play'}
                </button>
              </div>
            </>
          )}

          <label className="setting-row" htmlFor="sticky-notification-toggle">
            <span id="sticky-notification-label">Keep notification until dismissed</span>
            <input
              id="sticky-notification-toggle"
              type="checkbox"
              checked={settings.stickyNotification}
              onChange={(e) => handleChange('stickyNotification', e.target.checked)}
              aria-labelledby="sticky-notification-label"
              aria-describedby="sticky-notification-help"
            />
            <span className="sr-only" id="sticky-notification-help">Desktop notification stays visible until you dismiss it</span>
          </label>
        </div>
      )}

      {activeTab === 'scripture' && (
        <div className="settings-section" role="tabpanel">
          <h3 className="settings-section-title">Scripture Settings</h3>

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

          <div className="settings-footer">
            <p className="settings-note">
              Scripture translations sourced for personal devotional use.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="settings-section" role="tabpanel">
          <h3 className="settings-section-title">Custom Verses</h3>
          <p className="settings-description">
            Manage your verses. You can add custom Bible verses to your collection.
          </p>

          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              style={{ marginBottom: '1rem' }}
            >
              + Add New Verse
            </button>
          )}

          {showForm && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <CustomVerseForm
                verse={editingVerse}
                onSubmit={handleAddVerse}
                onCancel={() => {
                  setShowForm(false);
                  setEditingVerse(null);
                }}
              />
            </div>
          )}

          <CustomVerseList
            verses={customVerses}
            onEdit={handleEditVerse}
            onDelete={handleDeleteVerse}
          />
        </div>
      )}
    </div>
  );
}

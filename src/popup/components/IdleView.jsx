import React, { useEffect, useState } from 'react';

const QUICK_PRESETS = [
  { type: 'focus', minutes: 25, label: '25 min focus' },
  { type: 'focus', minutes: 10, label: '10 min' },
  { type: 'focus', minutes: 30, label: '30 min' },
  { type: 'break', minutes: 5, label: '5 min break' },
  { type: 'break', minutes: 15, label: '15 min break' },
];

export default function IdleView({
  settings,
  verse,
  cycleCount,
  onStartFocus,
  onOpenSettings,
  isWeb,
  onQuickFocus,
  onQuickBreak,
}) {
  const [notifyPermission, setNotifyPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (settings.scriptureEnabled && !verse.currentVerse) {
      verse.selectVerse();
    }
  }, []);

  const requestNotificationPermission = () => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then((p) => setNotifyPermission(p));
  };

  return (
    <div className="view idle-view" role="main" aria-label="Selah Focus - Ready to begin">
      <header className="view-header">
        <h1 className="app-title">Selah Focus</h1>
        <button
          className="btn-icon"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings (Alt+S)"
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
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </header>

      {settings.scriptureEnabled && verse.currentVerse && (
        <article className="verse-card idle-verse" role="article" aria-label="Daily verse">
          <p className="verse-text">{verse.currentVerse.text}</p>
          <p className="verse-reference">
            — {verse.currentVerse.reference} ({verse.currentVerse.translation})
          </p>
        </article>
      )}

      {cycleCount > 0 && (
        <div className="cycle-indicator" aria-live="polite" aria-label={`${cycleCount} ${cycleCount === 1 ? 'session' : 'sessions'} completed today`}>
          {cycleCount} {cycleCount === 1 ? 'session' : 'sessions'} completed
        </div>
      )}

      <div className="idle-timer-preview" aria-label={`Session duration: ${settings.focusDuration} minutes focus, ${settings.shortBreakDuration} minutes break`}>
        <span className="preview-duration">{settings.focusDuration} min focus</span>
        <span className="preview-sep" aria-hidden="true">/</span>
        <span className="preview-duration">{settings.shortBreakDuration} min break</span>
      </div>

      <button
        className="btn-primary"
        onClick={onStartFocus}
        aria-label={`Begin ${settings.focusDuration} minute focus session`}
        title="Begin Focus Session (Enter)"
      >
        Begin Focus Session
      </button>

      {isWeb && onQuickFocus && onQuickBreak && (
        <div className="quick-presets" role="group" aria-label="Quick start timers">
          <span className="quick-presets-label">Quick start</span>
          <div className="quick-presets-buttons">
            {QUICK_PRESETS.map(({ type, minutes, label }) => (
              <button
                key={`${type}-${minutes}`}
                type="button"
                className="btn-quick-preset"
                onClick={() => type === 'focus' ? onQuickFocus(minutes) : onQuickBreak(minutes)}
                aria-label={`Start ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isWeb && notifyPermission === 'default' && (
        <div className="idle-notify-prompt" role="region" aria-label="Notification permission">
          <button
            type="button"
            className="btn-text btn-text-sm"
            onClick={requestNotificationPermission}
          >
            Allow notifications when timer ends
          </button>
        </div>
      )}
    </div>
  );
}

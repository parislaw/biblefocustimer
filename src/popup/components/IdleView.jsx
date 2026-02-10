import React, { useEffect } from 'react';

export default function IdleView({ settings, verse, cycleCount, onStartFocus, onOpenSettings }) {
  useEffect(() => {
    if (settings.scriptureEnabled && !verse.currentVerse) {
      verse.selectVerse();
    }
  }, []);

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
    </div>
  );
}

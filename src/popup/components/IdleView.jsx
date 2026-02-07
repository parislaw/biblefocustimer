import React, { useEffect } from 'react';

export default function IdleView({ settings, verse, cycleCount, onStartFocus, onOpenSettings }) {
  useEffect(() => {
    if (settings.scriptureEnabled && !verse.currentVerse) {
      verse.selectVerse();
    }
  }, []);

  return (
    <div className="view idle-view">
      <header className="view-header">
        <h1 className="app-title">Selah Focus</h1>
        <button className="btn-icon" onClick={onOpenSettings} title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </header>

      {settings.scriptureEnabled && verse.currentVerse && (
        <div className="verse-card idle-verse">
          <p className="verse-text">{verse.currentVerse.text}</p>
          <p className="verse-reference">
            — {verse.currentVerse.reference} ({verse.currentVerse.translation})
          </p>
        </div>
      )}

      {cycleCount > 0 && (
        <div className="cycle-indicator">
          {cycleCount} {cycleCount === 1 ? 'session' : 'sessions'} completed
        </div>
      )}

      <div className="idle-timer-preview">
        <span className="preview-duration">{settings.focusDuration} min focus</span>
        <span className="preview-sep">/</span>
        <span className="preview-duration">{settings.shortBreakDuration} min break</span>
      </div>

      <button className="btn-primary" onClick={onStartFocus}>
        Begin Focus Session
      </button>
    </div>
  );
}

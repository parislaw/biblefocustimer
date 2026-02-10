import React, { useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import VerseCard from './VerseCard';

export default function BreakView({
  secondsLeft,
  isRunning,
  isLongBreak,
  cycleCount,
  verse,
  reflection,
  settings,
  onPause,
  onResume,
  onSkipBreak,
  selectVerse,
  selectReflection,
}) {
  // Select a verse for break if scripture is enabled and none is loaded
  useEffect(() => {
    if (settings.scriptureEnabled && !verse) {
      selectVerse();
      selectReflection('break');
    }
  }, []);

  const label = isLongBreak ? 'Long Break' : 'Break';

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="view break-view" role="main" aria-label={`${label} - ${formatTime(secondsLeft)} remaining`}>
      <TimerDisplay secondsLeft={secondsLeft} label={label} />

      {/* Live region for screen readers to announce time changes */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Time remaining: {formatTime(secondsLeft)}
      </div>

      {settings.scriptureEnabled && verse && (
        <VerseCard verse={verse} />
      )}

      {settings.scriptureEnabled && reflection && (
        <p className="reflection-prompt" role="doc-tip" aria-label="Reflection prompt">
          {reflection}
        </p>
      )}

      <div className="timer-controls">
        {isRunning ? (
          <button
            className="btn-secondary"
            onClick={onPause}
            aria-label="Pause break timer"
            title="Pause break timer (Spacebar)"
          >
            Pause
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={onResume}
            aria-label="Resume break timer"
            title="Resume break timer (Spacebar)"
          >
            Resume
          </button>
        )}
        <button
          className="btn-text"
          onClick={onSkipBreak}
          aria-label="Skip break and return to idle"
          title="Skip break (S)"
        >
          Skip Break
        </button>
      </div>

      {/* Accessible session counter */}
      <div className="cycle-indicator" aria-label={`${cycleCount} ${cycleCount === 1 ? 'session' : 'sessions'} completed`}>
        {cycleCount} {cycleCount === 1 ? 'session' : 'sessions'} completed
      </div>
    </div>
  );
}

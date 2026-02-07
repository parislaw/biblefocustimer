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

  return (
    <div className="view break-view">
      <TimerDisplay secondsLeft={secondsLeft} label={label} />

      {settings.scriptureEnabled && verse && (
        <VerseCard verse={verse} />
      )}

      {settings.scriptureEnabled && reflection && (
        <p className="reflection-prompt">{reflection}</p>
      )}

      <div className="timer-controls">
        {isRunning ? (
          <button className="btn-secondary" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button className="btn-primary" onClick={onResume}>
            Resume
          </button>
        )}
        <button className="btn-text" onClick={onSkipBreak}>
          Skip Break
        </button>
      </div>

      <div className="cycle-indicator">
        {cycleCount} {cycleCount === 1 ? 'session' : 'sessions'} completed
      </div>
    </div>
  );
}

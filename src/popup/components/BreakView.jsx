import React, { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import VerseCard from './VerseCard';
import { formatTime } from '../utils/time';

const ANNOUNCE_AT_SECONDS = new Set([300, 60, 30, 10, 0]);

export default function BreakView({
  secondsLeft,
  isRunning,
  isLongBreak,
  cycleCount,
  sessionTotalSeconds,
  verse,
  reflection,
  settings,
  onPause,
  onResume,
  onSkipBreak,
  selectVerse,
  selectReflection,
}) {
  const [announcement, setAnnouncement] = useState('');

  // Select a verse for break if scripture is enabled and none is loaded
  useEffect(() => {
    if (settings.scriptureEnabled && !verse) {
      selectVerse();
      selectReflection('break');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run-once on mount

  useEffect(() => {
    if (isRunning && ANNOUNCE_AT_SECONDS.has(secondsLeft)) {
      setAnnouncement(
        secondsLeft === 0
          ? 'Break complete'
          : `${formatTime(secondsLeft)} remaining`
      );
    }
  }, [secondsLeft, isRunning]);

  const label = isLongBreak ? 'Long Break' : 'Break';

  return (
    <div className="view break-view" aria-label={`${label} - ${formatTime(secondsLeft)} remaining`}>
      <TimerDisplay secondsLeft={secondsLeft} label={label} totalSeconds={sessionTotalSeconds} />

      {/* Screen reader announcements at milestones only */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {settings.scriptureEnabled && verse && (
        <VerseCard verse={verse} />
      )}

      {settings.scriptureEnabled && reflection && (
        <p className="reflection-prompt" role="note" aria-label="Reflection prompt">
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

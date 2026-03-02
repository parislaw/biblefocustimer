import React, { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import { formatTime } from '../utils/time';

// Announce only at meaningful milestones to avoid flooding screen readers every second
const ANNOUNCE_AT_SECONDS = new Set([300, 60, 30, 10, 0]); // 5 min, 1 min, 30s, 10s, done

export default function FocusView({ secondsLeft, isRunning, cycleCount, cyclesBeforeLongBreak = 4, sessionTotalSeconds, onPause, onResume, onReset }) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isRunning && ANNOUNCE_AT_SECONDS.has(secondsLeft)) {
      setAnnouncement(
        secondsLeft === 0
          ? 'Focus session complete'
          : `${formatTime(secondsLeft)} remaining`
      );
    }
  }, [secondsLeft, isRunning]);

  return (
    <div className="view focus-view" aria-label="Focus session in progress">
      <div className="focus-minimal">
        <TimerDisplay secondsLeft={secondsLeft} label="Focus" totalSeconds={sessionTotalSeconds} />

        {/* Screen reader announcements at milestones only */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        <div className="timer-controls">
          {isRunning ? (
            <button
              className="btn-secondary"
              onClick={onPause}
              aria-label="Pause focus session"
              title="Pause focus session (Spacebar)"
            >
              Pause
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={onResume}
              aria-label="Resume focus session"
              title="Resume focus session (Spacebar)"
            >
              Resume
            </button>
          )}
          <button
            className="btn-text"
            onClick={onReset}
            aria-label="Reset focus session"
            title="Reset focus session (R)"
          >
            Reset
          </button>
        </div>

        {/* Accessible cycle progress indicator */}
        <div
          className="cycle-dots"
          aria-label={`Progress: ${cycleCount % cyclesBeforeLongBreak} of ${cyclesBeforeLongBreak} cycles completed`}
          role="progressbar"
          aria-valuenow={cycleCount % cyclesBeforeLongBreak}
          aria-valuemin="0"
          aria-valuemax={cyclesBeforeLongBreak}
        >
          {Array.from({ length: cyclesBeforeLongBreak }, (_, i) => (
            <span
              key={i}
              className={`dot ${i < (cycleCount % cyclesBeforeLongBreak) ? 'dot-filled' : ''} ${i === (cycleCount % cyclesBeforeLongBreak) ? 'dot-active' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

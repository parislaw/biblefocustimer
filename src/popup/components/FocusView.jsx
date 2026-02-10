import React from 'react';
import TimerDisplay from './TimerDisplay';

export default function FocusView({ secondsLeft, isRunning, cycleCount, onPause, onResume, onReset }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="view focus-view" role="main" aria-label="Focus session in progress">
      <div className="focus-minimal">
        <TimerDisplay secondsLeft={secondsLeft} label="Focus" />

        {/* Live region for screen readers to announce time changes */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Time remaining: {formatTime(secondsLeft)}
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
        <div className="cycle-dots" aria-label={`Progress: ${cycleCount % 4} of 4 cycles completed`} role="progressbar" aria-valuenow={cycleCount % 4} aria-valuemin="0" aria-valuemax="4">
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className={`dot ${i < (cycleCount % 4) ? 'dot-filled' : ''} ${i === (cycleCount % 4) ? 'dot-active' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

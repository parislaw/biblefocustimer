import React from 'react';
import { formatTime } from '../utils/time';

export default function TimerDisplay({ secondsLeft, label, totalSeconds }) {
  const display = formatTime(secondsLeft);
  const showProgress = typeof totalSeconds === 'number' && totalSeconds > 0;
  const progress = showProgress
    ? Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds))
    : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="timer-display">
      {showProgress && (
        <div className="timer-progress-ring" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="timer-progress-svg">
            <circle
              className="timer-progress-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="timer-progress-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
      )}
      <div className="timer-content">
        {label && <div className="timer-label">{label}</div>}
        <div className="timer-time" aria-live="polite" aria-atomic="true">
          {display}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { formatTime } from '../utils/time';

export default function TimerDisplay({ secondsLeft, label }) {
  const display = formatTime(secondsLeft);

  return (
    <div className="timer-display">
      {label && <div className="timer-label">{label}</div>}
      <div className="timer-time">{display}</div>
    </div>
  );
}

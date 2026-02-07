import React from 'react';

export default function TimerDisplay({ secondsLeft, label }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="timer-display">
      {label && <div className="timer-label">{label}</div>}
      <div className="timer-time">{display}</div>
    </div>
  );
}

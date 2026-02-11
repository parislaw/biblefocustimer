import React from 'react';
import TimerDisplay from './TimerDisplay';

export default function FocusView({ secondsLeft, isRunning, cycleCount, cyclesBeforeLongBreak, onPause, onResume, onReset }) {
  return (
    <div className="view focus-view">
      <div className="focus-minimal">
        <TimerDisplay secondsLeft={secondsLeft} label="Focus" />

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
          <button className="btn-text" onClick={onReset}>
            Reset
          </button>
        </div>

        {cyclesBeforeLongBreak > 0 && (
          <div className="cycle-dots">
            {Array.from({ length: cyclesBeforeLongBreak }, (_, i) => (
              <span
                key={i}
                className={`dot ${i < (cycleCount % cyclesBeforeLongBreak) ? 'dot-filled' : ''} ${i === (cycleCount % cyclesBeforeLongBreak) ? 'dot-active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

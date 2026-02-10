import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Timer states:
 * - idle: no timer running, initial state
 * - preFocus: showing verse before focus begins
 * - focus: focus session active
 * - break: short or long break
 */
export function useTimer(settings) {
  const [phase, setPhase] = useState('idle'); // idle | preFocus | focus | break
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const intervalRef = useRef(null);

  // Sync secondsLeft when settings change and timer is idle
  useEffect(() => {
    if (phase === 'idle') {
      setSecondsLeft(settings.focusDuration * 60);
    }
  }, [settings.focusDuration, phase]);

  // Main countdown - only depends on isRunning to prevent recreating interval on every tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Handle timer reaching zero with proper dependencies
  const onTimerComplete = useCallback(() => {
    // Notify background service worker
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase });
    }

    if (phase === 'focus') {
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);

      const shouldLongBreak =
        settings.cyclesBeforeLongBreak > 0 &&
        newCycleCount % settings.cyclesBeforeLongBreak === 0;

      setIsLongBreak(shouldLongBreak);

      const breakDuration = shouldLongBreak
        ? settings.longBreakDuration
        : settings.shortBreakDuration;

      setPhase('break');
      setSecondsLeft(breakDuration * 60);

      if (settings.autoStartNext) {
        setIsRunning(true);
      }
    } else if (phase === 'break') {
      setPhase('idle');
      setSecondsLeft(settings.focusDuration * 60);

      if (settings.autoStartNext) {
        startFocusSession();
      }
    }
  }, [phase, cycleCount, settings, startFocusSession]);

  // Detect when timer reaches zero and call completion handler
  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      onTimerComplete();
    }
  }, [secondsLeft, isRunning, onTimerComplete]);

  const startFocusSession = useCallback(() => {
    if (settings.scriptureEnabled) {
      setPhase('preFocus');
      setIsRunning(false);
    } else {
      setPhase('focus');
      setSecondsLeft(settings.focusDuration * 60);
      setIsRunning(true);
    }
  }, [settings]);

  const beginFocusFromPreFocus = useCallback(() => {
    setPhase('focus');
    setSecondsLeft(settings.focusDuration * 60);
    setIsRunning(true);
  }, [settings.focusDuration]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (secondsLeft > 0 && (phase === 'focus' || phase === 'break')) {
      setIsRunning(true);
    }
  }, [secondsLeft, phase]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(settings.focusDuration * 60);
    setCycleCount(0);
    setIsLongBreak(false);
  }, [settings.focusDuration]);

  const skipBreak = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(settings.focusDuration * 60);
    setIsLongBreak(false);
  }, [settings.focusDuration]);

  return {
    phase,
    secondsLeft,
    isRunning,
    cycleCount,
    isLongBreak,
    startFocusSession,
    beginFocusFromPreFocus,
    pause,
    resume,
    reset,
    skipBreak,
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlatform } from '../platform';

/**
 * Timer phases: idle, preFocus, focus, break.
 * Countdown is owned by the platform (Chrome: alarms + storage; Web: in-page interval + localStorage).
 * This hook polls platform.getTimerState every second when running.
 */

export function useTimer(settings) {
  const platform = usePlatform();
  const [phase, setPhase] = useState('idle');
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(settings.focusDuration * 60);

  const completionFiredRef = useRef(false);
  const phaseRef = useRef(phase);
  const cycleCountRef = useRef(cycleCount);
  const settingsRef = useRef(settings);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { cycleCountRef.current = cycleCount; }, [cycleCount]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    if (phase === 'idle') {
      setSecondsLeft(settings.focusDuration * 60);
    }
  }, [settings.focusDuration, phase]);

  useEffect(() => {
    platform.getTimerState(({ timerState, cycleCount: storedCycle }) => {
      setCycleCount(typeof storedCycle === 'number' ? storedCycle : 0);
      if (!timerState) return;

      const { phase: savedPhase, startedAt, durationSeconds, isPaused, remainingAtPause } = timerState;

      if (isPaused) {
        setPhase(savedPhase);
        setSecondsLeft(Math.round(remainingAtPause ?? 0));
        setSessionTotalSeconds(durationSeconds);
        return;
      }

      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, Math.round(durationSeconds - elapsed));

      if (remaining <= 0) return;

      setPhase(savedPhase);
      setSecondsLeft(remaining);
      setSessionTotalSeconds(durationSeconds);
      setIsRunning(true);
    });
  }, [platform]);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      platform.getTimerState(({ timerState }) => {
        if (!timerState) return;

        const { startedAt, durationSeconds, isPaused, remainingAtPause } = timerState;

        if (isPaused) return;

        const elapsed = (Date.now() - startedAt) / 1000;
        const remaining = Math.max(0, Math.round(durationSeconds - elapsed));
        setSecondsLeft(remaining);
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, platform]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning && !completionFiredRef.current) {
      completionFiredRef.current = true;
      setIsRunning(false);
      const s = settingsRef.current;
      platform.onTimerComplete(phaseRef.current, s);
      onTimerComplete();
    }
  }, [secondsLeft, isRunning, platform]);

  const startFocusSession = useCallback(() => {
    completionFiredRef.current = false;
    const s = settingsRef.current;

    if (s.scriptureEnabled) {
      setPhase('preFocus');
      setIsRunning(false);
    } else {
      const durationSeconds = s.focusDuration * 60;
      setPhase('focus');
      setSecondsLeft(durationSeconds);
      setSessionTotalSeconds(durationSeconds);
      setIsRunning(true);
      platform.startTimer('focus', durationSeconds);
    }
  }, [platform]);

  const beginFocusFromPreFocus = useCallback(() => {
    completionFiredRef.current = false;
    const s = settingsRef.current;
    const durationSeconds = s.focusDuration * 60;
    setPhase('focus');
    setSecondsLeft(durationSeconds);
    setSessionTotalSeconds(durationSeconds);
    setIsRunning(true);
    platform.startTimer('focus', durationSeconds);
  }, [platform]);

  /** Start a focus session with a specific duration (minutes). Skips preFocus. */
  const startFocusWithDuration = useCallback((minutes) => {
    completionFiredRef.current = false;
    const durationSeconds = Math.max(1, Math.min(120, minutes)) * 60;
    setPhase('focus');
    setSecondsLeft(durationSeconds);
    setSessionTotalSeconds(durationSeconds);
    setIsRunning(true);
    platform.startTimer('focus', durationSeconds);
  }, [platform]);

  /** Start a break with a specific duration (minutes) from idle. */
  const startBreakWithDuration = useCallback((minutes) => {
    completionFiredRef.current = false;
    const durationSeconds = Math.max(1, Math.min(60, minutes)) * 60;
    setPhase('break');
    setSecondsLeft(durationSeconds);
    setSessionTotalSeconds(durationSeconds);
    setIsLongBreak(minutes >= 10);
    setIsRunning(true);
    platform.startTimer('break', durationSeconds);
  }, [platform]);

  const onTimerComplete = useCallback(() => {
    const currentPhase = phaseRef.current;
    const currentCycleCount = cycleCountRef.current;
    const s = settingsRef.current;

    if (currentPhase === 'focus') {
      const newCycleCount = currentCycleCount + 1;
      setCycleCount(newCycleCount);
      platform.setCycleCount(newCycleCount);

      const shouldLongBreak =
        s.cyclesBeforeLongBreak > 0 &&
        newCycleCount % s.cyclesBeforeLongBreak === 0;

      setIsLongBreak(shouldLongBreak);

      const breakDuration = shouldLongBreak
        ? s.longBreakDuration
        : s.shortBreakDuration;
      const durationSeconds = breakDuration * 60;

      setPhase('break');
      setSecondsLeft(durationSeconds);
      setSessionTotalSeconds(durationSeconds);
      completionFiredRef.current = false;

      if (s.autoStartNext) {
        setIsRunning(true);
        platform.startTimer('break', durationSeconds);
      }
    } else if (currentPhase === 'break') {
      setPhase('idle');
      setSecondsLeft(s.focusDuration * 60);
      completionFiredRef.current = false;

      if (s.autoStartNext) {
        startFocusSession();
      }
    }
  }, [platform, startFocusSession]);

  const pause = useCallback(() => {
    setIsRunning(false);
    platform.pauseTimer();
  }, [platform]);

  const resume = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev > 0 && (phaseRef.current === 'focus' || phaseRef.current === 'break')) {
        setIsRunning(true);
        platform.resumeTimer(prev);
      }
      return prev;
    });
  }, [platform]);

  const reset = useCallback(() => {
    completionFiredRef.current = false;
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(settingsRef.current.focusDuration * 60);
    setCycleCount(0);
    setIsLongBreak(false);
    platform.setCycleCount(0);
    platform.resetTimer();
  }, [platform]);

  const skipBreak = useCallback(() => {
    completionFiredRef.current = false;
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(settingsRef.current.focusDuration * 60);
    setIsLongBreak(false);
    platform.resetTimer();
  }, [platform]);

  return {
    phase,
    secondsLeft,
    isRunning,
    cycleCount,
    isLongBreak,
    sessionTotalSeconds,
    startFocusSession,
    beginFocusFromPreFocus,
    startFocusWithDuration,
    startBreakWithDuration,
    pause,
    resume,
    reset,
    skipBreak,
  };
}

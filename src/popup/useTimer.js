import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Timer phases:
 * - idle: no timer running, initial state
 * - preFocus: showing verse before focus begins
 * - focus: focus session active (alarm running in service worker)
 * - break: short or long break (alarm running in service worker)
 *
 * The actual countdown is owned by the service worker via chrome.alarms so it
 * survives popup close. This hook derives the display by polling
 * chrome.storage.local every second.
 */

function sendToWorker(message) {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage(message);
  }
}

export function useTimer(settings) {
  const [phase, setPhase] = useState('idle');
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);

  // Track whether completion has been handled to prevent double-fire
  const completionFiredRef = useRef(false);
  // Store phase/cycleCount in a ref so alarm callback always reads latest value
  const phaseRef = useRef(phase);
  const cycleCountRef = useRef(cycleCount);
  const settingsRef = useRef(settings);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { cycleCountRef.current = cycleCount; }, [cycleCount]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Sync display seconds when idle and settings change
  useEffect(() => {
    if (phase === 'idle') {
      setSecondsLeft(settings.focusDuration * 60);
    }
  }, [settings.focusDuration, phase]);

  // Poll storage every second to derive remaining time from alarm start timestamp
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        // Fallback for non-extension environment (tests/dev)
        setSecondsLeft((prev) => Math.max(0, prev - 1));
        return;
      }

      chrome.storage.local.get('timerState', (result) => {
        if (chrome.runtime.lastError || !result.timerState) return;

        const { startedAt, durationSeconds, isPaused, remainingAtPause } = result.timerState;

        if (isPaused) return;

        const elapsed = (Date.now() - startedAt) / 1000;
        const remaining = Math.max(0, Math.round(durationSeconds - elapsed));
        setSecondsLeft(remaining);
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  // Handle timer reaching zero — poll-detected or storage-confirmed
  useEffect(() => {
    if (secondsLeft === 0 && isRunning && !completionFiredRef.current) {
      completionFiredRef.current = true;
      setIsRunning(false);
      onTimerComplete();
    }
  // onTimerComplete is stable (useCallback with refs) — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isRunning]);

  // ── startFocusSession ────────────────────────────────────────────────────

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
      setIsRunning(true);
      sendToWorker({ type: 'START_TIMER', phase: 'focus', durationSeconds });
    }
  }, []); // uses settingsRef — stable

  // ── beginFocusFromPreFocus ───────────────────────────────────────────────

  const beginFocusFromPreFocus = useCallback(() => {
    completionFiredRef.current = false;
    const s = settingsRef.current;
    const durationSeconds = s.focusDuration * 60;
    setPhase('focus');
    setSecondsLeft(durationSeconds);
    setIsRunning(true);
    sendToWorker({ type: 'START_TIMER', phase: 'focus', durationSeconds });
  }, []); // uses settingsRef — stable

  // ── Timer completion (called locally; alarm fires notification in worker) ──

  const onTimerComplete = useCallback(() => {
    const currentPhase = phaseRef.current;
    const currentCycleCount = cycleCountRef.current;
    const s = settingsRef.current;

    if (currentPhase === 'focus') {
      const newCycleCount = currentCycleCount + 1;
      setCycleCount(newCycleCount);

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
      completionFiredRef.current = false;

      if (s.autoStartNext) {
        setIsRunning(true);
        sendToWorker({ type: 'START_TIMER', phase: 'break', durationSeconds });
      }
    } else if (currentPhase === 'break') {
      setPhase('idle');
      setSecondsLeft(s.focusDuration * 60);
      completionFiredRef.current = false;

      if (s.autoStartNext) {
        // startFocusSession reads settingsRef internally
        startFocusSession();
      }
    }
  }, [startFocusSession]); // all other reads via refs

  // ── Pause / Resume / Reset / Skip ────────────────────────────────────────

  const pause = useCallback(() => {
    setIsRunning(false);
    sendToWorker({ type: 'PAUSE_TIMER' });
  }, []);

  const resume = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev > 0 && (phaseRef.current === 'focus' || phaseRef.current === 'break')) {
        setIsRunning(true);
        sendToWorker({ type: 'RESUME_TIMER', remainingSeconds: prev });
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    completionFiredRef.current = false;
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(settingsRef.current.focusDuration * 60);
    setCycleCount(0);
    setIsLongBreak(false);
    sendToWorker({ type: 'RESET_TIMER' });
  }, []);

  const skipBreak = useCallback(() => {
    completionFiredRef.current = false;
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(settingsRef.current.focusDuration * 60);
    setIsLongBreak(false);
    sendToWorker({ type: 'RESET_TIMER' });
  }, []);

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

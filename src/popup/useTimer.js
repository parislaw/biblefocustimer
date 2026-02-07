import { useState, useEffect, useCallback } from 'react';

/**
 * useTimer — thin client that syncs with background service worker.
 *
 * The background owns all timer state. This hook:
 * 1. Fetches initial state via GET_STATE on mount
 * 2. Listens for STATE_UPDATE broadcasts from background
 * 3. Sends commands (START_FOCUS, PAUSE, etc.) and applies the response
 */
export function useTimer(settings) {
  const [phase, setPhase] = useState('idle');
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [ready, setReady] = useState(false);

  // Apply a state snapshot from the background
  const applyState = useCallback((s) => {
    if (!s) return;
    setPhase(s.phase);
    setSecondsLeft(s.secondsLeft);
    setIsRunning(s.isRunning);
    setCycleCount(s.cycleCount);
    setIsLongBreak(s.isLongBreak);
  }, []);

  // Send a message to the background and apply the returned state
  const send = useCallback((msg) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (response) => {
        if (response && response.state) {
          applyState(response.state);
        }
      });
    }
  }, [applyState]);

  // Fetch state on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (response && response.state) {
          applyState(response.state);
        }
        setReady(true);
      });
    } else {
      // Fallback for non-extension environments
      setReady(true);
    }
  }, [applyState]);

  // Listen for broadcasts from background
  useEffect(() => {
    const listener = (message) => {
      if (message.type === 'STATE_UPDATE' && message.state) {
        applyState(message.state);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [applyState]);

  // Local tick for smooth UI updates while popup is open
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft <= 0]);

  // --- Commands ---
  const startFocusSession = useCallback(() => {
    send({ type: 'START_FOCUS' });
  }, [send]);

  const beginFocusFromPreFocus = useCallback(() => {
    send({ type: 'BEGIN_FOCUS' });
  }, [send]);

  const pause = useCallback(() => {
    send({ type: 'PAUSE' });
  }, [send]);

  const resume = useCallback(() => {
    send({ type: 'RESUME' });
  }, [send]);

  const reset = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);

  const skipBreak = useCallback(() => {
    send({ type: 'SKIP_BREAK' });
  }, [send]);

  return {
    phase,
    secondsLeft,
    isRunning,
    cycleCount,
    isLongBreak,
    ready,
    startFocusSession,
    beginFocusFromPreFocus,
    pause,
    resume,
    reset,
    skipBreak,
  };
}

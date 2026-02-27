/**
 * Mock platform for tests. Supports timer state simulation for useTimer tests.
 */
export function createMockPlatform() {
  let timerState = null;
  let cycleCount = 0;
  let getTimerStateCallCount = 0;
  let settings = null;

  return {
    getSettings(cb) {
      cb(settings);
    },
    setSettings(s, cb) {
      settings = s;
      if (cb) cb();
    },
    getTimerState(cb) {
      getTimerStateCallCount += 1;
      if (!timerState) {
        cb({ timerState: null, cycleCount });
        return;
      }
      const elapsed = getTimerStateCallCount;
      const remaining = Math.max(0, timerState.durationSeconds - elapsed);
      cb({
        timerState: {
          phase: timerState.phase,
          startedAt: Date.now() - elapsed * 1000,
          durationSeconds: timerState.durationSeconds,
          isPaused: false,
          remainingAtPause: null,
        },
        cycleCount,
      });
    },
    startTimer(phase, durationSeconds) {
      timerState = { phase, durationSeconds };
      getTimerStateCallCount = 0;
    },
    pauseTimer() {},
    resumeTimer() {},
    resetTimer() {
      timerState = null;
      cycleCount = 0;
      getTimerStateCallCount = 0;
    },
    setCycleCount(n) {
      cycleCount = n;
    },
    getCustomVerses(cb) {
      cb([]);
    },
    setCustomVerses(_verses, cb) {
      if (cb) cb();
    },
    addCustomVersesListener() {
      return () => {};
    },
    playCompletionSound() {
      return Promise.resolve({ ok: true });
    },
    showNotification() {},
    onTimerComplete() {},
    getCompletionSoundUrl() {
      return '';
    },
    getCompletionSoundVolume() {
      return 0.8;
    },
  };
}

export function createMockPlatformWithCustomVerses(initialVerses = []) {
  let customVerses = [...initialVerses];
  let listener = null;
  const platform = createMockPlatform();
  return {
    ...platform,
    getCustomVerses(cb) {
      cb(customVerses);
    },
    setCustomVerses(verses, cb) {
      customVerses = verses;
      if (cb) cb();
    },
    addCustomVersesListener(cb) {
      listener = cb;
      return () => { listener = null; };
    },
    notifyCustomVersesChanged(verses) {
      customVerses = verses;
      if (listener) listener(verses);
    },
  };
}

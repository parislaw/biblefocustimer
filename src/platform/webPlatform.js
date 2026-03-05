/**
 * Web platform: localStorage, in-page timer, Web Notifications API, in-page audio.
 * Timer runs only while the tab is open; state is persisted for refresh.
 */

const SETTINGS_KEY = 'selah-settings';
const TIMER_STATE_KEY = 'selah-timerState';
const CYCLE_COUNT_KEY = 'selah-cycleCount';
const CUSTOM_VERSES_KEY = 'selah-custom-verses';

const SOUND_FILES = { praise: 'jesuschristisgod-children-saying-yay-praise-and-worship-jesus-299607.mp3', 'bell-1': 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-1-241683.mp3', 'bell-3': 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-3-241681.mp3', 'bell-4': 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-4-241680.mp3' };

let timerIntervalId = null;
let timerState = null;
let cycleCount = 0;

function readTimerFromStorage() {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    const rawCycle = localStorage.getItem(CYCLE_COUNT_KEY);
    if (raw) timerState = JSON.parse(raw);
    if (rawCycle !== null) cycleCount = parseInt(rawCycle, 10) || 0;
  } catch (_) {
    timerState = null;
    cycleCount = 0;
  }
}

function persistTimer() {
  try {
    if (timerState) localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
    else localStorage.removeItem(TIMER_STATE_KEY);
    localStorage.setItem(CYCLE_COUNT_KEY, String(cycleCount));
  } catch (_) {}
}

function clearTimerInterval() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function tick() {
  if (!timerState || timerState.isPaused) return;
  const elapsed = (Date.now() - timerState.startedAt) / 1000;
  const remaining = Math.max(0, timerState.durationSeconds - elapsed);
  timerState.remainingAtPause = remaining;
  persistTimer();
  if (remaining <= 0) clearTimerInterval();
}

export const webPlatform = {
  getSettings(callback) {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      callback(raw ? JSON.parse(raw) : null);
    } catch (_) {
      callback(null);
    }
  },

  setSettings(settings, callback) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (callback) callback();
    } catch (e) {
      if (callback) callback();
    }
  },

  getTimerState(callback) {
    readTimerFromStorage();
    if (!timerState) {
      callback({ timerState: null, cycleCount });
      return;
    }
    const { phase, startedAt, durationSeconds, isPaused, remainingAtPause } = timerState;
    if (isPaused && remainingAtPause != null) {
      callback({ timerState: { ...timerState }, cycleCount });
      return;
    }
    const elapsed = (Date.now() - startedAt) / 1000;
    const remaining = Math.max(0, Math.round(durationSeconds - elapsed));
    const synthetic = {
      phase,
      startedAt: Date.now() - (durationSeconds - remaining) * 1000,
      durationSeconds,
      isPaused: false,
      remainingAtPause: null,
    };
    callback({ timerState: synthetic, cycleCount });
  },

  startTimer(phase, durationSeconds) {
    clearTimerInterval();
    timerState = {
      phase,
      startedAt: Date.now(),
      durationSeconds,
      isPaused: false,
      remainingAtPause: null,
    };
    persistTimer();
    timerIntervalId = setInterval(tick, 1000);
  },

  pauseTimer() {
    if (!timerState || timerState.isPaused) return;
    const elapsed = (Date.now() - timerState.startedAt) / 1000;
    const remaining = Math.max(0, timerState.durationSeconds - elapsed);
    clearTimerInterval();
    timerState = { ...timerState, isPaused: true, remainingAtPause: remaining };
    persistTimer();
  },

  resumeTimer(remainingSeconds) {
    if (!timerState) return;
    clearTimerInterval();
    timerState = {
      ...timerState,
      startedAt: Date.now() - (timerState.durationSeconds - remainingSeconds) * 1000,
      durationSeconds: remainingSeconds,
      isPaused: false,
      remainingAtPause: null,
    };
    persistTimer();
    timerIntervalId = setInterval(tick, 1000);
  },

  resetTimer() {
    clearTimerInterval();
    timerState = null;
    cycleCount = 0;
    persistTimer();
  },

  setCycleCount(n) {
    cycleCount = n;
    persistTimer();
  },

  getCustomVerses(callback) {
    try {
      const raw = localStorage.getItem(CUSTOM_VERSES_KEY);
      callback(raw ? JSON.parse(raw) : []);
    } catch (_) {
      callback([]);
    }
  },

  setCustomVerses(verses, callback) {
    try {
      localStorage.setItem(CUSTOM_VERSES_KEY, JSON.stringify(verses));
    } catch (_) {}
    if (callback) callback();
  },

  addCustomVersesListener(_callback) {
    return () => {};
  },

  playCompletionSound(soundUrl, volume) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(soundUrl);
      audio.volume = typeof volume === 'number' ? Math.max(0, Math.min(1, volume)) : 0.8;
      audio.play().then(() => resolve({ ok: true })).catch(reject);
    });
  },

  showNotification(title, message) {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification(title, { body: message });
      });
    }
  },

  onTimerComplete(phase, settings) {
    const isFocus = phase === 'focus';
    const title = isFocus ? 'Focus session complete' : 'Break is over';
    const message = isFocus ? 'Well done. Time for a break.' : 'Ready for another focus session?';
    if (settings?.stickyNotification !== false) this.showNotification(title, message);
    if (settings?.playCompletionSound !== false) {
      const url = this.getCompletionSoundUrl(settings);
      const vol = this.getCompletionSoundVolume(settings);
      if (url) this.playCompletionSound(url, vol);
    }
  },

  getCompletionSoundUrl(settings) {
    const id = settings?.completionSoundId || 'complete';
    const file = SOUND_FILES[id] || SOUND_FILES.complete;
    return './sounds/' + file;
  },

  getCompletionSoundVolume(settings) {
    const v = settings?.completionSoundVolume;
    if (typeof v !== 'number' || v < 0 || v > 100) return 0.8;
    return v / 100;
  },
};

/**
 * Chrome extension platform: storage, timer (via background), notifications, sound (via offscreen).
 */

const CUSTOM_VERSES_KEY = 'customVerses';

function sendMessage(message) {
  if (typeof chrome === 'undefined' || !chrome.runtime) return Promise.reject(new Error('Chrome runtime unavailable'));
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(response);
    });
  });
}

export const chromePlatform = {
  getSettings(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
      callback(null);
      return;
    }
    chrome.storage.sync.get('settings', (result) => {
      if (chrome.runtime.lastError) callback(null);
      else callback(result.settings || null);
    });
  },

  setSettings(settings, callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
      if (callback) callback();
      return;
    }
    chrome.storage.sync.set({ settings }, () => {
      if (callback) callback();
    });
  },

  getTimerState(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      callback({ timerState: null, cycleCount: 0 });
      return;
    }
    chrome.storage.local.get(['timerState', 'cycleCount'], (result) => {
      if (chrome.runtime.lastError) callback({ timerState: null, cycleCount: 0 });
      else callback({
        timerState: result.timerState || null,
        cycleCount: typeof result.cycleCount === 'number' ? result.cycleCount : 0,
      });
    });
  },

  startTimer(phase, durationSeconds) {
    sendMessage({ type: 'START_TIMER', phase, durationSeconds });
  },

  pauseTimer() {
    sendMessage({ type: 'PAUSE_TIMER' });
  },

  resumeTimer(remainingSeconds) {
    sendMessage({ type: 'RESUME_TIMER', remainingSeconds });
  },

  resetTimer() {
    sendMessage({ type: 'RESET_TIMER' });
  },

  setCycleCount(n) {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    chrome.storage.local.set({ cycleCount: n });
  },

  getCustomVerses(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      callback([]);
      return;
    }
    chrome.storage.local.get(CUSTOM_VERSES_KEY, (result) => {
      if (chrome.runtime.lastError) callback([]);
      else callback(Array.isArray(result[CUSTOM_VERSES_KEY]) ? result[CUSTOM_VERSES_KEY] : []);
    });
  },

  setCustomVerses(verses, callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      if (callback) callback();
      return;
    }
    chrome.storage.local.set({ [CUSTOM_VERSES_KEY]: verses }, () => {
      if (callback) callback();
    });
  },

  addCustomVersesListener(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return () => {};
    const handler = (changes, areaName) => {
      if (areaName === 'local' && changes[CUSTOM_VERSES_KEY]) {
        const next = changes[CUSTOM_VERSES_KEY].newValue;
        callback(Array.isArray(next) ? next : []);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  },

  playCompletionSound(soundUrl, volume) {
    return sendMessage({ type: 'PLAY_COMPLETION_SOUND', soundUrl, volume });
  },

  showNotification(title, message) {
    sendMessage({ type: 'SHOW_NOTIFICATION', title, message });
  },

  onTimerComplete(/* phase, settings */) {
    // No-op: service worker handles notification + sound when alarm fires
  },

  getCompletionSoundUrl(settings) {
    if (typeof chrome === 'undefined' || !chrome.runtime) return '';
    const SOUND_FILES = { praise: 'jesuschristisgod-children-saying-yay-praise-and-worship-jesus-299607.mp3', 'bell-1': 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-1-241683.mp3', 'bell-3': 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-3-241681.mp3', 'bell-4': 'kalsstockmedia-church-temple-bell-gong-dong-sound-effect-4-241680.mp3' };
    const id = settings?.completionSoundId || 'praise';
    const file = SOUND_FILES[id] || SOUND_FILES.complete;
    return chrome.runtime.getURL('sounds/' + file);
  },

  getCompletionSoundVolume(settings) {
    const v = settings?.completionSoundVolume;
    if (typeof v !== 'number' || v < 0 || v > 100) return 0.8;
    return v / 100;
  },
};

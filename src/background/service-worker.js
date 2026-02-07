/**
 * Selah Focus — Background Service Worker
 *
 * Owns all timer state so it persists when the popup closes.
 * Uses chrome.alarms (1-second ticks) for reliable countdown even
 * when the service worker is suspended by Chrome.
 */

const ALARM_NAME = 'selah-tick';

// Default settings (mirrored from useStorage.js)
const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  scriptureEnabled: true,
  translation: 'esv',
  theme: 'random',
  verseMode: 'daily',
};

// --- Timer State ---
let state = {
  phase: 'idle',       // idle | preFocus | focus | break
  secondsLeft: 25 * 60,
  isRunning: false,
  cycleCount: 0,
  isLongBreak: false,
  // Timestamp-based tracking for accuracy across service worker restarts
  endTime: null,       // Date.now() + ms remaining when running
};

// --- Settings cache ---
let settings = { ...DEFAULT_SETTINGS };

// --- Initialization ---
// Restore state from storage on service worker start (it may restart)
chrome.storage.local.get(['timerState', 'settings'], (result) => {
  if (result.settings) {
    settings = { ...DEFAULT_SETTINGS, ...result.settings };
  }
  if (result.timerState) {
    state = { ...state, ...result.timerState };
    // Recalculate secondsLeft from endTime if timer was running
    if (state.isRunning && state.endTime) {
      const remaining = Math.round((state.endTime - Date.now()) / 1000);
      if (remaining > 0) {
        state.secondsLeft = remaining;
        startAlarm();
      } else {
        // Timer completed while service worker was down
        state.secondsLeft = 0;
        state.isRunning = false;
        onTimerComplete();
      }
    }
  } else {
    state.secondsLeft = settings.focusDuration * 60;
  }
});

// --- Alarm-based tick ---
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  if (!state.isRunning || !state.endTime) {
    stopAlarm();
    return;
  }

  const remaining = Math.round((state.endTime - Date.now()) / 1000);

  if (remaining <= 0) {
    state.secondsLeft = 0;
    state.isRunning = false;
    state.endTime = null;
    stopAlarm();
    persistState();
    onTimerComplete();
    broadcastState();
    updateBadgeTime();
  } else {
    state.secondsLeft = remaining;
    broadcastState();
    updateBadgeTime();
  }
});

function startAlarm() {
  // Chrome alarms minimum period is ~1 minute in production,
  // but we use periodInMinutes as small as allowed.
  // For sub-minute accuracy, we also compute from endTime.
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 });
}

function stopAlarm() {
  chrome.alarms.clear(ALARM_NAME);
}

// --- Timer completion logic ---
function onTimerComplete() {
  if (state.phase === 'focus') {
    state.cycleCount += 1;

    const shouldLongBreak =
      settings.cyclesBeforeLongBreak > 0 &&
      state.cycleCount % settings.cyclesBeforeLongBreak === 0;

    state.isLongBreak = shouldLongBreak;

    const breakDuration = shouldLongBreak
      ? settings.longBreakDuration
      : settings.shortBreakDuration;

    state.phase = 'break';
    state.secondsLeft = breakDuration * 60;

    showNotification('Focus session complete', 'Well done. Time for a break.');

    if (settings.autoStartNext) {
      state.isRunning = true;
      state.endTime = Date.now() + state.secondsLeft * 1000;
      startAlarm();
    }
  } else if (state.phase === 'break') {
    showNotification('Break is over', 'Ready for another focus session?');

    state.phase = 'idle';
    state.secondsLeft = settings.focusDuration * 60;
    state.isLongBreak = false;

    if (settings.autoStartNext) {
      // Auto-start goes to preFocus if scripture enabled, else straight to focus
      if (settings.scriptureEnabled) {
        state.phase = 'preFocus';
      } else {
        state.phase = 'focus';
        state.isRunning = true;
        state.endTime = Date.now() + state.secondsLeft * 1000;
        startAlarm();
      }
    }
  }

  persistState();
}

// --- Message handling from popup ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_STATE':
      // Recalculate remaining time from endTime for accuracy
      if (state.isRunning && state.endTime) {
        const remaining = Math.round((state.endTime - Date.now()) / 1000);
        state.secondsLeft = Math.max(0, remaining);
      }
      sendResponse({ state, settings });
      return false;

    case 'START_FOCUS':
      if (settings.scriptureEnabled) {
        state.phase = 'preFocus';
        state.isRunning = false;
        state.endTime = null;
      } else {
        state.phase = 'focus';
        state.secondsLeft = settings.focusDuration * 60;
        state.isRunning = true;
        state.endTime = Date.now() + state.secondsLeft * 1000;
        startAlarm();
      }
      persistState();
      broadcastState();
      updateBadgeTime();
      sendResponse({ state });
      return false;

    case 'BEGIN_FOCUS':
      state.phase = 'focus';
      state.secondsLeft = settings.focusDuration * 60;
      state.isRunning = true;
      state.endTime = Date.now() + state.secondsLeft * 1000;
      startAlarm();
      persistState();
      broadcastState();
      updateBadgeTime();
      sendResponse({ state });
      return false;

    case 'PAUSE':
      state.isRunning = false;
      // Snapshot remaining time
      if (state.endTime) {
        state.secondsLeft = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
      }
      state.endTime = null;
      stopAlarm();
      persistState();
      broadcastState();
      updateBadgeTime();
      sendResponse({ state });
      return false;

    case 'RESUME':
      if (state.secondsLeft > 0 && (state.phase === 'focus' || state.phase === 'break')) {
        state.isRunning = true;
        state.endTime = Date.now() + state.secondsLeft * 1000;
        startAlarm();
      }
      persistState();
      broadcastState();
      updateBadgeTime();
      sendResponse({ state });
      return false;

    case 'RESET':
      state.isRunning = false;
      state.phase = 'idle';
      state.secondsLeft = settings.focusDuration * 60;
      state.cycleCount = 0;
      state.isLongBreak = false;
      state.endTime = null;
      stopAlarm();
      persistState();
      broadcastState();
      updateBadgeTime();
      sendResponse({ state });
      return false;

    case 'SKIP_BREAK':
      state.isRunning = false;
      state.phase = 'idle';
      state.secondsLeft = settings.focusDuration * 60;
      state.endTime = null;
      stopAlarm();
      persistState();
      broadcastState();
      updateBadgeTime();
      sendResponse({ state });
      return false;

    case 'SETTINGS_UPDATED':
      settings = { ...DEFAULT_SETTINGS, ...message.settings };
      // If idle, sync the display duration
      if (state.phase === 'idle') {
        state.secondsLeft = settings.focusDuration * 60;
      }
      persistState();
      broadcastState();
      sendResponse({ state });
      return false;

    default:
      return false;
  }
});

// --- State persistence ---
function persistState() {
  chrome.storage.local.set({ timerState: state });
}

// --- Broadcast to popup(s) ---
function broadcastState() {
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', state }).catch(() => {
    // Popup not open — ignore
  });
}

// --- Badge ---
function updateBadgeTime() {
  if (state.isRunning && (state.phase === 'focus' || state.phase === 'break')) {
    const mins = Math.ceil(state.secondsLeft / 60);
    chrome.action.setBadgeText({ text: String(mins) });
    chrome.action.setBadgeBackgroundColor({
      color: state.phase === 'focus' ? '#6B8F71' : '#8FA7C4',
    });
  } else if (state.phase === 'break' && !state.isRunning) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#8FA7C4' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// --- Notifications ---
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    silent: false,
  });
}

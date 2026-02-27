/**
 * Selah Focus — Background Service Worker
 *
 * Owns the timer lifecycle using chrome.alarms so the countdown survives
 * popup close. Timer state is persisted in chrome.storage.local so the popup
 * can reconstruct the display when reopened.
 */

const ALARM_NAME = 'selahTimerComplete';

// ─── Message Handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate same-extension origin
  if (sender.id !== chrome.runtime.id) {
    console.warn('Rejected message from unauthorized sender:', sender);
    return false;
  }

  if (!message || typeof message !== 'object' || !message.type) {
    console.warn('Rejected malformed message:', message);
    return false;
  }

  switch (message.type) {
    case 'START_TIMER':
      handleStartTimer(message);
      break;
    case 'PAUSE_TIMER':
      handlePauseTimer();
      break;
    case 'RESUME_TIMER':
      handleResumeTimer(message);
      break;
    case 'RESET_TIMER':
      handleResetTimer();
      break;
    // Legacy: popup-computed completion (kept for backward compat during transition)
    case 'TIMER_COMPLETE': {
      const validPhases = ['focus', 'break'];
      if (validPhases.includes(message.phase)) {
        handleTimerComplete(message.phase);
      }
      break;
    }
    case 'PLAY_TEST_SOUND':
    case 'PLAY_COMPLETION_SOUND': {
      const soundUrl = message.soundUrl;
      const volume = message.volume;
      const promise = (soundUrl != null && typeof volume === 'number')
        ? playCompletionSoundViaOffscreen(soundUrl, volume)
        : new Promise((resolve, reject) => {
            chrome.storage.sync.get('settings', (r) => {
              const s = r.settings || {};
              playCompletionSoundViaOffscreen(getCompletionSoundUrl(s), getCompletionSoundVolume(s)).then(resolve).catch(reject);
            });
          });
      promise.then(() => sendResponse({ ok: true })).catch((err) => {
        console.error('Completion sound failed:', err);
        sendResponse({ ok: false });
      });
      return true;
    }
    case 'SHOW_NOTIFICATION': {
      if (message.title != null && message.message != null) {
        showNotification(message.title, message.message);
      }
      break;
    }
    default:
      break;
  }

  return false;
});

// ─── Timer Control ───────────────────────────────────────────────────────────

function handleStartTimer({ phase, durationSeconds }) {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: durationSeconds / 60,
    });
  });

  chrome.storage.local.set({
    timerState: {
      phase,
      startedAt: Date.now(),
      durationSeconds,
      isPaused: false,
      remainingAtPause: null,
    },
  });
}

function handlePauseTimer() {
  chrome.storage.local.get('timerState', (result) => {
    if (!result.timerState || result.timerState.isPaused) return;

    const elapsed = (Date.now() - result.timerState.startedAt) / 1000;
    const remaining = Math.max(0, result.timerState.durationSeconds - elapsed);

    chrome.alarms.clear(ALARM_NAME);
    chrome.storage.local.set({
      timerState: {
        ...result.timerState,
        isPaused: true,
        remainingAtPause: remaining,
      },
    });
  });
}

function handleResumeTimer({ remainingSeconds }) {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: remainingSeconds / 60,
  });

  chrome.storage.local.get('timerState', (result) => {
    if (!result.timerState) return;
    chrome.storage.local.set({
      timerState: {
        ...result.timerState,
        startedAt: Date.now(),
        durationSeconds: remainingSeconds,
        isPaused: false,
        remainingAtPause: null,
      },
    });
  });
}

function handleResetTimer() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.remove('timerState');
  chrome.storage.local.set({ cycleCount: 0 });
  updateBadge('', '');
}

// ─── Alarm Fired ─────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  chrome.storage.local.get('timerState', (result) => {
    const phase = result.timerState?.phase ?? 'focus';
    handleTimerComplete(phase);
    chrome.storage.local.remove('timerState');
  });
});

// ─── Completion Logic ─────────────────────────────────────────────────────────

function handleTimerComplete(phase) {
  const isFocus = phase === 'focus';
  if (isFocus) {
    updateBadge('!', '#6B8F71');
    chrome.storage.local.get('cycleCount', (r) => {
      const next = (typeof r.cycleCount === 'number' ? r.cycleCount : 0) + 1;
      chrome.storage.local.set({ cycleCount: next });
    });
  } else {
    updateBadge('', '');
  }

  chrome.storage.sync.get('settings', (syncResult) => {
    const settings = syncResult.settings || {};
    const stickyNotification = settings.stickyNotification !== false;
    const playCompletionSound = settings.playCompletionSound !== false;

    const title = isFocus ? 'Focus session complete' : 'Break is over';
    const message = isFocus ? 'Well done. Time for a break.' : 'Ready for another focus session?';
    showNotification(title, message, stickyNotification);

    if (playCompletionSound) {
      const soundUrl = getCompletionSoundUrl(settings);
      const volume = getCompletionSoundVolume(settings);
      playCompletionSoundViaOffscreen(soundUrl, volume);
    }
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showNotification(title, message, requireInteraction = true) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    silent: false,
    requireInteraction: !!requireInteraction,
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to create notification:', chrome.runtime.lastError);
    }
  });
}

const OFFSCREEN_URL = 'offscreen.html';
const OFFSCREEN_REASON = 'AUDIO_PLAYBACK';
const OFFSCREEN_JUSTIFICATION = 'Play completion sound when focus or break timer ends';

const SOUND_FILES = {
  complete: 'complete.mp3',
  extraterrestrial: 'alert-extraterrestrial.mp3',
  dragon: 'alert-dragon.mp3',
};

function getCompletionSoundUrl(settings) {
  const id = settings.completionSoundId || 'complete';
  const file = SOUND_FILES[id] || SOUND_FILES.complete;
  return chrome.runtime.getURL('sounds/' + file);
}

function getCompletionSoundVolume(settings) {
  const v = settings.completionSoundVolume;
  if (typeof v !== 'number' || v < 0 || v > 100) return 0.8;
  return v / 100;
}

async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  if (existing.length > 0) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [OFFSCREEN_REASON],
    justification: OFFSCREEN_JUSTIFICATION,
  });
}

function playCompletionSoundViaOffscreen(soundUrl, volume = 0.8) {
  return ensureOffscreenDocument()
    .then(() => chrome.runtime.sendMessage({ type: 'PLAY_COMPLETION_SOUND', soundUrl, volume }))
    .catch((err) => {
      console.error('Completion sound failed:', err);
      throw err;
    });
}

function updateBadge(text, color) {
  chrome.action.setBadgeText({ text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

// Clear badge when popup opens
chrome.runtime.onConnect.addListener(() => {
  updateBadge('', '');
});

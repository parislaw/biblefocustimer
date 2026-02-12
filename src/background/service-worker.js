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
  if (phase === 'focus') {
    showNotification('Focus session complete', 'Well done. Time for a break.');
    updateBadge('!', '#6B8F71');
  } else if (phase === 'break') {
    showNotification('Break is over', 'Ready for another focus session?');
    updateBadge('', '');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    silent: false,
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to create notification:', chrome.runtime.lastError);
    }
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

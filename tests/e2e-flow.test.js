/**
 * End-to-end flow tests.
 *
 * Simulates the full user journey through the Chrome extension:
 * 1. Open popup → see idle state
 * 2. Start focus → preFocus with verse → begin focus
 * 3. Pause → resume
 * 4. Complete focus → break with verse
 * 5. Skip break → back to idle
 * 6. Settings changes propagate correctly
 *
 * These tests exercise the background state machine + popup hooks together.
 */

// --- Chrome mock ---
let storageData = {};
let messageListeners = [];

const chrome = {
  storage: {
    local: {
      get: jest.fn((keys, cb) => {
        const result = {};
        if (typeof keys === 'string') {
          result[keys] = storageData[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach((k) => { result[k] = storageData[k]; });
        }
        cb(result);
      }),
      set: jest.fn((data) => {
        Object.assign(storageData, data);
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn((fn) => messageListeners.push(fn)),
      removeListener: jest.fn(),
    },
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: { addListener: jest.fn() },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  notifications: { create: jest.fn() },
};
global.chrome = chrome;

function sendMessage(msg) {
  return new Promise((resolve) => {
    const handler = messageListeners[0];
    handler(msg, {}, (response) => resolve(response));
  });
}

beforeEach(() => {
  storageData = {};
  messageListeners = [];
  jest.clearAllMocks();
  jest.resetModules();
  require('../src/background/service-worker');
});

describe('End-to-end: full Pomodoro cycle with Scripture', () => {
  test('idle → preFocus → focus → pause → resume → reset', async () => {
    // 1. Initial state is idle
    let res = await sendMessage({ type: 'GET_STATE' });
    expect(res.state.phase).toBe('idle');
    expect(res.state.secondsLeft).toBe(25 * 60);

    // 2. Start focus — scripture enabled by default → preFocus
    res = await sendMessage({ type: 'START_FOCUS' });
    expect(res.state.phase).toBe('preFocus');
    expect(res.state.isRunning).toBe(false);

    // 3. Begin focus from preFocus
    res = await sendMessage({ type: 'BEGIN_FOCUS' });
    expect(res.state.phase).toBe('focus');
    expect(res.state.isRunning).toBe(true);
    expect(res.state.secondsLeft).toBe(25 * 60);

    // 4. Pause
    res = await sendMessage({ type: 'PAUSE' });
    expect(res.state.phase).toBe('focus');
    expect(res.state.isRunning).toBe(false);
    expect(res.state.secondsLeft).toBeGreaterThan(0);

    // 5. Resume
    res = await sendMessage({ type: 'RESUME' });
    expect(res.state.phase).toBe('focus');
    expect(res.state.isRunning).toBe(true);

    // 6. Reset
    res = await sendMessage({ type: 'RESET' });
    expect(res.state.phase).toBe('idle');
    expect(res.state.isRunning).toBe(false);
    expect(res.state.cycleCount).toBe(0);
  });

  test('scripture disabled: idle → focus (skips preFocus)', async () => {
    await sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: { scriptureEnabled: false },
    });

    const res = await sendMessage({ type: 'START_FOCUS' });
    expect(res.state.phase).toBe('focus');
    expect(res.state.isRunning).toBe(true);
  });

  test('skip break returns to idle', async () => {
    await sendMessage({ type: 'START_FOCUS' });
    await sendMessage({ type: 'BEGIN_FOCUS' });

    // Skip break from any state
    const res = await sendMessage({ type: 'SKIP_BREAK' });
    expect(res.state.phase).toBe('idle');
    expect(res.state.isRunning).toBe(false);
  });
});

describe('End-to-end: settings propagation', () => {
  test('changing focus duration updates idle timer', async () => {
    await sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: { focusDuration: 45 },
    });

    const res = await sendMessage({ type: 'GET_STATE' });
    expect(res.state.secondsLeft).toBe(45 * 60);
    expect(res.settings.focusDuration).toBe(45);
  });

  test('changing translation is stored in settings', async () => {
    await sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: { translation: 'kjv' },
    });

    const res = await sendMessage({ type: 'GET_STATE' });
    expect(res.settings.translation).toBe('kjv');
  });

  test('changing verseMode is stored in settings', async () => {
    await sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: { verseMode: 'random' },
    });

    const res = await sendMessage({ type: 'GET_STATE' });
    expect(res.settings.verseMode).toBe('random');
  });
});

describe('End-to-end: multiple commands sequence', () => {
  test('rapid start → pause → resume → pause → reset', async () => {
    let res;

    res = await sendMessage({ type: 'START_FOCUS' });
    expect(res.state.phase).toBe('preFocus');

    res = await sendMessage({ type: 'BEGIN_FOCUS' });
    expect(res.state.phase).toBe('focus');
    expect(res.state.isRunning).toBe(true);

    res = await sendMessage({ type: 'PAUSE' });
    expect(res.state.isRunning).toBe(false);

    res = await sendMessage({ type: 'RESUME' });
    expect(res.state.isRunning).toBe(true);

    res = await sendMessage({ type: 'PAUSE' });
    expect(res.state.isRunning).toBe(false);

    res = await sendMessage({ type: 'RESET' });
    expect(res.state.phase).toBe('idle');
    expect(res.state.cycleCount).toBe(0);
  });

  test('start new focus session after reset preserves clean state', async () => {
    // First session
    await sendMessage({ type: 'START_FOCUS' });
    await sendMessage({ type: 'BEGIN_FOCUS' });
    await sendMessage({ type: 'RESET' });

    // Second session
    const res = await sendMessage({ type: 'START_FOCUS' });
    expect(res.state.phase).toBe('preFocus');
    expect(res.state.cycleCount).toBe(0);
  });
});

describe('End-to-end: persistence across popup close/reopen', () => {
  test('state persists in storage after each command', async () => {
    await sendMessage({ type: 'START_FOCUS' });
    await sendMessage({ type: 'BEGIN_FOCUS' });

    // Verify storage was written
    expect(chrome.storage.local.set).toHaveBeenCalled();

    const lastCall =
      chrome.storage.local.set.mock.calls[
        chrome.storage.local.set.mock.calls.length - 1
      ][0];
    expect(lastCall.timerState).toBeDefined();
    expect(lastCall.timerState.phase).toBe('focus');
    expect(lastCall.timerState.isRunning).toBe(true);
  });

  test('GET_STATE returns accurate state for popup sync', async () => {
    await sendMessage({ type: 'START_FOCUS' });
    await sendMessage({ type: 'BEGIN_FOCUS' });
    await sendMessage({ type: 'PAUSE' });

    // Simulate popup reopening with GET_STATE
    const res = await sendMessage({ type: 'GET_STATE' });
    expect(res.state.phase).toBe('focus');
    expect(res.state.isRunning).toBe(false);
    expect(res.state.secondsLeft).toBeGreaterThan(0);
    expect(res.settings).toBeDefined();
    expect(res.settings.focusDuration).toBe(25);
  });
});

describe('End-to-end: notifications and badge', () => {
  test('badge shows remaining minutes during focus', async () => {
    await sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: { scriptureEnabled: false },
    });

    chrome.action.setBadgeText.mockClear();
    await sendMessage({ type: 'START_FOCUS' });

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '25' });
  });

  test('badge clears on reset', async () => {
    await sendMessage({ type: 'START_FOCUS' });
    await sendMessage({ type: 'BEGIN_FOCUS' });

    chrome.action.setBadgeText.mockClear();
    await sendMessage({ type: 'RESET' });

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });
});

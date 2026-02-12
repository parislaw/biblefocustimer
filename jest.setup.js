require('@testing-library/jest-dom');

const storage = {};

// Simulate the service worker's storage writes when messages are sent from the popup.
// This lets useTimer tests work without a real service worker.
function simulateWorkerMessage(message) {
  if (!message || !message.type) return;

  switch (message.type) {
    case 'START_TIMER':
      storage['timerState'] = {
        phase: message.phase,
        startedAt: Date.now(),
        durationSeconds: message.durationSeconds,
        isPaused: false,
        remainingAtPause: null,
      };
      break;
    case 'PAUSE_TIMER': {
      const state = storage['timerState'];
      if (state && !state.isPaused) {
        const elapsed = (Date.now() - state.startedAt) / 1000;
        const remaining = Math.max(0, state.durationSeconds - elapsed);
        storage['timerState'] = { ...state, isPaused: true, remainingAtPause: remaining };
      }
      break;
    }
    case 'RESUME_TIMER': {
      const state = storage['timerState'];
      if (state) {
        storage['timerState'] = {
          ...state,
          startedAt: Date.now(),
          durationSeconds: message.remainingSeconds,
          isPaused: false,
          remainingAtPause: null,
        };
      }
      break;
    }
    case 'RESET_TIMER':
      delete storage['timerState'];
      break;
    default:
      break;
  }
}

global.chrome = {
  storage: {
    local: {
      get: (keys, callback) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach((k) => {
            if (storage[k] !== undefined) result[k] = storage[k];
          });
        } else if (typeof keys === 'string') {
          if (storage[keys] !== undefined) result[keys] = storage[keys];
        } else if (keys === null || keys === undefined) {
          Object.assign(result, storage);
        }
        callback(result);
      },
      set: (items, callback) => {
        Object.assign(storage, items);
        if (typeof callback === 'function') callback();
      },
      remove: (keys, callback) => {
        const list = Array.isArray(keys) ? keys : [keys];
        list.forEach((k) => delete storage[k]);
        if (typeof callback === 'function') callback();
      },
    },
  },
  runtime: {
    lastError: null,
    sendMessage: jest.fn((msg, cb) => {
      simulateWorkerMessage(msg);
      if (typeof cb === 'function') cb();
    }),
  },
};

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
  jest.clearAllMocks();
});

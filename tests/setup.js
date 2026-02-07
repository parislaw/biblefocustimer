/**
 * Chrome API mock for tests.
 * Provides a minimal mock of chrome.storage, chrome.runtime,
 * chrome.alarms, chrome.action, and chrome.notifications.
 */

const storageData = {};

const chrome = {
  storage: {
    local: {
      get: jest.fn((keys, cb) => {
        if (typeof keys === 'string') {
          cb({ [keys]: storageData[keys] });
        } else if (Array.isArray(keys)) {
          const result = {};
          keys.forEach((k) => { result[k] = storageData[k]; });
          cb(result);
        } else {
          cb(storageData);
        }
      }),
      set: jest.fn((data, cb) => {
        Object.assign(storageData, data);
        if (cb) cb();
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn((msg, cb) => {
      if (cb) cb(undefined);
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
  },
};

global.chrome = chrome;

// Helper to reset storage between tests
global.__resetChromeStorage = () => {
  Object.keys(storageData).forEach((k) => delete storageData[k]);
};

// Helper to seed storage
global.__setChromeStorage = (data) => {
  Object.assign(storageData, data);
};

require('@testing-library/jest-dom');

const storage = {};
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
    },
  },
  runtime: {
    lastError: null,
    sendMessage: jest.fn((msg, cb) => {
      if (typeof cb === 'function') cb();
    }),
  },
};

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
  jest.clearAllMocks();
});

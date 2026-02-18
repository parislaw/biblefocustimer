const STORAGE_KEY = 'customVerses';

export function getCustomVerses(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to load custom verses:', chrome.runtime.lastError);
        callback([]);
        return;
      }
      const list = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      callback(list);
    });
  } else {
    callback([]);
  }
}

export function setCustomVerses(verses, callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [STORAGE_KEY]: verses }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save custom verses:', chrome.runtime.lastError);
      }
      if (callback) callback();
    });
  } else if (callback) {
    callback();
  }
}

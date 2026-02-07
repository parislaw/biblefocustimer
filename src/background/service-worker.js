/**
 * Selah Focus — Background Service Worker
 * Handles notifications and badge updates for the Chrome extension.
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TIMER_COMPLETE') {
    handleTimerComplete(message.phase);
  }
  return false;
});

function handleTimerComplete(phase) {
  if (phase === 'focus') {
    showNotification(
      'Focus session complete',
      'Well done. Time for a break.'
    );
    updateBadge('!', '#6B8F71');
  } else if (phase === 'break') {
    showNotification(
      'Break is over',
      'Ready for another focus session?'
    );
    updateBadge('', '');
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    silent: false,
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

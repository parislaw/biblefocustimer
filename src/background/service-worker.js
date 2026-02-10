/**
 * Selah Focus — Background Service Worker
 * Handles notifications and badge updates for the Chrome extension.
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Verify message is from this extension, not external
  if (!sender.id || sender.id !== chrome.runtime.id) {
    console.warn('Rejected message from unauthorized sender:', sender);
    return false;
  }

  // Validate message structure
  if (!message || typeof message !== 'object' || !message.type) {
    console.warn('Rejected malformed message:', message);
    return false;
  }

  if (message.type === 'TIMER_COMPLETE') {
    // Validate phase is expected value
    const validPhases = ['focus', 'break'];
    if (validPhases.includes(message.phase)) {
      handleTimerComplete(message.phase);
    } else {
      console.warn('Invalid phase received:', message.phase);
    }
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
  }, (notificationId) => {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PLAY_COMPLETION_SOUND') {
    const soundUrl = message.soundUrl || chrome.runtime.getURL('sounds/complete.mp3');
    const volume = typeof message.volume === 'number' ? Math.max(0, Math.min(1, message.volume)) : 0.8;

    try {
      const audio = new Audio(soundUrl);
      audio.volume = volume;
      audio.play()
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          console.warn('Failed to play sound:', error);
          sendResponse({ ok: false, error: error.message });
        });
    } catch (error) {
      console.warn('Audio creation error:', error);
      sendResponse({ ok: false, error: error.message });
    }

    return true; // indicates async response
  }
});

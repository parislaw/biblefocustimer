# Timer Completion Sound Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user-selectable sound notifications that play when timer phases complete, with settings UI to choose or disable sound.

**Architecture:** Store sound preferences in Chrome storage, play audio via Web Audio API when `onTimerComplete` fires. Sounds are bundled in `dist/sounds/` via webpack copy plugin. Settings UI in SettingsView allows toggling and selecting sound.

**Tech Stack:** React, Chrome Storage API, Web Audio API, Webpack CopyPlugin

---

## Task 1: Organize Sound Files

**Files:**
- Move: `public/sounds/dragon-studio-alert-444816.mp3`
- Move: `public/sounds/fnx_sound-extraterrestrial-alert-sound-287337.mp3`
- Move: `public/sounds/u_00gvvdfqjf-alert-369027.mp3`

**Step 1: Create sounds directory**

```bash
mkdir -p public/sounds
```

**Step 2: Move sound files to public/sounds/**

```bash
mv /Users/paris/Documents/ParisCodes/BibleFocusApp/biblefocustimer/dragon-studio-alert-444816.mp3 public/sounds/
mv /Users/paris/Documents/ParisCodes/BibleFocusApp/biblefocustimer/fnx_sound-extraterrestrial-alert-sound-287337.mp3 public/sounds/
mv /Users/paris/Documents/ParisCodes/BibleFocusApp/biblefocustimer/u_00gvvdfqjf-alert-369027.mp3 public/sounds/
```

**Step 3: Verify files are in place**

```bash
ls -la public/sounds/
```

Expected output: 3 .mp3 files listed

---

## Task 2: Update Webpack Config to Copy Sounds

**Files:**
- Modify: `webpack.config.js`

**Step 1: Read webpack config**

Review the current copy plugins in webpack.config.js to understand the pattern.

**Step 2: Add CopyPlugin for sounds**

In `webpack.config.js`, find the plugins array with existing CopyPlugin entries. Add this pattern to copy sounds:

```javascript
new CopyPlugin({
  patterns: [
    // ... existing patterns ...
    {
      from: path.resolve(__dirname, 'public/sounds'),
      to: path.resolve(__dirname, 'dist/sounds'),
    },
  ],
}),
```

**Step 3: Run build to verify sounds are copied**

```bash
npm run build
ls -la dist/sounds/
```

Expected output: All 3 .mp3 files in `dist/sounds/`

**Step 4: Commit**

```bash
git add webpack.config.js
git commit -m "build: copy sound files to dist during build"
```

---

## Task 3: Add Sound Settings to Storage Defaults

**Files:**
- Modify: `src/popup/useStorage.js`

**Step 1: Read useStorage.js to find DEFAULT_SETTINGS**

Locate the DEFAULT_SETTINGS object.

**Step 2: Add sound settings to defaults**

Add these lines to DEFAULT_SETTINGS:

```javascript
soundEnabled: true,
selectedSound: 'dragon-studio-alert-444816.mp3',
```

Place them after existing settings like `theme` and `translation`.

**Step 3: Verify changes**

The defaults should now include both new settings.

**Step 4: Commit**

```bash
git add src/popup/useStorage.js
git commit -m "feat: add sound settings defaults"
```

---

## Task 4: Create Sound Utility Helper

**Files:**
- Create: `src/popup/utils/sound.js`

**Step 1: Create sound utility file**

```javascript
/**
 * Play a sound file from the sounds directory
 * @param {string} filename - Sound filename (e.g., 'dragon-studio-alert-444816.mp3')
 */
export function playSound(filename) {
  try {
    // Get the audio file path from the extension's dist folder
    const soundPath = chrome.runtime.getURL(`sounds/${filename}`);
    const audio = new Audio(soundPath);
    audio.play().catch((err) => {
      console.warn(`Failed to play sound: ${err.message}`);
    });
  } catch (error) {
    console.warn(`Sound playback error: ${error.message}`);
  }
}

/**
 * Get list of available sounds
 * @returns {Array<{name: string, label: string}>} Array of sound options
 */
export function getAvailableSounds() {
  return [
    {
      name: 'dragon-studio-alert-444816.mp3',
      label: 'Dragon Studio Alert',
    },
    {
      name: 'fnx_sound-extraterrestrial-alert-sound-287337.mp3',
      label: 'Extraterrestrial Alert',
    },
    {
      name: 'u_00gvvdfqjf-alert-369027.mp3',
      label: 'Alert Sound',
    },
  ];
}
```

**Step 2: Commit**

```bash
git add src/popup/utils/sound.js
git commit -m "feat: add sound utility functions"
```

---

## Task 5: Integrate Sound Playback in Timer Hook

**Files:**
- Modify: `src/popup/useTimer.js`

**Step 1: Import sound utility at top of file**

```javascript
import { playSound } from '../utils/sound';
```

Add after other imports.

**Step 2: Modify onTimerComplete to play sound**

Find the `onTimerComplete` function. Add this code at the start of the callback (before phase checks):

```javascript
const onTimerComplete = useCallback(() => {
  // Play sound if enabled
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['soundEnabled', 'selectedSound'], (result) => {
      if (chrome.runtime.lastError) return;

      if (result.soundEnabled && result.selectedSound) {
        playSound(result.selectedSound);
      }
    });
  }

  // ... rest of existing code ...
```

**Step 3: Commit**

```bash
git add src/popup/useTimer.js
git commit -m "feat: play sound when timer completes"
```

---

## Task 6: Add Sound Controls to Settings View

**Files:**
- Modify: `src/popup/components/SettingsView.jsx`

**Step 1: Read SettingsView.jsx to understand structure**

Review how other settings like translation are displayed.

**Step 2: Import sound utilities**

Add to imports at top:

```javascript
import { getAvailableSounds } from '../utils/sound';
```

**Step 3: Add sound state to component**

After other state declarations in SettingsView, add:

```javascript
const soundOptions = getAvailableSounds();
```

**Step 4: Add sound toggle and dropdown to UI**

Add this section after the translation selector (before the closing div):

```jsx
{/* Sound Settings */}
<div className="setting-group">
  <label htmlFor="sound-enabled" className="setting-label">
    <input
      id="sound-enabled"
      type="checkbox"
      checked={settings.soundEnabled}
      onChange={(e) => {
        const newSettings = { ...settings, soundEnabled: e.target.checked };
        onSettingsChange(newSettings);
      }}
      aria-label="Enable sound notification"
    />
    Enable Sound Notification
  </label>

  {settings.soundEnabled && (
    <div className="setting-item">
      <label htmlFor="sound-select" className="setting-label">
        Sound:
      </label>
      <select
        id="sound-select"
        value={settings.selectedSound}
        onChange={(e) => {
          const newSettings = { ...settings, selectedSound: e.target.value };
          onSettingsChange(newSettings);
        }}
        aria-label="Select sound notification"
      >
        {soundOptions.map((sound) => (
          <option key={sound.name} value={sound.name}>
            {sound.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          const audio = new Audio(chrome.runtime.getURL(`sounds/${settings.selectedSound}`));
          audio.play().catch((err) => console.warn('Preview failed:', err));
        }}
        aria-label="Play preview of selected sound"
        title="Preview selected sound"
      >
        Preview
      </button>
    </div>
  )}
</div>
```

**Step 5: Commit**

```bash
git add src/popup/components/SettingsView.jsx
git commit -m "feat: add sound selection UI in settings"
```

---

## Task 7: Test Sound Feature

**Files:**
- Test manually in extension

**Step 1: Build the extension**

```bash
npm run build
```

**Step 2: Load updated extension in Chrome**

- Open `chrome://extensions/`
- Click reload on the Bible Focus extension
- Open the extension popup

**Step 3: Test sound toggle and dropdown**

- Open Settings View
- Toggle "Enable Sound Notification" on/off
- Verify dropdown appears when enabled
- Change sound selection
- Click Preview button to test each sound

**Step 4: Test sound on timer completion**

- Start a focus session (with sound enabled)
- Wait for timer to complete (or skip to test)
- Verify sound plays at completion
- Disable sound and test again
- Verify no sound plays when disabled

**Step 5: Test across phases**

- Test sound plays for both focus and break phase completion
- Verify selected sound is used each time

---

## Task 8: Final Build and Commit

**Files:**
- Verify all changes

**Step 1: Run full build**

```bash
npm run build
```

Expected: No errors, sound files in dist/sounds/

**Step 2: Verify no lint errors**

If linting is configured, run:

```bash
npm run lint
```

**Step 3: Final commit if needed**

If any final fixes were made:

```bash
git status
git add [files]
git commit -m "chore: finalize sound feature"
```

---

## Summary

This plan implements sound notifications by:
1. Organizing sound files in `public/sounds/`
2. Configuring webpack to bundle them in `dist/`
3. Adding settings to store user preferences
4. Creating a sound utility for playback
5. Integrating playback in timer completion
6. Adding UI controls in Settings View
7. Testing functionality across all phases

All changes follow TDD/YAGNI principles with frequent commits.


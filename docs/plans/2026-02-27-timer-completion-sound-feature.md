# Timer Completion Sound Feature Design

**Date:** 2026-02-27
**Status:** Approved

## Overview

Add user-selectable sound notifications that play when timer phases complete (focus and break). Users can choose from 3 sound options or disable sound entirely via the Settings View.

## Sound Files

Three `.mp3` alert sounds available in the main directory:
- `dragon-studio-alert-444816.mp3`
- `fnx_sound-extraterrestrial-alert-sound-287337.mp3`
- `u_00gvvdfqjf-alert-369027.mp3`

## Architecture

### Storage & Settings

Add to Chrome storage (with defaults):
```javascript
{
  soundEnabled: true,           // boolean
  selectedSound: 'dragon-studio-alert-444816.mp3'  // filename
}
```

### File Organization

```
public/
├── sounds/
│   ├── dragon-studio-alert-444816.mp3
│   ├── fnx_sound-extraterrestrial-alert-sound-287337.mp3
│   └── u_00gvvdfqjf-alert-369027.mp3
└── ... (existing files)
```

Webpack copies `public/sounds/` → `dist/sounds/` during build.

### UI Components

**SettingsView** additions:
- Toggle: "Enable sound notification"
- Dropdown: Select sound (only visible when enabled)
- Preview button: Play sample of selected sound

### Audio Playback

When timer reaches zero in `useTimer.js`:
1. Check `soundEnabled` setting
2. If enabled, load `selectedSound` from `dist/sounds/`
3. Play via Web Audio API (`new Audio()` in popup context)

## Files to Modify

1. **`src/popup/useStorage.js`** — Add `soundEnabled` and `selectedSound` defaults
2. **`src/popup/components/SettingsView.jsx`** — Add sound toggle, dropdown, preview button
3. **`src/popup/useTimer.js`** — Call sound playback in `onTimerComplete()`
4. **`webpack.config.js`** — Copy `public/sounds/` to `dist/`
5. **`public/sounds/`** — New directory with 3 .mp3 files

## Implementation Notes

- Sound plays when `secondsLeft === 0` in the timer completion handler
- Applies to both focus and break phase completions
- Graceful fallback if file fails to load (no error thrown)
- Web Audio API is available in popup context

## Success Criteria

- Sound files appear in settings dropdown
- Selected sound plays at timer completion
- Toggle enables/disables sound
- Sound works when popup is open
- Build includes sound files in dist/


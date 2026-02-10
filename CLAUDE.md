# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Selah Focus** is a Chrome extension (Manifest V3) that combines a Pomodoro timer with Scripture integration. Users work through configurable focus/break cycles while viewing curated Bible verses and reflection prompts.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development: webpack in watch mode (auto-rebuilds on changes)
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean
```

**Loading in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder

## Architecture

### Three Core Pieces

1. **Popup UI** (`src/popup/`) — React-based extension popup that users interact with
   - Manages timer display and user interactions
   - Four main views: idle, preFocus, focus, break (routed by `App.jsx`)
   - Three custom hooks handle state: `useTimer`, `useVerse`, `useSettings`

2. **Background Service Worker** (`src/background/service-worker.js`) — Runs persistent in background
   - Listens for `TIMER_COMPLETE` messages from popup
   - Shows Chrome notifications and updates extension badge
   - Clears badge when popup opens (via `chrome.runtime.onConnect`)

3. **Data** (`src/data/`) — Static content
   - `verses.js` — 55 curated Bible verses tagged by theme and translation
   - `reflections.js` — Pre/during-break reflection prompts

### State Flow & Timer Lifecycle

The `useTimer` hook manages four distinct phases:

- **idle** — Initial state, waiting to start
- **preFocus** — Shows verse for 10 seconds before focus begins (if scripture enabled)
- **focus** — Active focus session countdown
- **break** — Short or long break (5 or 15 min by default)

Phases transition via:
1. User clicks "Start Focus" → calls `startFocusSession()` → enters preFocus or focus
2. Focus timer reaches 0 → auto-advances to break, increments `cycleCount`
3. Every Nth cycle (default 4) → triggers long break instead of short break
4. Break timer reaches 0 → returns to idle or auto-starts focus (if `autoStartNext` enabled)

### Component Tree

```
App (state router)
├── IdleView (show stats, start button)
├── PreFocusView (show verse + reflection, then begin)
├── FocusView (countdown timer, pause/resume/reset)
├── BreakView (countdown, verse display, skip/pause controls)
└── SettingsView (duration sliders, toggles, translation picker)
```

### Custom Hooks

- **`useTimer(settings)`** — Manages phase, countdown, pause/resume, cycle tracking. Sends `TIMER_COMPLETE` messages to background worker.
- **`useVerse(settings)`** — Selects verses by theme/translation; tracks current verse and reflection. Verses are pre-selected when entering preFocus or break phases.
- **`useSettings()`** — Syncs settings to Chrome storage (with localStorage fallback). Defaults merge with stored values to handle schema changes gracefully.

### Communication: Popup ↔ Background

The popup sends messages to the background service worker:
```javascript
chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase })
```

The background worker responds with notifications and badge updates. The popup also calls `chrome.runtime.connect()` when initialized, triggering the background to clear the badge.

## Key Design Decisions

- **Phase-based UI routing** — Each phase (idle/preFocus/focus/break) gets its own dedicated component for clarity.
- **Chrome Storage with localStorage fallback** — Allows testing in non-extension contexts while supporting persistent extension state.
- **Static verse/reflection data** — No external API calls; 55 curated verses keep the extension lightweight.
- **10-second preFocus delay** — Gives users time to read Scripture before committing to focus.
- **Cycle-based long breaks** — Every 4 cycles (by default) triggers a 15-minute break instead of 5 minutes.

## Settings Structure (Chrome Storage)

Stored under `settings` key:
```javascript
{
  focusDuration: 25,           // minutes
  shortBreakDuration: 5,       // minutes
  longBreakDuration: 15,       // minutes
  cyclesBeforeLongBreak: 4,    // every Nth cycle
  autoStartNext: false,        // auto-advance to next phase
  scriptureEnabled: true,      // show verses
  translation: 'esv',          // 'esv', 'niv', 'kjv'
  theme: 'random',             // 'random' or specific theme
}
```

## Webpack Configuration

- **Dual entry points** — `popup.js` (React UI) and `background.js` (service worker)
- **Babel transforms** — ES6+ and JSX support
- **CSS extraction** — MiniCssExtractPlugin writes separate `.css` files
- **Copy public/** — Copies `manifest.json` and icons to `dist/`

## Recommended Subagents & Skills

### When to Use Subagents

Available subagent types from `.claude/plugins/`:

- **code-review** — For automated code quality checks across multiple files (use after significant changes)
- **security-reviewer** — For reviewing extension permissions, Chrome API usage, and data handling
- **ui-reviewer** — For reviewing React components, accessibility, and responsive design
- **test-writer** — If adding test coverage for timer logic or component behavior

### When to Use Skills

Pre-built skills from official plugins that may be useful:

- **/commit** — For creating git commits with proper messages
- **/frontend-design** — For polishing UI components and styling
- **/feature-dev** — For end-to-end feature development workflow

Create custom project skills in `.claude/skills/` if needed. See `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/claude-code-setup/` for skill structure examples.

## Common Modifications

**Add a new verse theme:**
1. Edit `src/data/verses.js` — add theme tag to verses
2. Update `useVerse.js` if needed to handle new selection logic
3. Add theme label to settings UI (`SettingsView.jsx`)

**Change timer defaults:**
- Edit `DEFAULT_SETTINGS` in `src/popup/useStorage.js`
- Stored settings will merge with defaults, so users' custom values persist

**Update notification messages:**
- Edit `showNotification()` calls in `src/background/service-worker.js`

**Modify phase logic:**
- Check `useTimer.js` for phase transitions and side effects
- Phases are strictly controlled; always reset state when entering new phase

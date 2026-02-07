# Selah Focus

A Pomodoro timer Chrome extension with Scripture-based focus rhythms. Work deeply, anchored in the Word.

## Features

- **Pomodoro Timer** — Configurable focus (25 min), short break (5 min), and long break (15 min) cycles
- **Scripture Integration** — Bible verses shown before focus sessions and during breaks (ESV, NIV, KJV)
- **Reflection Prompts** — Lightweight, optional prompts to carry Scripture into your work
- **Calm UI** — Minimalist, distraction-free interface with a warm color palette
- **Customizable** — Adjust timer durations, translations, verse themes, and auto-start behavior
- **Chrome Notifications** — Get notified when focus sessions or breaks end

## Getting Started

### Install dependencies

```
npm install
```

### Build the extension

```
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### Development

```
npm run dev
```

This runs webpack in watch mode for live rebuilds during development.

## Project Structure

```
src/
  background/        — Service worker for notifications and badge
  data/
    verses.js        — 55 curated Bible verses tagged by theme
    reflections.js   — Reflection prompts for pre-focus and breaks
  popup/
    components/      — React UI components
      IdleView.jsx
      PreFocusView.jsx
      FocusView.jsx
      BreakView.jsx
      SettingsView.jsx
      TimerDisplay.jsx
      VerseCard.jsx
    App.jsx          — Main app with state routing
    useTimer.js      — Pomodoro timer logic
    useVerse.js      — Verse selection by theme/translation
    useStorage.js    — Chrome storage integration
    styles.css       — Minimalist stylesheet
    popup.html       — Extension popup entry
    index.jsx        — React entry point
public/
  manifest.json      — Chrome Manifest V3
  icons/             — Extension icons
```

## Verse Themes

- **Wisdom** — Proverbs, Psalms, and more on godly wisdom
- **Peace** — Scriptures on rest, trust, and the peace of God
- **Discipline** — Verses on perseverance, self-control, and endurance
- **Work & Diligence** — Scripture on working heartily for the Lord

## Tech Stack

- Chrome Extension (Manifest V3)
- React 18
- Webpack 5
- Chrome Storage API

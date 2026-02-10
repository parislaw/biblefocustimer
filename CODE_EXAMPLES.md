# Selah Focus - Detailed Code Fix Examples

This file contains ready-to-use code snippets for the most critical fixes.

---

## Fix 1: Add ErrorBoundary.jsx (Critical - Prevents Crashes)

**Create new file:** `src/popup/ErrorBoundary.jsx`

```javascript
import React from 'react';

/**
 * Catches errors from child components and displays error UI
 * Prevents entire extension from crashing on component errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app error-boundary">
          <div className="error-content">
            <h2 className="error-title">Oops! Something went wrong</h2>

            <details className="error-details" style={{ cursor: 'pointer', marginTop: '16px' }}>
              <summary style={{ marginBottom: '8px' }}>Error details</summary>
              <pre
                style={{
                  background: '#f5f4f0',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '150px',
                  color: '#c1121f',
                }}
              >
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>

            <div className="error-actions" style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                onClick={this.handleReload}
                style={{ flex: 1 }}
              >
                Reload Extension
              </button>
              <button
                className="btn-secondary"
                onClick={this.handleReset}
                style={{ flex: 1 }}
              >
                Try Again
              </button>
            </div>

            <p
              className="error-note"
              style={{
                fontSize: '12px',
                color: '#9a9a9a',
                marginTop: '12px',
                textAlign: 'center',
              }}
            >
              If the problem persists, try reloading the extension or clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Update `src/popup/index.jsx`:**

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

**Add CSS to `src/popup/styles.css`:**

```css
/* Error Boundary Styles */
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.error-content {
  width: 100%;
}

.error-title {
  font-family: var(--font-serif);
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.error-details {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.error-actions {
  gap: 8px;
}

.error-note {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}
```

---

## Fix 2: Fix useTimer Stale Closures (Critical)

**Update `src/popup/useTimer.js` - Lines 47-88:**

```javascript
// Lines 47-52: OLD VERSION (HAS BUGS)
// useEffect(() => {
//   if (secondsLeft === 0 && isRunning) {
//     setIsRunning(false);
//     onTimerComplete();  // ❌ Stale closure!
//   }
// }, [secondsLeft, isRunning]);

// Lines 54-88: OLD onTimerComplete (HAS BUGS)
// const onTimerComplete = () => {  // ❌ No useCallback!
//   if (typeof chrome !== 'undefined' && chrome.runtime) {
//     chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase });
//   }
//   if (phase === 'focus') {
//     // Uses phase and cycleCount but NOT in dependency array!

// NEW FIXED VERSION:

// Move onTimerComplete BEFORE the effect
const onTimerComplete = useCallback(() => {
  // Notify background service worker
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage(
      { type: 'TIMER_COMPLETE', phase },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to notify background:', chrome.runtime.lastError);
        }
      }
    );
  }

  if (phase === 'focus') {
    const newCycleCount = cycleCount + 1;

    const shouldLongBreak =
      settings.cyclesBeforeLongBreak > 0 &&
      newCycleCount % settings.cyclesBeforeLongBreak === 0;

    setIsLongBreak(shouldLongBreak);

    const breakDuration = shouldLongBreak
      ? settings.longBreakDuration
      : settings.shortBreakDuration;

    setPhase('break');
    setSecondsLeft(breakDuration * 60);

    if (settings.autoStartNext) {
      setIsRunning(true);
    }
  } else if (phase === 'break') {
    setPhase('idle');
    setSecondsLeft(settings.focusDuration * 60);

    if (settings.autoStartNext) {
      startFocusSession();
    }
  }
}, [phase, cycleCount, settings, startFocusSession]); // ✅ ALL dependencies included!

// Handle timer reaching zero
useEffect(() => {
  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);
    onTimerComplete();
  }
}, [secondsLeft, isRunning, onTimerComplete]); // ✅ Added onTimerComplete!
```

**Also fix the resume callback:**

```javascript
// OLD:
// const resume = useCallback(() => {
//   if (secondsLeft > 0 && (phase === 'focus' || phase === 'break')) {
//     setIsRunning(true);
//   }
// }, [secondsLeft, phase]); // ❌ Creates new ref every second!

// NEW:
const resume = useCallback(() => {
  // Don't check state in callback - validate in effect instead
  setIsRunning(true);
}, []); // ✅ Stable reference!

// Add a guard effect that prevents resume if timer is at zero
useEffect(() => {
  if (secondsLeft === 0) {
    setIsRunning(false);
  }
}, [secondsLeft]);
```

---

## Fix 3: Add Accessibility - ARIA Labels and Focus Styles

**Update `src/popup/components/IdleView.jsx` - Line 14:**

```javascript
// OLD:
// <button className="btn-icon" onClick={onOpenSettings} title="Settings">
//   <svg>...</svg>
// </button>

// NEW:
<button
  className="btn-icon"
  onClick={onOpenSettings}
  aria-label="Open settings"
  title="Settings"
>
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
</button>
```

**Update `src/popup/components/SettingsView.jsx` - Line 26:**

```javascript
// OLD:
// <button className="btn-icon" onClick={onClose} title="Close">
//   <svg>...</svg>
// </button>

// NEW:
<button
  className="btn-icon"
  onClick={onClose}
  aria-label="Close settings"
  title="Close"
>
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
</button>
```

**Update `src/popup/components/TimerDisplay.jsx` - Complete replacement:**

```javascript
import React from 'react';

export default function TimerDisplay({ secondsLeft, label }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Create accessible label for screen readers
  const minutesText = minutes === 1 ? 'minute' : 'minutes';
  const secondsText = seconds === 1 ? 'second' : 'seconds';
  const ariaLabel = `${minutes} ${minutesText} ${seconds} ${secondsText} remaining`;

  return (
    <div className="timer-display">
      {label && <div className="timer-label">{label}</div>}
      <div
        className="timer-time"
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        {display}
      </div>
    </div>
  );
}
```

**Update `src/popup/styles.css` - Add focus styles after line 446:**

```css
/* Keyboard Navigation Focus Styles */
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-icon:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}

input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Remove default outline in browsers that provide focus-visible */
button:focus:not(:focus-visible),
input:focus:not(:focus-visible),
select:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Fix 4: Connect Form Labels to Inputs

**Update `src/popup/components/SettingsView.jsx` - All settings:**

```javascript
// EXAMPLE - Apply to ALL input settings:

// OLD:
// <label className="setting-row">
//   <span>Focus duration</span>
//   <div className="setting-input-group">
//     <input
//       type="number"
//       min="1"
//       max="120"
//       value={settings.focusDuration}
//       onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
//     />
//     <span className="setting-unit">min</span>
//   </div>
// </label>

// NEW:
<label className="setting-row" htmlFor="focus-duration">
  <span>Focus duration</span>
  <div className="setting-input-group">
    <input
      id="focus-duration"
      type="number"
      min="1"
      max="120"
      value={settings.focusDuration}
      onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
      aria-describedby="focus-duration-hint"
    />
    <span className="setting-unit" id="focus-duration-hint">min</span>
  </div>
</label>

// Apply same pattern to:
// - short-break, long-break, cycles-before-long-break
```

**Updated all input fields in SettingsView.jsx:**

```javascript
export default function SettingsView({ settings, updateSettings, onClose }) {
  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="view settings-view">
      <header className="settings-header">
        <h2 className="view-heading">Settings</h2>
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close settings"
          title="Close"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="settings-section">
        <h3 className="settings-section-title">Timer</h3>

        <label className="setting-row" htmlFor="focus-duration">
          <span>Focus duration</span>
          <div className="setting-input-group">
            <input
              id="focus-duration"
              type="number"
              min="1"
              max="120"
              value={settings.focusDuration}
              onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
              aria-describedby="focus-duration-unit"
            />
            <span className="setting-unit" id="focus-duration-unit">min</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="short-break-duration">
          <span>Short break</span>
          <div className="setting-input-group">
            <input
              id="short-break-duration"
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value) || 5)}
              aria-describedby="short-break-unit"
            />
            <span className="setting-unit" id="short-break-unit">min</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="long-break-duration">
          <span>Long break</span>
          <div className="setting-input-group">
            <input
              id="long-break-duration"
              type="number"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 15)}
              aria-describedby="long-break-unit"
            />
            <span className="setting-unit" id="long-break-unit">min</span>
          </div>
        </label>

        <label className="setting-row" htmlFor="cycles-before-long-break">
          <span>Cycles before long break</span>
          <div className="setting-input-group">
            <input
              id="cycles-before-long-break"
              type="number"
              min="0"
              max="10"
              value={settings.cyclesBeforeLongBreak}
              onChange={(e) => handleChange('cyclesBeforeLongBreak', parseInt(e.target.value) || 4)}
            />
          </div>
        </label>

        <label className="setting-row" htmlFor="auto-start-next">
          <span>Auto-start next session</span>
          <input
            id="auto-start-next"
            type="checkbox"
            checked={settings.autoStartNext}
            onChange={(e) => handleChange('autoStartNext', e.target.checked)}
          />
        </label>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Scripture</h3>

        <label className="setting-row" htmlFor="scripture-enabled">
          <span>Show Scripture</span>
          <input
            id="scripture-enabled"
            type="checkbox"
            checked={settings.scriptureEnabled}
            onChange={(e) => handleChange('scriptureEnabled', e.target.checked)}
          />
        </label>

        <label className="setting-row" htmlFor="translation">
          <span>Scripture Translation</span>
          <select
            id="translation"
            value={settings.translation}
            onChange={(e) => handleChange('translation', e.target.value)}
          >
            {TRANSLATIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="setting-row" htmlFor="theme">
          <span>Verse Theme</span>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-footer">
        <p className="settings-note">
          Scripture translations sourced for personal devotional use.
        </p>
      </div>
    </div>
  );
}
```

---

## Fix 5: Add Error State to useSettings Hook

**Update `src/popup/useStorage.js`:**

```javascript
import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  scriptureEnabled: true,
  translation: 'esv',
  theme: 'random',
};

/**
 * Custom hook for Chrome storage sync with fallback to localStorage.
 * Returns error state for graceful error handling.
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('settings', (result) => {
        if (!isMounted) return; // Prevent state update on unmounted component

        try {
          if (result.settings) {
            setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...result.settings }));
          }
          setLoaded(true);
          setError(null);
        } catch (e) {
          console.error('Failed to load Chrome storage:', e);
          setError(`Failed to load settings: ${e.message}`);
          setLoaded(true);
        }
      });
    } else {
      try {
        const stored = localStorage.getItem('selah-settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...parsed }));
        }
        setLoaded(true);
        setError(null);
      } catch (e) {
        console.error('Failed to load localStorage:', e);
        setError(`Failed to load settings: ${e.message}`);
        setLoaded(true);
      }
    }

    // Cleanup: mark component as unmounted
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = (newSettings) => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      setError(null);

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ settings: merged }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to save to Chrome storage:', chrome.runtime.lastError);
            setError(`Failed to save settings: ${chrome.runtime.lastError.message}`);
          }
        });
      } else {
        try {
          localStorage.setItem('selah-settings', JSON.stringify(merged));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
          setError(`Failed to save settings: ${e.message}`);
        }
      }
    } catch (e) {
      console.error('Error updating settings:', e);
      setError(`Error updating settings: ${e.message}`);
    }
  };

  return { settings, updateSettings, loaded, error };
}

export { DEFAULT_SETTINGS };
```

**Update `src/popup/App.jsx` to handle errors:**

```javascript
import React, { useState } from 'react';
import { useSettings } from './useStorage';
import { useTimer } from './useTimer';
import { useVerse } from './useVerse';
import IdleView from './components/IdleView';
import PreFocusView from './components/PreFocusView';
import FocusView from './components/FocusView';
import BreakView from './components/BreakView';
import SettingsView from './components/SettingsView';

export default function App() {
  const { settings, updateSettings, loaded, error } = useSettings(); // ← Add error
  const [showSettings, setShowSettings] = useState(false);
  const timer = useTimer(settings);
  const verse = useVerse(settings);

  // Show error state if settings failed to load
  if (error && !loaded) {
    return (
      <div className="app error-state">
        <div className="error-content">
          <h2>⚠️ Settings Error</h2>
          <p>{error}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Extension
          </button>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="app loading">
        <div className="loading-text">Selah...</div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="app">
        <SettingsView
          settings={settings}
          updateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  const handleStartFocus = () => {
    verse.selectVerse();
    verse.selectReflection('preFocus');
    timer.startFocusSession();
  };

  const handleBeginFocus = () => {
    timer.beginFocusFromPreFocus();
  };

  const handleBreakVerse = () => {
    if (settings.scriptureEnabled) {
      verse.selectVerse();
      verse.selectReflection('break');
    }
  };

  return (
    <div className={`app phase-${timer.phase}`}>
      {timer.phase === 'idle' && (
        <IdleView
          settings={settings}
          verse={verse}
          cycleCount={timer.cycleCount}
          onStartFocus={handleStartFocus}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {timer.phase === 'preFocus' && (
        <PreFocusView
          verse={verse.currentVerse}
          reflection={verse.currentReflection}
          settings={settings}
          onBeginFocus={handleBeginFocus}
        />
      )}

      {timer.phase === 'focus' && (
        <FocusView
          secondsLeft={timer.secondsLeft}
          isRunning={timer.isRunning}
          cycleCount={timer.cycleCount}
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={timer.reset}
          onBreakStart={handleBreakVerse}
        />
      )}

      {timer.phase === 'break' && (
        <BreakView
          secondsLeft={timer.secondsLeft}
          isRunning={timer.isRunning}
          isLongBreak={timer.isLongBreak}
          cycleCount={timer.cycleCount}
          verse={verse.currentVerse}
          reflection={verse.currentReflection}
          settings={settings}
          onPause={timer.pause}
          onResume={timer.resume}
          onSkipBreak={timer.skipBreak}
          selectVerse={verse.selectVerse}
          selectReflection={verse.selectReflection}
        />
      )}
    </div>
  );
}
```

---

## Fix 6: Responsive Design

**Update `src/popup/styles.css` - Replace lines 36-52:**

```css
/* Changed from fixed 360px to responsive */
html, body {
  min-width: 320px;  /* Minimum for mobile */
  width: 100%;
  min-height: 480px;
  height: 100vh;
  font-family: var(--font);
  font-size: clamp(13px, 2vw, 16px);  /* Responsive font size */
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  transition: background 0.3s ease;
  max-width: 1200px;  /* Optional: prevent too-wide popups */
  margin: 0 auto;     /* Center if max-width applied */
}
```

**Update responsive font sizes in CSS:**

```css
/* Timer display - scales responsively */
.timer-time {
  font-size: clamp(36px, 12vw, 56px);
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
  color: var(--text-primary);
  line-height: 1;
}

/* Verse text - scales responsively */
.verse-text {
  font-family: var(--font-serif);
  font-size: clamp(14px, 3vw, 16px);
  line-height: 1.65;
  color: var(--text-primary);
  margin-bottom: 10px;
}

/* App title - scales responsively */
.app-title {
  font-family: var(--font-serif);
  font-size: clamp(18px, 5vw, 24px);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

/* View padding - scales with viewport */
.view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px);
}
```

**Add media queries for small devices:**

```css
/* Mobile devices (< 480px) */
@media (max-width: 480px) {
  .view {
    padding: 16px;
  }

  .timer-display {
    padding: 16px 0;
  }

  .btn-primary {
    padding: 12px 16px;
    font-size: 14px;
  }
}

/* Landscape mode */
@media (max-height: 500px) {
  .view {
    padding: 12px 16px;
  }

  .timer-display {
    padding: 12px 0;
  }

  .verse-card {
    padding: 12px;
  }
}
```

---

## Fix 7: Add Confirmation for Destructive Actions

**Update `src/popup/components/FocusView.jsx`:**

```javascript
import React, { useState } from 'react';
import TimerDisplay from './TimerDisplay';

export default function FocusView({
  secondsLeft,
  isRunning,
  cycleCount,
  onPause,
  onResume,
  onReset,
  onBreakStart,
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(false);
    onReset();
  };

  if (showResetConfirm) {
    return (
      <div className="view focus-view">
        <div className="focus-minimal">
          <div className="confirmation-prompt">
            <p className="confirmation-text">Are you sure? This will reset your focus session.</p>
            <div className="confirmation-actions">
              <button className="btn-primary" onClick={handleReset}>
                Reset
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view focus-view">
      <div className="focus-minimal">
        <TimerDisplay secondsLeft={secondsLeft} label="Focus" />

        <div className="timer-controls">
          {isRunning ? (
            <button className="btn-secondary" onClick={onPause}>
              Pause
            </button>
          ) : (
            <button className="btn-primary" onClick={onResume}>
              Resume
            </button>
          )}
          <button
            className="btn-text"
            onClick={() => setShowResetConfirm(true)}
            aria-label="Reset focus session (requires confirmation)"
          >
            Reset
          </button>
        </div>

        <div className="cycle-dots">
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className={`dot ${i < (cycleCount % 4) ? 'dot-filled' : ''} ${
                i === (cycleCount % 4) ? 'dot-active' : ''
              }`}
              aria-label={`Cycle ${i + 1}: ${i < (cycleCount % 4) ? 'complete' : 'pending'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Add CSS for confirmation prompt:**

```css
.confirmation-prompt {
  text-align: center;
  padding: 20px;
}

.confirmation-text {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 20px;
  line-height: 1.5;
}

.confirmation-actions {
  display: flex;
  gap: 8px;
}

.confirmation-actions button {
  flex: 1;
}
```

**Update `src/popup/components/BreakView.jsx` similarly:**

```javascript
const [showSkipConfirm, setShowSkipConfirm] = useState(false);

const handleSkipBreak = () => {
  setShowSkipConfirm(false);
  onSkipBreak();
};

if (showSkipConfirm) {
  return (
    <div className="view break-view">
      <div className="confirmation-prompt">
        <p className="confirmation-text">Are you sure? You're taking a break to recharge.</p>
        <div className="confirmation-actions">
          <button className="btn-primary" onClick={handleSkipBreak}>
            Skip Break
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowSkipConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// In JSX:
<button
  className="btn-text"
  onClick={() => setShowSkipConfirm(true)}
  aria-label="Skip break (requires confirmation)"
>
  Skip Break
</button>
```

---

## Testing the Fixes

After implementing, test each fix:

```javascript
// Test ErrorBoundary (throw error intentionally)
throw new Error('Test error boundary');

// Test useTimer deps (check console for warnings)
// npm run dev → Open popup → Check DevTools console

// Test accessibility (keyboard navigation)
// Open popup → Press Tab repeatedly → See focus ring

// Test responsive (DevTools)
// F12 → Ctrl+Shift+M → Drag to resize

// Test error handling
// Delete all Chrome storage → Reload popup
```

---

## Summary

These are the 7 most critical fixes for Selah Focus:

1. **ErrorBoundary** - Prevents crashes
2. **useTimer stale closure** - Fixes timer reliability
3. **ARIA labels** - Accessibility
4. **Focus styles** - Keyboard navigation
5. **Form label connection** - Proper form association
6. **Error states** - Better feedback
7. **Responsive design** - Works at all sizes

**Total estimated time: 2-3 hours for all fixes.**

After these, the extension will be significantly more robust, accessible, and user-friendly.

# Selah Focus - React Components UI/UX Review

**Date:** February 2025
**Version:** 1.0.0
**Scope:** React component structure, hooks implementation, accessibility, state management, performance, and UX patterns

---

## Executive Summary

The Selah Focus extension demonstrates solid React fundamentals with good separation of concerns, clean component composition, and thoughtful state management. However, there are opportunities for improvement in accessibility, error handling, responsive design considerations, and a few subtle hook-related issues that could impact reliability.

**Overall Assessment:** 7/10 - Good foundation with practical improvements needed for production quality.

---

## 1. Component Structure & Props

### Current State

**Strengths:**
- Excellent phase-based routing pattern in `App.jsx` - each UI state (idle, preFocus, focus, break) gets a dedicated component
- Clean prop drilling - components receive only the data they need
- Single responsibility principle: each component has a focused purpose (TimerDisplay, VerseCard, etc.)
- Proper prop destructuring in function signatures makes dependencies clear
- Good use of custom hooks to abstract complex logic away from UI components

**Issues Found:**

#### Issue 1.1: Missing PropTypes or TypeScript
```javascript
// CurrentState: No prop validation
export default function IdleView({ settings, verse, cycleCount, onStartFocus, onOpenSettings }) {
  // No way to verify props at development time
}
```

**Impact:** Medium - Could catch bugs earlier during development
**Fix:** Add prop validation

**Recommendation:**
```javascript
// Option A: PropTypes (lighter, runtime validation)
import PropTypes from 'prop-types';

IdleView.propTypes = {
  settings: PropTypes.shape({
    scriptureEnabled: PropTypes.bool,
    focusDuration: PropTypes.number,
  }).isRequired,
  verse: PropTypes.shape({
    currentVerse: PropTypes.shape({
      text: PropTypes.string,
      reference: PropTypes.string,
      translation: PropTypes.string,
    }),
  }).isRequired,
  cycleCount: PropTypes.number.isRequired,
  onStartFocus: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
};

// Option B: TypeScript (recommended for extension)
// Consider migrating to .tsx files with type definitions
```

#### Issue 1.2: Loose Props in BreakView
```javascript
// Line 5-17: BreakView accepts many props (callback hell territory)
export default function BreakView({
  secondsLeft,
  isRunning,
  isLongBreak,
  cycleCount,
  verse,
  reflection,
  settings,
  onPause,
  onResume,
  onSkipBreak,
  selectVerse,      // These two are method references
  selectReflection, // Could be bundled into a single "verse" object
}) {
```

**Impact:** Low - Works, but harder to maintain and prop drilling is getting deep
**Recommendation:** Bundle related callbacks into object:
```javascript
export default function BreakView({
  timer: { secondsLeft, isRunning, isLongBreak, cycleCount },
  verse: { current: verse, reflection, selectVerse, selectReflection },
  settings,
  onPause,
  onResume,
  onSkipBreak,
}) {
```

### Grade: 7/10
Good structure with missing type safety. PropTypes or TypeScript would improve developer experience and catch bugs early.

---

## 2. Accessibility (a11y)

### Current State

**Major Issues:**

#### Issue 2.1: Missing ARIA Labels on Icon Buttons
```javascript
// IdleView.jsx, line 14
<button className="btn-icon" onClick={onOpenSettings} title="Settings">
  <svg>...</svg>
</button>

// SettingsView.jsx, line 26
<button className="btn-icon" onClick={onClose} title="Close">
  <svg>...</svg>
</button>
```

**Impact:** High - Screen reader users won't know button purpose
**Why it matters:** Icon-only buttons are invisible to assistive technologies without ARIA labels
**Fix:**
```javascript
<button
  className="btn-icon"
  onClick={onOpenSettings}
  aria-label="Open settings"
  title="Settings"
>
  <svg aria-hidden="true">...</svg>
</button>
```

#### Issue 2.2: Timer Display Not Announced to Screen Readers
```javascript
// TimerDisplay.jsx - just renders plain text
<div className="timer-time">{display}</div>
```

**Impact:** High - Critical timer information not accessible
**Fix:**
```javascript
export default function TimerDisplay({ secondsLeft, label }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="timer-display">
      {label && <div className="timer-label">{label}</div>}
      <div
        className="timer-time"
        role="status"
        aria-live="polite"
        aria-label={`${minutes} minutes ${seconds} seconds remaining`}
      >
        {display}
      </div>
    </div>
  );
}
```

#### Issue 2.3: Missing Semantic HTML
```javascript
// Multiple places use <div> instead of <button> patterns
// FocusView.jsx lines 11-23: controls aren't semantic

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
</div>
```

**Current behavior is actually fine here** - proper `<button>` elements are used

#### Issue 2.4: Color-Only Information Conveyed
From CSS inspection: `.dot-filled { background: var(--accent); }` - cycle dots use color only.

**Impact:** Medium - Users with color blindness can't distinguish progress
**Fix:** Add pattern or text alternative:
```css
.dot-filled {
  background: var(--accent);
  opacity: 1;
}

.dot {
  opacity: 0.3;
}

.dot-active {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Or add labels in JSX:
```javascript
<div className="cycle-dots">
  {Array.from({ length: 4 }, (_, i) => (
    <span
      key={i}
      className={`dot ${i < (cycleCount % 4) ? 'dot-filled' : ''}`}
      aria-label={i < (cycleCount % 4) ? 'Complete' : 'Incomplete'}
    />
  ))}
</div>
```

#### Issue 2.5: Verse Card Text Not Readable by Structure
```javascript
// VerseCard.jsx - good semantic structure
<div className="verse-card">
  <p className="verse-text">{verse.text}</p>
  <p className="verse-reference">
    — {verse.reference} ({verse.translation})
  </p>
</div>
```

**This is fine** - uses `<p>` tags appropriately. **However:** Add `<article>` wrapper:
```javascript
<article className="verse-card" role="doc-quotation">
  <p className="verse-text">{verse.text}</p>
  <footer className="verse-reference">
    — {verse.reference} ({verse.translation})
  </footer>
</article>
```

#### Issue 2.6: Form Controls Missing Labels
```javascript
// SettingsView.jsx, lines 40-48: Input without explicit label
<label className="setting-row">
  <span>Focus duration</span>
  <div className="setting-input-group">
    <input
      type="number"
      min="1"
      max="120"
      value={settings.focusDuration}
      onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
      aria-label="Focus duration in minutes"  // MISSING
    />
    <span className="setting-unit">min</span>
  </div>
</label>
```

**Impact:** Low-medium - Labels are present visually but might not be correctly associated
**Fix:** Add `aria-label` or ensure `htmlFor` attributes connect labels:
```javascript
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
    />
    <span className="setting-unit">min</span>
  </div>
</label>
```

#### Issue 2.7: Loading State Not Announced
```javascript
// App.jsx, line 17-23
if (!loaded) {
  return (
    <div className="app loading">
      <div className="loading-text">Selah...</div>
    </div>
  );
}
```

**Fix:** Announce loading state:
```javascript
if (!loaded) {
  return (
    <div className="app loading" role="status" aria-label="Loading settings">
      <div className="loading-text">Selah...</div>
    </div>
  );
}
```

#### Issue 2.8: No Keyboard Navigation Visual Indicator
Buttons have `:hover` and `:active` states but **no visible focus ring** for keyboard navigation.

**Fix:** Add focus styles to CSS:
```css
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Accessibility Grade: 3/10
**Critical gaps:** Missing ARIA labels, timer not announced, no keyboard focus indicators, form association issues. This would fail basic WCAG compliance testing.

**Quick Wins (30 min fix):**
1. Add `aria-label` to all icon buttons
2. Add `aria-live="polite"` and `aria-label` to timer display
3. Add `:focus-visible` styles
4. Connect labels to form inputs with `htmlFor` and `id`

---

## 3. Responsive Design

### Current State

**Critical Issue: Fixed Popup Size**

```css
/* styles.css, lines 36-44 */
html, body {
  width: 360px;
  min-height: 480px;
  /* ... */
}

.app {
  width: 360px;
  min-height: 480px;
}
```

**Impact:** Very High - No responsive behavior at all
**Why it matters:**
- Chrome extension popups default to 360px width, but users can resize
- Different display scales (DPI) and browser zoom levels not handled
- Text may be unreadable at high DPI or with zoom

**Analysis:**
- **At 360px (default):** Content fits well - designed for this
- **At >360px (user resize):** Content doesn't scale; looks cramped
- **At <360px (small screens/mobile simulation):** Text and buttons overflow
- **High DPI (150%+):** Fixed pixel sizes cause layout issues

**Recommendations:**

1. **Remove fixed dimensions, use CSS Grid/Flexbox:**
```css
html, body {
  min-width: 360px;  /* Minimum, not fixed */
  min-height: 480px;
  max-width: 800px;  /* Allow reasonable growth */
  width: 100%;
  height: 100%;
  font-family: var(--font);
  font-size: clamp(14px, 2vw, 16px);  /* Responsive font size */
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

2. **Make verse card responsive:**
```css
.verse-card {
  background: white;
  border-radius: var(--radius);
  padding: clamp(12px, 4vw, 20px);  /* Scales with viewport */
  margin-bottom: 16px;
}

.verse-text {
  font-size: clamp(13px, 3vw, 16px);
  line-height: 1.6;
}
```

3. **Timer display scales:**
```css
.timer-time {
  font-size: clamp(36px, 12vw, 64px);  /* Scales with container */
  line-height: 1;
}
```

4. **Test at different DPI levels:**
```bash
# In Chrome DevTools:
# Settings → Rendering → Emulate CSS media features
# Test at 75%, 100%, 125%, 150%, 200% zoom
```

**Current Layout Test:**
- **360px (default):** ✅ Good (by design)
- **300px:** ❌ Text overflow, buttons cramped
- **500px:** ❌ Unused space, poor scaling
- **Mobile (320px):** ❌ Broken
- **4K display (150% DPI):** ❌ Might need scrolling

### Responsive Grade: 2/10
**Critical:** Fixed width means no real responsiveness. Will break at non-standard viewport sizes.

---

## 4. React Hooks Usage

### Custom Hooks Analysis

#### 4.1 useTimer Hook (useTimer.js)

**Strengths:**
- Good encapsulation of timer logic
- Proper cleanup in useEffect (line 39-43)
- Clear return interface

**Issues Found:**

##### Issue 4.1.1: Stale Closure in onTimerComplete (CRITICAL)

```javascript
// Lines 47-52
useEffect(() => {
  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);
    onTimerComplete();  // Uses cycleCount, phase from outer scope
  }
}, [secondsLeft, isRunning]);

// Lines 54-88
const onTimerComplete = () => {
  // Uses phase and cycleCount but NOT in dependency array
  if (phase === 'focus') {
    const newCycleCount = cycleCount + 1;  // ❌ Stale cycleCount!
    // ...
  }
};
```

**Problem:** `onTimerComplete` uses `phase` and `cycleCount` but is not in the dependency array. This causes stale closure bugs.

**Scenario that breaks:**
1. User starts focus session → `cycleCount = 0`, `phase = 'focus'`
2. Timer completes → `onTimerComplete()` captures `cycleCount = 0`
3. If user resets and starts again → `cycleCount = 0` still, but `onTimerComplete` still sees old value

**Fix:**
```javascript
const onTimerComplete = useCallback(() => {
  // Notify background service worker
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase });
  }

  if (phase === 'focus') {
    const newCycleCount = cycleCount + 1;
    setCycleCount(newCycleCount);
    // ... rest of logic
  } else if (phase === 'break') {
    setPhase('idle');
    setSecondsLeft(settings.focusDuration * 60);
    if (settings.autoStartNext) {
      startFocusSession();
    }
  }
}, [phase, cycleCount, settings, startFocusSession]); // Add dependencies

useEffect(() => {
  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);
    onTimerComplete();
  }
}, [secondsLeft, isRunning, onTimerComplete]); // Add onTimerComplete
```

**Impact:** High - Could cause cycle counter and phase logic to behave unexpectedly

##### Issue 4.1.2: Missing Dependency in startFocusSession

```javascript
// Lines 90-99
const startFocusSession = useCallback(() => {
  if (settings.scriptureEnabled) {
    setPhase('preFocus');
    setIsRunning(false);
  } else {
    setPhase('focus');
    setSecondsLeft(settings.focusDuration * 60);
    setIsRunning(true);
  }
}, [settings]); // Uses settings but what if settings changes while timer is running?
```

**Issue:** If `settings.scriptureEnabled` is toggled during a break, the timer won't react properly because `startFocusSession` is memoized based on the entire `settings` object. This might cause "infinite dependency chasing."

**Better approach:** Be more specific about dependencies:
```javascript
const startFocusSession = useCallback(() => {
  if (settings.scriptureEnabled) {
    setPhase('preFocus');
    setIsRunning(false);
  } else {
    setPhase('focus');
    setSecondsLeft(settings.focusDuration * 60);
    setIsRunning(true);
  }
}, [settings.scriptureEnabled, settings.focusDuration]);
```

##### Issue 4.1.3: Interval Not Cleared on isRunning Change

```javascript
// Lines 26-43
useEffect(() => {
  if (isRunning && secondsLeft > 0) {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [isRunning, secondsLeft]); // Dependency on secondsLeft causes issues
```

**Problem:** Re-running effect when `secondsLeft` changes creates and destroys intervals constantly. The dependency on `secondsLeft` forces the effect to rerun after every tick.

**Better approach:**
```javascript
useEffect(() => {
  if (!isRunning) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    return;
  }

  if (secondsLeft <= 0) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    return;
  }

  intervalRef.current = setInterval(() => {
    setSecondsLeft((prev) => {
      const newValue = prev - 1;
      if (newValue <= 0) {
        clearInterval(intervalRef.current);
      }
      return Math.max(0, newValue);
    });
  }, 1000);

  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, [isRunning]); // Only depend on isRunning
```

##### Issue 4.1.4: beginFocusFromPreFocus Missing settings.focusDuration Sync

```javascript
// Lines 101-105
const beginFocusFromPreFocus = useCallback(() => {
  setPhase('focus');
  setSecondsLeft(settings.focusDuration * 60);  // ✅ Good
  setIsRunning(true);
}, [settings.focusDuration]); // ⚠️ What if focusDuration is 0 or negative?
```

**Minor issue:** No validation that `settings.focusDuration` is valid. Consider adding guard:
```javascript
const beginFocusFromPreFocus = useCallback(() => {
  setPhase('focus');
  const duration = Math.max(1, settings.focusDuration);  // Ensure > 0
  setSecondsLeft(duration * 60);
  setIsRunning(true);
}, [settings.focusDuration]);
```

### Hooks Grade: 5/10
**Critical:** Stale closure bugs, dependency array issues, and inefficient interval management. These will cause reliability issues in production.

#### 4.2 useVerse Hook (useVerse.js)

**Strengths:**
- Simple and focused
- Good use of `useCallback`
- Proper filtering logic

**Issues:**

##### Issue 4.2.1: Missing Edge Case Handling

```javascript
// Lines 14-20
const getFilteredVerses = useCallback(() => {
  if (settings.theme === 'random') {
    return verses;  // Returns all verses for random
  }
  const themed = verses.filter((v) => v.theme === settings.theme);
  return themed.length > 0 ? themed : verses;  // Falls back to all if none found
}, [settings.theme]);
```

**Issue:** If verses.js is empty or corrupted, no error handling. This could silently fail.

**Fix:**
```javascript
const getFilteredVerses = useCallback(() => {
  if (!Array.isArray(verses) || verses.length === 0) {
    console.warn('No verses available');
    return []; // or provide a fallback verse
  }

  if (settings.theme === 'random') {
    return verses;
  }

  const themed = verses.filter((v) => v.theme === settings.theme);
  return themed.length > 0 ? themed : verses;
}, [settings.theme]);
```

##### Issue 4.2.2: Random Selection Could Repeat

```javascript
// Line 12
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
```

**Issue:** No prevention of repeated verses. Users might see the same verse twice in a row.

**Consider:** Track recently shown verses and avoid repeats:
```javascript
const [recentVerses, setRecentVerses] = useState([]);

const selectVerse = useCallback(() => {
  const pool = getFilteredVerses();
  let verse;

  // Filter out recently shown verses (last 3)
  const available = pool.filter(v => !recentVerses.includes(v.reference));
  if (available.length > 0) {
    verse = pickRandom(available);
  } else {
    verse = pickRandom(pool);
    setRecentVerses([]); // Reset if we've exhausted pool
  }

  setRecentVerses([...recentVerses.slice(-2), verse.reference]);

  const translation = settings.translation || 'esv';
  setCurrentVerse({
    reference: verse.reference,
    text: verse[translation] || verse.esv,
    translation: translation.toUpperCase(),
  });
}, [getFilteredVerses, settings.translation]);
```

### Hooks Grade: 6/10
**Moderate:** Works correctly but lacks edge case handling and could have UX improvements (no duplicate prevention).

#### 4.3 useSettings Hook (useStorage.js)

**Strengths:**
- Good Chrome storage fallback to localStorage
- Proper settings merge with defaults
- Handles both extension and non-extension contexts

**Issues:**

##### Issue 4.3.1: Race Condition on Initial Load

```javascript
// Lines 21-40
useEffect(() => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
      }
      setLoaded(true);  // Fired after async operation
    });
  } else {
    // ... localStorage fallback
    setLoaded(true);
  }
}, []);
```

**Problem:** `chrome.storage.local.get` is asynchronous. If component mounts and unmounts quickly (rare but possible in React 18 Strict Mode), this could cause "Can't perform React state update on unmounted component" warning.

**Fix:**
```javascript
useEffect(() => {
  let isMounted = true;

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('settings', (result) => {
      if (isMounted) {
        if (result.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
        }
        setLoaded(true);
      }
    });
  } else {
    try {
      const stored = localStorage.getItem('selah-settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setLoaded(true);
  }

  return () => {
    isMounted = false;
  };
}, []);
```

##### Issue 4.3.2: Silent Error Handling

```javascript
// Lines 35-37, 50-53
} catch (e) {
  // ignore
}
```

**Issue:** Errors are silently swallowed. If localStorage is corrupted, users won't know.

**Fix:**
```javascript
} catch (e) {
  console.error('Failed to parse stored settings:', e);
  // Still proceed with defaults
}
```

### Hooks Grade: 7/10
**Minor:** Small race condition in async loading, but generally solid. Silent error handling could hide issues.

---

## 5. State Management

### State Flow Analysis

**Overall Flow:**
```
App
├── useSettings() → settings, updateSettings
├── useTimer(settings) → phase, controls
└── useVerse(settings) → verse data

Phase Routing: idle → preFocus → focus → break → idle
```

**Strengths:**
- Clean separation: settings are global, timer state is local, verses are derived
- No prop drilling beyond 2 levels (except BreakView)
- Settings changes propagate properly through useEffect dependencies

**Issues:**

##### Issue 5.1: No Error State in App

```javascript
// App.jsx has NO error boundary and NO error states
export default function App() {
  const { settings, updateSettings, loaded } = useSettings();
  // No error catch for settings load failure
  const timer = useTimer(settings);
  const verse = useVerse(settings);

  if (!loaded) {
    return <div className="app loading">Selah...</div>;
  }

  // What if settings failed to load? Still undefined behavior
}
```

**Impact:** Medium - If settings fail to load, the app continues with defaults but doesn't inform user.

**Fix:**
```javascript
export default function App() {
  const { settings, updateSettings, loaded, error } = useSettings();

  if (error) {
    return (
      <div className="app error">
        <h2>Error Loading Settings</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  if (!loaded) {
    return <div className="app loading">Selah...</div>;
  }

  // ... rest
}
```

##### Issue 5.2: useTimer Tightly Coupled to Chrome API

```javascript
// Line 56-58
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase });
}
```

**Issue:** Timer logic mixed with extension integration. Should be decoupled.

**Better approach:**
```javascript
// useTimer.js returns: { phase, ..., onPhaseChange }
export function useTimer(settings) {
  const [phase, setPhase] = useState('idle');
  // ... rest of timer logic

  const handlePhaseChange = (newPhase) => {
    setPhase(newPhase);
    // Return signal, don't embed side effects
    return { phase: newPhase };
  };

  return {
    // ...
    onTimerComplete: () => ({
      phase,
      cycleCount: cycleCount + 1,
    }),
  };
}

// App.jsx handles the side effect
const timer = useTimer(settings);
useEffect(() => {
  if (timer.phase === 'break') {
    chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase: 'focus' });
  }
}, [timer.phase]);
```

##### Issue 5.3: Settings Change Doesn't Reset Timer Mid-Focus

```javascript
// If user changes focusDuration while timer is running, nothing resets
// Should either:
// 1. Apply change immediately (dangerous, might break current session)
// 2. Apply change after current session ends (better UX)
// 3. Prompt user to confirm (safest)
```

**Recommendation:** Add confirmation:
```javascript
const handleChange = (key, value) => {
  // If timer is running, ask for confirmation
  if (timer.isRunning && key === 'focusDuration') {
    if (confirm('This will apply after current session ends.')) {
      updateSettings({ [key]: value });
    }
  } else {
    updateSettings({ [key]: value });
  }
};
```

### State Management Grade: 6/10
**Moderate:** Good overall flow but missing error states, tightly coupled to Chrome API, and no safeguards for setting changes during active sessions.

---

## 6. User Experience

### Navigation & Flow

**Strengths:**
- Clear phase-based UI - users always know what's happening
- Good feedback on button clicks (hover/active states)
- Cycle progress indicator shows progress visually

**Issues:**

##### Issue 6.1: No Confirmation for Destructive Actions

```javascript
// FocusView.jsx line 21: Reset button
<button className="btn-text" onClick={onReset}>
  Reset
</button>

// BreakView.jsx line 51: Skip Break button
<button className="btn-text" onClick={onSkipBreak}>
  Skip Break
</button>
```

**Problem:** Users can accidentally reset or skip by misclick. No undo.

**Fix:**
```javascript
const [pendingReset, setPendingReset] = useState(false);

if (pendingReset) {
  return (
    <div className="timer-controls">
      <p className="confirmation-text">Reset session?</p>
      <button onClick={onReset}>Confirm</button>
      <button onClick={() => setPendingReset(false)}>Cancel</button>
    </div>
  );
}

return (
  <button onClick={() => setPendingReset(true)} className="btn-text">
    Reset
  </button>
);
```

##### Issue 6.2: No Loading State for Settings Save

```javascript
// SettingsView.jsx: Changes save instantly but no feedback
const handleChange = (key, value) => {
  updateSettings({ [key]: value });
  // No toast, no confirmation, no "saving..." state
};
```

**Fix:** Add optimistic UI feedback:
```javascript
const [lastSavedKey, setLastSavedKey] = useState(null);

const handleChange = (key, value) => {
  updateSettings({ [key]: value });
  setLastSavedKey(key);
  setTimeout(() => setLastSavedKey(null), 1500);
};

// Render:
{lastSavedKey === 'focusDuration' && (
  <span className="saved-indicator">✓ Saved</span>
)}
```

##### Issue 6.3: PreFocusView Timing Unclear

```javascript
// PreFocusView.jsx - no timer showing how long user has before focus begins
<div className="view prefocus-view">
  <h2 className="view-heading">Before you begin...</h2>
  {verse && <VerseCard verse={verse} />}
  {/* No indicator of 10-second preload time */}
  <button className="btn-primary" onClick={onBeginFocus}>
    Start Focus
  </button>
</div>
```

**Problem:** CLAUDE.md mentions 10-second preFocus delay, but UI doesn't show it. User might think it's waiting for input.

**Fix:**
```javascript
// Add visible countdown in PreFocusView
<div className="prefocus-info">
  <p>Take a moment to prepare yourself...</p>
  {/* Could add optional auto-start after 10 seconds */}
</div>
```

##### Issue 6.4: Settings Translation Label Unclear

```javascript
// SettingsView.jsx lines 114-126
<label className="setting-row">
  <span>Translation</span>
  <select value={settings.translation} onChange={(e) => handleChange('translation', e.target.value)}>
    {TRANSLATIONS.map((t) => (
      <option key={t.value} value={t.value}>{t.label}</option>
    ))}
  </select>
</label>
```

**Minor issue:** Users might not understand what "Translation" means. Is it for the app UI or the verses?

**Fix:**
```javascript
<label className="setting-row" title="Bible version for Scripture display">
  <span>Scripture Translation</span>
  <select>...</select>
</label>
```

### UX Grade: 6/10
**Moderate:** Good flow but missing confirmation dialogs, feedback states, and clarity on timing. Users won't feel confident making destructive actions.

---

## 7. Re-rendering Efficiency

### Performance Analysis

**Component Re-renders:**

#### IdleView
```javascript
export default function IdleView({ settings, verse, cycleCount, onStartFocus, onOpenSettings }) {
  useEffect(() => {
    if (settings.scriptureEnabled && !verse.currentVerse) {
      verse.selectVerse();  // Calls function on every mount
    }
  }, []); // ✅ Good: empty dependency array prevents refetch

  // Component re-renders when: parent re-renders (phase change)
  // Props change: settings, verse, cycleCount
}
```

**Issue:** `verse.selectVerse()` is called in effect, but `verse` is not in dependency array. This is actually correct here because we only want to fetch once, but it's subtle.

**Better:**
```javascript
useEffect(() => {
  if (settings.scriptureEnabled && !verse.currentVerse) {
    verse.selectVerse();
  }
}, [settings.scriptureEnabled, verse.selectVerse]); // Explicit deps
```

#### FocusView
```javascript
// No memoization, re-renders when parent re-renders
// But content is cheap (just numbers and buttons)
// However: `onPause, onResume, onReset` are function references

// Each time App.jsx re-renders, new function references are created:
<FocusView
  secondsLeft={timer.secondsLeft}  // Primitive (OK)
  isRunning={timer.isRunning}      // Primitive (OK)
  onPause={timer.pause}             // ⚠️ New ref on each parent render
  onResume={timer.resume}           // ⚠️ New ref on each parent render
  onReset={timer.reset}             // ⚠️ New ref on each parent render
/>
```

**Problem:** `timer.pause`, `timer.resume`, `timer.reset` are created fresh from `useCallback` each time `useTimer` is called, not memoized at App level.

**Actually OK because:** `useCallback` in `useTimer.js` memoizes these. But let's verify:

```javascript
// useTimer.js lines 107-115
const pause = useCallback(() => {
  setIsRunning(false);
}, []); // ✅ Stable reference (empty deps)

const resume = useCallback(() => {
  if (secondsLeft > 0 && (phase === 'focus' || phase === 'break')) {
    setIsRunning(true);
  }
}, [secondsLeft, phase]); // ⚠️ New ref when secondsLeft or phase change
```

**Issue:** `resume` depends on `secondsLeft`, so it gets a new reference every second when timer is running. This causes FocusView to re-render every second even if `isRunning` hasn't changed.

**Fix:**
```javascript
const resume = useCallback(() => {
  setIsRunning((prev) => prev ? prev : true); // Check current state instead
}, []);
```

Or better:
```javascript
const resume = useCallback(() => {
  // Use functional setState to avoid dependency on secondsLeft
  setIsRunning(true);
  // Add validation in the timer effect itself
}, []);
```

#### BreakView
```javascript
// Many props, selectors called inside
useEffect(() => {
  if (settings.scriptureEnabled && !verse) {
    selectVerse();      // Function prop
    selectReflection('break');
  }
}, []); // ⚠️ Empty deps but calls functions from props!
```

**Problem:** `selectVerse` and `selectReflection` are not in dependency array. If App re-mounts these functions, the effect won't re-run.

**Fix:**
```javascript
useEffect(() => {
  if (settings.scriptureEnabled && !verse) {
    selectVerse();
    selectReflection('break');
  }
}, [settings.scriptureEnabled, verse, selectVerse, selectReflection]);
```

#### SettingsView
```javascript
// Input onChange handlers created inline:
onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
```

**Issue:** Inline functions created on every render. Should memoize:
```javascript
const handleFocusChange = useCallback((e) => {
  handleChange('focusDuration', parseInt(e.target.value) || 25);
}, [handleChange]);

// Then:
<input onChange={handleFocusChange} />
```

### Overall Rendering Efficiency

**Real-world impact:**
- **Idle phase:** Timer ticking causes re-renders but should be fine
- **Focus phase:** Re-renders every second (expected)
- **Settings:** Multiple rapid changes could cause jank without memoization
- **Verse selection:** Async, probably fine

**Optimization Priority:**
1. Fix `resume` dependency to prevent needless re-renders
2. Add callbacks memoization to SettingsView handlers
3. Consider React.memo for view components if they become complex

### Efficiency Grade: 6/10
**Moderate:** No major performance issues (it's a small app), but some unnecessary re-renders from stale dependencies. Would benefit from memoization in SettingsView.

---

## 8. Error States & Error Handling

### Error Handling Coverage

**Critical Gaps:**

#### Issue 8.1: No Error Boundary

```javascript
// App.jsx has NO error boundary
export default function App() {
  // If any child component crashes, entire extension breaks
}
```

**Impact:** High - Runtime errors crash the extension UI
**Fix:** Add error boundary:
```javascript
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// App.jsx
export default function App() {
  return (
    <ErrorBoundary>
      {/* existing content */}
    </ErrorBoundary>
  );
}
```

#### Issue 8.2: Silent Failures in Data Loading

```javascript
// useVerse.js: If verses.js is empty, no error
// useSettings.js: If localStorage corrupted, silent fallback

// No way to know if something failed
```

**Fix:** Add error state to custom hooks:
```javascript
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ... loading logic
    if (loadFailed) {
      setError('Failed to load settings from storage');
    }
  }, []);

  return { settings, updateSettings, loaded, error };
}
```

#### Issue 8.3: No Validation on Timer Completion

```javascript
// useTimer.js: onTimerComplete() doesn't validate state
const onTimerComplete = () => {
  if (phase === 'focus') {
    const newCycleCount = cycleCount + 1;
    // What if cycleCount is NaN?
    // What if settings.cyclesBeforeLongBreak is invalid?
  }
};
```

**Fix:** Add guards:
```javascript
const onTimerComplete = useCallback(() => {
  if (typeof cycleCount !== 'number' || cycleCount < 0) {
    console.error('Invalid cycle count:', cycleCount);
    setCycleCount(0);
    return;
  }

  if (phase === 'focus') {
    const newCycleCount = cycleCount + 1;
    const cyclesBeforeLong = Math.max(0, Math.floor(settings.cyclesBeforeLongBreak));
    // ...
  }
}, [phase, cycleCount, settings]);
```

#### Issue 8.4: Chrome API Errors Not Handled

```javascript
// useTimer.js line 56-58: No error handling
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE', phase });
  // What if message fails? Silent failure
}

// useSettings.js line 23: No error handling
chrome.storage.local.get('settings', (result) => {
  // What if chrome.storage.local.get fails? Silent
  if (result.settings) {
    setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
  }
});
```

**Fix:**
```javascript
chrome.runtime.sendMessage(
  { type: 'TIMER_COMPLETE', phase },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to send message:', chrome.runtime.lastError);
    }
  }
);
```

#### Issue 8.5: No Verse Card Error State

```javascript
// VerseCard.jsx
export default function VerseCard({ verse }) {
  if (!verse) return null;  // Silent, no indication to user
  // What if verse.text is missing?
  // What if verse.reference is malformed?
}
```

**Fix:**
```javascript
export default function VerseCard({ verse }) {
  if (!verse) {
    return <div className="verse-card error">No verse available</div>;
  }

  if (!verse.text || !verse.reference) {
    return <div className="verse-card error">Invalid verse data</div>;
  }

  return (
    <article className="verse-card">
      <p className="verse-text">{verse.text}</p>
      <footer className="verse-reference">
        — {verse.reference} ({verse.translation || 'Unknown'})
      </footer>
    </article>
  );
}
```

### Error Handling Grade: 2/10
**Critical:** No error boundaries, silent failures throughout, no user feedback on errors. Extension could crash silently.

---

## Summary Table

| Category | Score | Status | Priority |
|----------|-------|--------|----------|
| Component Structure | 7/10 | Good | Medium - Add PropTypes |
| Accessibility | 3/10 | **Critical** | **High** - Add ARIA, focus styles |
| Responsive Design | 2/10 | **Critical** | **High** - Remove fixed widths |
| Hooks Usage | 5/10 | **Critical** | **High** - Fix stale closures |
| State Management | 6/10 | Good | Medium - Add error states |
| User Experience | 6/10 | Good | Medium - Add confirmations |
| Re-rendering | 6/10 | Good | Low - Minor memoization |
| Error Handling | 2/10 | **Critical** | **High** - Add error boundary |

**Overall: 5.1/10**

---

## Quick Win Improvements (30 minutes)

1. **Add ARIA labels:**
```javascript
// Icon buttons
<button aria-label="Open settings" title="Settings">
```

2. **Add focus styles:**
```css
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

3. **Timer announcement:**
```javascript
<div role="status" aria-live="polite" aria-label={`${minutes} minutes ${seconds} seconds`}>
  {display}
</div>
```

4. **Connect form labels:**
```javascript
<input id="focus-duration" type="number" />
<label htmlFor="focus-duration">Focus duration</label>
```

5. **Add error boundary:**
```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Major Improvement Path (2-3 hours)

### Priority 1: Accessibility (30 min)
- Add ARIA labels to all interactive elements
- Add focus-visible styles
- Make timer status announcements
- Connect form labels properly

### Priority 2: Error Handling (30 min)
- Add error boundary
- Add error states to hooks
- Validate data before using
- Add Chrome API error handlers

### Priority 3: Hooks Fixes (45 min)
- Fix stale closures in `useTimer`
- Fix dependency arrays in `useVerse` and `BreakView`
- Add mounted check in `useSettings`
- Add input validation

### Priority 4: UX Improvements (30 min)
- Add confirmation dialogs for destructive actions
- Add feedback for settings saves
- Clarify PreFocusView timing
- Add better error messages to users

### Priority 5: Responsive Design (30 min)
- Remove fixed widths
- Use `clamp()` for responsive fonts
- Test at different DPI levels
- Add mobile breakpoints if needed

---

## Code Examples for Fixes

### Fix 1: Error Boundary (Copy-paste ready)

```javascript
// src/popup/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app error-state">
          <h2>Something went wrong</h2>
          <p className="error-message">{this.state.error?.message || 'Unknown error'}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Extension
          </button>
          <button
            className="btn-text"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Fix 2: Accessible Timer Display

```javascript
// src/popup/components/TimerDisplay.jsx
import React from 'react';

export default function TimerDisplay({ secondsLeft, label }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const ariaLabel = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${seconds} ${seconds === 1 ? 'second' : 'seconds'} remaining`;

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

### Fix 3: useTimer Stale Closure (Critical)

```javascript
// src/popup/useTimer.js - Key changes only
const onTimerComplete = useCallback(() => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage(
      { type: 'TIMER_COMPLETE', phase },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message failed:', chrome.runtime.lastError);
        }
      }
    );
  }

  if (phase === 'focus') {
    const newCycleCount = cycleCount + 1;
    setCycleCount(newCycleCount);

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
}, [phase, cycleCount, settings, startFocusSession]); // FIXED: Added dependencies

useEffect(() => {
  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);
    onTimerComplete();
  }
}, [secondsLeft, isRunning, onTimerComplete]); // FIXED: Added onTimerComplete
```

---

## Testing Recommendations

### Unit Tests to Add

```javascript
// useTimer.test.js
describe('useTimer', () => {
  test('should increment cycleCount when focus timer completes', () => {
    // Mock timer completion and verify cycleCount increases
  });

  test('should not create stale closures', () => {
    // Verify callbacks reference latest state
  });
});

// useVerse.test.js
describe('useVerse', () => {
  test('should not repeat verses consecutively', () => {
    // Select verse twice, verify they differ
  });

  test('should handle empty verse pool', () => {
    // Test graceful fallback
  });
});
```

### Accessibility Testing

```bash
# Test with axe DevTools or similar
# Run in Chrome: Open DevTools → axe DevTools → Scan
# Expected: Zero critical violations

# Keyboard navigation test:
# 1. Tab through all buttons - should see visible focus ring
# 2. Arrow keys in form controls - should work
# 3. Enter/Space to activate buttons - should work
```

### Responsive Testing

```bash
# Test at different zoom levels:
# Chrome DevTools → Ctrl+Shift+P → "Rendering" → "Emulate CSS media features"
# Test at: 75%, 100%, 125%, 150%, 200% zoom
# Verify no text overflow, buttons accessible at all scales
```

---

## Conclusion

Selah Focus has a solid foundation with good React patterns and clean architecture. However, it has critical issues in accessibility, error handling, and hook dependencies that would cause failures in production or with disabled users.

**Recommended next steps:**
1. Implement error boundary immediately
2. Add ARIA labels and fix keyboard navigation (affects all users)
3. Fix stale closure bugs in useTimer (affects timer reliability)
4. Add responsive design (enables more users)
5. Add error states and feedback (improves UX confidence)

These improvements would bring the extension from 5.1/10 → 7.5/10 quality in 2-3 hours of focused work.

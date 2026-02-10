# Selah Focus - Quick Fixes & Improvement Checklist

## Critical Issues - Fix First (High Impact, 1-2 hours)

### 1. Add Error Boundary (Prevents Extension Crashes)
**File:** Create `src/popup/ErrorBoundary.jsx`
**Impact:** Any child component error will show graceful error UI instead of blank extension
**Status:** ❌ Missing

```jsx
// Wrap App in index.jsx:
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. Fix useTimer Stale Closures (Bugs in Timer Logic)
**File:** `src/popup/useTimer.js` - Lines 47-52, 54-88
**Impact:** Timer cycle counting could fail, phase transitions incorrect
**Status:** ❌ Critical bug

**The Fix:**
```javascript
// Add missing dependencies to onTimerComplete
const onTimerComplete = useCallback(() => {
  // ... logic ...
}, [phase, cycleCount, settings, startFocusSession]); // ← ADD THESE

useEffect(() => {
  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);
    onTimerComplete();
  }
}, [secondsLeft, isRunning, onTimerComplete]); // ← ADD onTimerComplete
```

### 3. Add ARIA Labels to Buttons (Accessibility for Screen Readers)
**Files:**
- `src/popup/components/IdleView.jsx` - Line 14
- `src/popup/components/SettingsView.jsx` - Line 26

**Impact:** Users with screen readers can't use settings button
**Status:** ❌ Missing

```jsx
<button
  className="btn-icon"
  onClick={onOpenSettings}
  aria-label="Open settings"
  title="Settings"
>
  <svg aria-hidden="true">...</svg>
</button>
```

### 4. Add Focus Visible Styles (Keyboard Navigation)
**File:** `src/popup/styles.css` - Add after line 446

**Impact:** Keyboard users can't see which button they're on
**Status:** ❌ Missing

```css
/* Add to CSS */
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 5. Add aria-live to Timer Display (Announces Time to Screen Readers)
**File:** `src/popup/components/TimerDisplay.jsx` - Line 10-12

**Impact:** Screen reader users don't hear timer ticking down
**Status:** ❌ Missing

```jsx
<div
  className="timer-time"
  role="status"
  aria-live="polite"
  aria-label={`${minutes} minutes ${seconds} seconds`}
>
  {display}
</div>
```

---

## Important Issues - Fix Next (Medium Impact, 1-2 hours)

### 6. Fix Responsive Design (Support Different Screen Sizes)
**File:** `src/popup/styles.css` - Lines 36-52

**Current:** Fixed at 360px × 480px
**Problem:** Breaks on different zoom levels, DPI settings, resizes
**Status:** ❌ Not responsive

**The Fix:**
```css
html, body {
  min-width: 360px;
  width: 100%;
  height: 100vh;
  min-height: 480px;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Make fonts responsive */
.timer-time {
  font-size: clamp(36px, 12vw, 56px);
}
```

### 7. Connect Form Labels Properly (Accessibility)
**File:** `src/popup/components/SettingsView.jsx` - Lines 40-48, 54-60, 66-74, 80-90

**Current:** Labels visually grouped but not semantically connected
**Problem:** Screen readers and assistive tech can't match labels to inputs
**Status:** ⚠️ Partially working

**The Fix:**
```jsx
<label htmlFor="focus-duration" className="setting-row">
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

### 8. Add Error State to useSettings Hook
**File:** `src/popup/useStorage.js` - Lines 17-58

**Current:** Silent failures on load
**Problem:** Users don't know if settings loaded successfully
**Status:** ❌ No error feedback

**The Fix:**
```javascript
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('settings', (result) => {
        if (isMounted) {
          try {
            if (result.settings) {
              setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
            }
            setLoaded(true);
          } catch (e) {
            setError(e.message);
            setLoaded(true);
          }
        }
      });
    } else {
      try {
        const stored = localStorage.getItem('selah-settings');
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
        setLoaded(true);
      } catch (e) {
        setError(e.message);
        setLoaded(true);
      }
    }

    return () => { isMounted = false; };
  }, []);

  return { settings, updateSettings, loaded, error };
}
```

### 9. Add Confirmation for Destructive Actions
**Files:**
- `src/popup/components/FocusView.jsx` - Reset button (Line 20)
- `src/popup/components/BreakView.jsx` - Skip Break button (Line 51)

**Current:** Single click resets/skips without confirmation
**Problem:** Accidental clicks lose progress
**Status:** ❌ No protection

**The Fix:**
```jsx
const [showResetConfirm, setShowResetConfirm] = useState(false);

if (showResetConfirm) {
  return (
    <div className="timer-controls">
      <span>Reset session?</span>
      <button onClick={onReset}>Confirm</button>
      <button onClick={() => setShowResetConfirm(false)}>Cancel</button>
    </div>
  );
}

return (
  <button
    className="btn-text"
    onClick={() => setShowResetConfirm(true)}
  >
    Reset
  </button>
);
```

### 10. Add PropTypes for Type Safety
**File:** Create prop validation for each component or use TypeScript

**Current:** No prop validation
**Problem:** Won't catch bugs if props passed wrong type
**Status:** ❌ Missing

**Simple Fix - Add to each component:**
```javascript
import PropTypes from 'prop-types';

IdleView.propTypes = {
  settings: PropTypes.shape({
    scriptureEnabled: PropTypes.bool,
    focusDuration: PropTypes.number,
  }).isRequired,
  verse: PropTypes.object,
  cycleCount: PropTypes.number.isRequired,
  onStartFocus: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
};
```

---

## Nice-to-Have Improvements (Polish, 30 min - 1 hour)

### 11. Prevent Verse Repetition
**File:** `src/popup/useVerse.js`

**Current:** Same verse can show twice in a row
**Better:** Track recently shown and avoid repeats

```javascript
const [recentVerses, setRecentVerses] = useState([]);

const selectVerse = useCallback(() => {
  const pool = getFilteredVerses();
  const available = pool.filter(v => !recentVerses.includes(v.reference));
  const verse = available.length > 0 ? pickRandom(available) : pickRandom(pool);

  setRecentVerses([...recentVerses.slice(-2), verse.reference]);
  // ... rest
}, [getFilteredVerses, settings.translation]);
```

### 12. Show Settings Save Feedback
**File:** `src/popup/components/SettingsView.jsx`

**Current:** Changes save but user gets no feedback
**Better:** Show "Saved" indicator briefly

```jsx
const [lastSavedKey, setLastSavedKey] = useState(null);

const handleChange = (key, value) => {
  updateSettings({ [key]: value });
  setLastSavedKey(key);
  setTimeout(() => setLastSavedKey(null), 1500);
};

// In JSX:
{lastSavedKey === 'focusDuration' && (
  <span className="saved-indicator">✓ Saved</span>
)}
```

### 13. Clarify PreFocus Timing
**File:** `src/popup/components/PreFocusView.jsx`

**Current:** No indication how long to read verse before auto-start
**Better:** Show timer or explicit message

```jsx
<div className="prefocus-info">
  <p className="prefocus-message">
    Take a moment to reflect on this Scripture before you begin your focus session...
  </p>
</div>
```

### 14. Add Input Validation
**File:** `src/popup/useTimer.js`

**Current:** No guards against invalid settings
**Better:** Validate before using

```javascript
const duration = Math.max(1, Math.min(120, settings.focusDuration || 25));
setSecondsLeft(duration * 60);
```

### 15. Improve Accessibility of Cycle Dots
**File:** `src/popup/components/FocusView.jsx` and CSS

**Current:** Color-only indicator (fails for colorblind users)
**Better:** Add pattern or text alternative

```jsx
<span
  key={i}
  className={`dot ${i < (cycleCount % 4) ? 'dot-filled' : ''}`}
  aria-label={`Cycle ${i + 1}: ${i < (cycleCount % 4) ? 'complete' : 'incomplete'}`}
/>
```

---

## Priority Matrix

```
            EFFORT
         Low    High
IMPACT
High     1,2,3  5,6,8
         4,7,9  10

Low      11,12  13,14
         13,14  15
```

### Do First (Quick Wins)
- [x] 1. Error Boundary (30 min)
- [x] 2. useTimer stale closure (45 min)
- [x] 3-5. Accessibility basics (45 min)
- [x] 7. Form label connection (15 min)

**Total for "Must Fix": ~2 hours**

### Do Next (Important)
- [x] 6. Responsive design (1 hour)
- [x] 8. Error state hook (30 min)
- [x] 9. Confirmation dialogs (30 min)
- [x] 10. PropTypes (20 min)

**Total for "Should Fix": ~2 hours**

### Do Later (Polish)
- [x] 11-15. Nice features (varies)

---

## Testing Checklist

After implementing fixes, test:

- [ ] Accessibility
  - [ ] Tab through all buttons - see focus ring
  - [ ] Click icon buttons - screen reader reads label
  - [ ] Timer counting - heard by screen reader
  - [ ] Form controls labeled correctly

- [ ] Timer Functionality
  - [ ] Start focus, timer counts down
  - [ ] Reset clears and returns to idle
  - [ ] Skip break returns to idle
  - [ ] Cycle counter increments correctly
  - [ ] Long break triggers every 4 cycles

- [ ] Responsive
  - [ ] At 100% zoom: looks good
  - [ ] At 150% zoom: no overflow
  - [ ] At 200% zoom: still readable
  - [ ] DevTools mobile view: functional

- [ ] Error Handling
  - [ ] Broken localStorage: shows error gracefully
  - [ ] Missing verse data: no crashes
  - [ ] Component error: shows error boundary

- [ ] Settings
  - [ ] Change focus duration: timer updates
  - [ ] Toggle scripture: verses appear/disappear
  - [ ] Change translation: verses update language
  - [ ] Settings persist after reload

---

## Files to Modify Summary

| File | Changes | Lines |
|------|---------|-------|
| `index.jsx` | Wrap App in ErrorBoundary | N/A - new |
| `ErrorBoundary.jsx` | Create new | 1-40 |
| `useTimer.js` | Fix stale closures | 47-52, 54-88 |
| `useStorage.js` | Add error state | 17-58 |
| `styles.css` | Responsive + focus-visible | 36-52, +20 lines |
| `IdleView.jsx` | Add aria-label | 14 |
| `SettingsView.jsx` | Add aria-labels, htmlFor | 40-90 |
| `FocusView.jsx` | Add confirmation | 20-21 |
| `BreakView.jsx` | Add confirmation | 51 |
| `TimerDisplay.jsx` | Add aria-live | 10-12 |
| `VerseCard.jsx` | Add semantic HTML | 6-13 |

---

## Estimated Total Effort

| Priority | Time | Value |
|----------|------|-------|
| Critical (1-5, 7, 9) | 2.5 hours | Fixes bugs, accessibility |
| Important (6, 8, 10) | 2 hours | Better UX, type safety |
| Nice (11-15) | 1.5 hours | Polish |
| **Total** | **~6 hours** | Production quality |

---

## Quick Command to Find Issues

```bash
cd /Users/paris/Documents/ParisCodes/BibleFocusApp/biblefocustimer

# Find all missing aria-labels
grep -r "btn-icon\|<button" src/popup/components --include="*.jsx" | grep -v aria-label

# Find useEffect without cleanup
grep -A 10 "useEffect" src/popup/*.js | grep -v "return ()"

# Find components without PropTypes
grep "export default function" src/popup/components/*.jsx

# Count nested prop drilling
grep "onClick=" src/popup/components/*.jsx | wc -l
```

---

## Implementation Order Recommended

```
Day 1 (30 min setup):
  1. Create ErrorBoundary.jsx
  2. Fix useTimer dependencies

Day 1 (1 hour):
  3. Add ARIA labels
  4. Add focus-visible styles
  5. Connect form labels

Day 2 (30 min):
  6. Add error state to useSettings
  7. Test timer functionality

Day 2 (1 hour):
  8. Fix responsive design
  9. Add confirmations
  10. Add PropTypes

Day 3 (Polish):
  11-15 as time permits
```

The above provides a clear, actionable roadmap. Start with items 1-5 for the biggest impact on quality and accessibility.

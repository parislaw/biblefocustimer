# Custom Verses & Themes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users add their own Bible verses and custom theme labels, store them in Chrome storage, and rotate them together with built-in verses in the extension.

**Architecture:** Custom verses are stored in `chrome.storage.local` under key `customVerses` (array). Built-in verses stay in `src/data/verses.js`. A new hook `useCustomVerses` loads/saves custom verses; `useVerse` is extended to accept an optional custom verse list and merge it with the built-in list before filtering by theme and picking at random. Theme list in Settings is built from built-in THEMES plus unique theme names from custom verses. UI: new "My verses" section in Settings with list, add form, delete, and optional JSON file import.

**Tech Stack:** React (existing), chrome.storage.local, Jest. No new dependencies.

---

## Context (for implementer)

- **Verse shape (built-in):** `{ id, theme, reference, esv, niv, kjv }`. Custom verses must support at least one text field; use `esv` as the single user-supplied text if we don't want multiple translations for custom.
- **Where themes come from:** `SettingsView.jsx` uses hardcoded `THEMES`. Built-in verse themes: `wisdom`, `peace`, `discipline`, `work`. "Random" means no theme filter.
- **useVerse:** `src/popup/useVerse.js` — filters by `settings.theme`, picks random, maps to `{ reference, text, translation }` using `settings.translation`. Must merge built-in + custom verses and support custom theme names.
- **Settings storage:** `useStorage.js` uses `chrome.storage.sync` for `settings`. Use `chrome.storage.local` for `customVerses` to avoid sync size limits and keep user content local.
- **Test command:** `npm test` (Jest). Run from `biblefocustimer/`.

---

## Task 1: Storage helper for custom verses

**Files:**
- Create: `biblefocustimer/src/popup/customVerseStorage.js`

**Step 1: Write the failing test**

Create `biblefocustimer/src/popup/customVerseStorage.test.js`:

```javascript
import { getCustomVerses, setCustomVerses } from './customVerseStorage';

describe('customVerseStorage', () => {
  beforeEach(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((key, cb) => cb({ customVerses: [] })),
          set: jest.fn((payload, cb) => cb && cb()),
        },
      },
    };
  });

  it('getCustomVerses returns empty array when nothing stored', (done) => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    getCustomVerses((verses) => {
      expect(verses).toEqual([]);
      done();
    });
  });

  it('setCustomVerses calls chrome.storage.local.set with customVerses', (done) => {
    const list = [{ id: 'c1', theme: 'custom', reference: 'John 1:1', esv: 'In the beginning...' }];
    setCustomVerses(list, () => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ customVerses: list }, expect.any(Function));
      done();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd biblefocustimer && npm test -- customVerseStorage.test.js -v`  
Expected: FAIL (module/customVerseStorage not found or getCustomVerses/setCustomVerses not defined)

**Step 3: Implement minimal code**

Create `biblefocustimer/src/popup/customVerseStorage.js`:

```javascript
const STORAGE_KEY = 'customVerses';

export function getCustomVerses(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const list = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      callback(list);
    });
  } else {
    callback([]);
  }
}

export function setCustomVerses(verses, callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [STORAGE_KEY]: verses }, callback || (() => {}));
  } else if (callback) {
    callback();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd biblefocustimer && npm test -- customVerseStorage.test.js -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/popup/customVerseStorage.js src/popup/customVerseStorage.test.js
git commit -m "feat: add customVerseStorage get/set for chrome.storage.local"
```

---

## Task 2: useCustomVerses hook

**Files:**
- Create: `biblefocustimer/src/popup/useCustomVerses.js`
- Test: `biblefocustimer/src/popup/useCustomVerses.test.js`

**Step 1: Write the failing test**

Create `biblefocustimer/src/popup/useCustomVerses.test.js`:

```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomVerses } from './useCustomVerses';

jest.mock('./customVerseStorage', () => ({
  getCustomVerses: jest.fn((cb) => cb([])),
  setCustomVerses: jest.fn((list, cb) => cb && cb()),
}));

const { getCustomVerses, setCustomVerses } = require('./customVerseStorage');

describe('useCustomVerses', () => {
  beforeEach(() => {
    getCustomVerses.mockImplementation((cb) => cb([]));
    setCustomVerses.mockClear();
  });

  it('returns empty list initially then loaded list', async () => {
    getCustomVerses.mockImplementation((cb) => cb([{ id: 'c1', theme: 'my', reference: 'Gen 1:1', esv: 'Text' }]));
    const { result } = renderHook(() => useCustomVerses());
    expect(result.current.customVerses).toEqual([]);
    await waitFor(() => {
      expect(result.current.customVerses.length).toBe(1);
      expect(result.current.customVerses[0].reference).toBe('Gen 1:1');
    });
  });

  it('setCustomVerses updates list and persists', async () => {
    getCustomVerses.mockImplementation((cb) => cb([]));
    const { result } = renderHook(() => useCustomVerses());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => {
      result.current.setCustomVerses([{ id: 'c1', theme: 'x', reference: 'R', esv: 'T' }]);
    });
    expect(result.current.customVerses).toHaveLength(1);
    expect(setCustomVerses).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd biblefocustimer && npm test -- useCustomVerses.test.js -v`  
Expected: FAIL

**Step 3: Implement useCustomVerses**

Create `biblefocustimer/src/popup/useCustomVerses.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getCustomVerses, setCustomVerses } from './customVerseStorage';

export function useCustomVerses() {
  const [customVerses, setState] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCustomVerses((list) => {
      setState(list);
      setLoaded(true);
    });
  }, []);

  const setCustomVersesState = useCallback((nextVerses) => {
    setState(nextVerses);
    setCustomVerses(nextVerses, () => {});
  }, []);

  return { customVerses, setCustomVerses: setCustomVersesState, loaded };
}
```

**Step 4: Run test to verify it passes**

Run: `cd biblefocustimer && npm test -- useCustomVerses.test.js -v`  
Expected: PASS (adjust test if hook exposes `loaded` and initial load is async; ensure setCustomVerses is called when updating).

**Step 5: Commit**

```bash
git add src/popup/useCustomVerses.js src/popup/useCustomVerses.test.js
git commit -m "feat: add useCustomVerses hook to load/save custom verses"
```

---

## Task 3: useVerse merges built-in and custom verses

**Files:**
- Modify: `biblefocustimer/src/popup/useVerse.js`
- Test: `biblefocustimer/src/popup/useVerse.test.js`

**Step 1: Extend useVerse signature and merge logic**

In `useVerse.js`: add second parameter `customVerses` (default `[]`). Build `allVerses = [...verses, ...(customVerses || [])]`. Use `allVerses` instead of `verses` in `getFilteredVerses`. When resolving text, support custom verses that may only have `esv` (no niv/kjv): use `verse[translation] || verse.esv || verse.text`.

**Step 2: Update useVerse.test.js**

Add test: when customVerses is passed with one verse and theme is that verse's theme, selectVerse yields that verse's content.

```javascript
it('includes custom verses in pool and can select by theme', () => {
  const custom = [{ id: 'c1', theme: 'mytheme', reference: 'Custom 1:1', esv: 'Custom text.' }];
  const { result } = renderHook(() => useVerse({ theme: 'mytheme', translation: 'esv' }, custom));
  act(() => { result.current.selectVerse(); });
  expect(result.current.currentVerse).not.toBeNull();
  expect(result.current.currentVerse.reference).toBe('Custom 1:1');
  expect(result.current.currentVerse.text).toBe('Custom text.');
});
```

**Step 3: Run tests**

Run: `cd biblefocustimer && npm test -- useVerse.test.js -v`  
Expected: PASS (after implementing merge in useVerse.js)

**Step 4: Commit**

```bash
git add src/popup/useVerse.js src/popup/useVerse.test.js
git commit -m "feat: useVerse merges custom verses and supports custom themes"
```

---

## Task 4: App provides custom verses to useVerse

**Files:**
- Modify: `biblefocustimer/src/popup/App.jsx`

**Step 1: Use useCustomVerses and pass to useVerse**

In App.jsx: call `useCustomVerses()`, get `customVerses` (and `loaded` if needed). Pass `customVerses` as second argument to `useVerse(settings, customVerses)`. Ensure verse is only selected when settings are loaded; if you gate on customVerses loaded, wait for both settings and customVerses loaded before showing main UI (optional; can show with empty custom verses until loaded).

**Step 2: Run tests**

Run: `cd biblefocustimer && npm test -v`  
Expected: All pass.

**Step 3: Commit**

```bash
git add src/popup/App.jsx
git commit -m "feat: App wires useCustomVerses into useVerse"
```

---

## Task 5: Settings UI — "My verses" section and theme list from custom

**Files:**
- Modify: `biblefocustimer/src/popup/components/SettingsView.jsx`
- Modify: `biblefocustimer/src/popup/App.jsx` (pass customVerses + setCustomVerses to SettingsView)

**Step 1: Build theme list from THEMES + custom verse themes**

In SettingsView, accept props: `customVerses`, `setCustomVerses`. Compute `themeOptions = [...THEMES, ...unique themes from customVerses].filter` (no duplicate theme values). Use `themeOptions` for the Theme dropdown instead of hardcoded THEMES.

**Step 2: Add "My verses" section**

Below Scripture section, add a section "My verses" with:
- Short description: "Add your own verses to rotate with the built-in ones."
- List of custom verses: show `reference` and `theme` for each, with a "Remove" button.
- Button: "Add verse".

**Step 3: Pass props from App**

App already has useCustomVerses. Pass `customVerses` and `setCustomVerses` to SettingsView.

**Step 4: Manual check**

Open extension popup → Settings → see "My verses" and theme dropdown includes any custom theme names after adding a verse (Task 6).

**Step 5: Commit**

```bash
git add src/popup/App.jsx src/popup/components/SettingsView.jsx
git commit -m "feat: Settings My verses section and dynamic theme list"
```

---

## Task 6: Add-verse form (inline or modal)

**Files:**
- Create: `biblefocustimer/src/popup/components/CustomVerseForm.jsx` (or inline in SettingsView)
- Modify: `biblefocustimer/src/popup/components/SettingsView.jsx`

**Step 1: Add form fields**

Fields: Reference (text), Theme (select: same themeOptions as Settings), Text (textarea — stored as `esv` for custom verses). Button "Save". On submit: build object `{ id: 'custom-' + Date.now(), theme, reference, esv: text }`, append to customVerses, call setCustomVerses, clear form.

**Step 2: Validation**

Reference and Text required; theme required. No new tests required for form if covered by E2E; optional unit test for validation helper.

**Step 3: Wire into SettingsView**

Show CustomVerseForm in "My verses" section. After save, list updates (state from useCustomVerses).

**Step 4: Commit**

```bash
git add src/popup/components/CustomVerseForm.jsx src/popup/components/SettingsView.jsx
git commit -m "feat: add custom verse form (reference, theme, text)"
```

---

## Task 7: Delete custom verse

**Files:**
- Modify: `biblefocustimer/src/popup/components/SettingsView.jsx`

**Step 1: Remove button and handler**

For each item in custom verses list, add "Remove" button. On click: filter out verse by id from customVerses, call setCustomVerses(newList).

**Step 2: Commit**

```bash
git add src/popup/components/SettingsView.jsx
git commit -m "feat: remove custom verse from Settings"
```

---

## Task 8: Import custom verses from JSON file

**Files:**
- Modify: `biblefocustimer/src/popup/components/SettingsView.jsx` (or a small ImportVerses.jsx)

**Step 1: File input and parse**

Add "Import from file" with `<input type="file" accept=".json" />`. On change: read file (FileReader), parse JSON. Expect array of items like `{ reference, theme, text }` or `{ reference, theme, esv }`. Validate each has reference and at least one text field. Generate `id: 'custom-' + Date.now() + '-' + i` for each. Append to existing customVerses, call setCustomVerses. Show brief success/error message (e.g. "Imported N verses" / "Invalid file").

**Step 2: Commit**

```bash
git add src/popup/components/SettingsView.jsx
git commit -m "feat: import custom verses from JSON file"
```

---

## Task 9: Normalize useVerse API (optional)

**Files:**
- Modify: `biblefocustimer/src/popup/useVerse.js`

**Step 1: Backward compatibility**

Ensure `useVerse(settings)` (no second arg) still works: default `customVerses = []`. All existing tests pass.

**Step 2: Run full test suite**

Run: `cd biblefocustimer && npm test`  
Expected: All pass.

**Step 3: Commit**

```bash
git add src/popup/useVerse.js
git commit -m "chore: useVerse accepts optional customVerses, default []"
```

---

## Task 10: Documentation and README note

**Files:**
- Modify: `biblefocustimer/README.md`

**Step 1: Add short section**

Add section "Custom verses and themes" explaining: users can add verses in Settings → My verses; optional JSON import format (array of `{ reference, theme, text }` or `{ reference, theme, esv }`); data stored locally only.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document custom verses and themes feature"
```

---

## Verification checklist

- [ ] `npm test` passes in biblefocustimer.
- [ ] Extension loads; Settings shows "My verses", add form, list, remove, import.
- [ ] Add a custom verse with custom theme; theme appears in Theme dropdown; start focus and see custom verse can appear.
- [ ] Import JSON with 2–3 verses; list updates; rotation includes them.
- [ ] Privacy: no server; all data in chrome.storage.local (mention in privacy policy if needed).

---

## Execution handoff

Plan complete and saved to `biblefocustimer/docs/plans/2025-02-11-custom-verses-themes.md`.

**Two execution options:**

1. **Subagent-driven (this session)** – I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** – Open a new session with executing-plans and run through the plan task-by-task with checkpoints.

Which approach do you want?

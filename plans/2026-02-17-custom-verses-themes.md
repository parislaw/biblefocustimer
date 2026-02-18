# Custom Verses and Themes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Enable users to create, manage, and use their own custom Bible verses alongside curated verses, with proper storage, display, and theme integration.

**Architecture:** The implementation follows a modular approach:
1. Enhance the `useVerse` hook to fetch and merge custom verses from storage with curated verses
2. Create dedicated UI components for custom verse management (add, edit, delete, view)
3. Integrate custom verse controls into the SettingsView via a new tab/section
4. Write comprehensive tests for all new functionality

**Tech Stack:** React (hooks), Chrome Storage API, Jest/Vitest for testing, TDD-first approach

---

## Executive Summary

**Current State:**
- `customVerseStorage.js` exists with get/set functions and full tests
- `useVerse.js` only pulls from static curated verses
- `SettingsView.jsx` has no custom verse management UI
- No "Custom" theme option in theme selector

**Deliverables:**
- Enhanced `useVerse.js` that merges custom + curated verses
- New `CustomVerseList.jsx` component to display custom verses
- New `CustomVerseForm.jsx` component for add/edit functionality
- Updated `SettingsView.jsx` with custom verse management tab
- Full test coverage (unit + integration tests)
- 5 git commits (one per major task)

**Execution Strategy:**
- **Parallel Track A:** Enhance useVerse hook (independent)
- **Parallel Track B:** Create UI components (independent)
- **Sequential:** Integrate into SettingsView (depends on Track B)
- **Sequential:** Write comprehensive tests (final phase)

---

## Phase 1: Enhance useVerse Hook (Parallel Track A)

### Task 1.1: Update useVerse to fetch custom verses

**Files:**
- Modify: `src/popup/useVerse.js`
- Test: `src/popup/useVerse.test.js` (add new test cases)

**Step 1: Write the failing test**

Add this test case to the bottom of `useVerse.test.js`:

```javascript
import { useVerse } from './useVerse';
import * as customStorage from './customVerseStorage';

jest.mock('./customVerseStorage');

describe('useVerse with custom verses', () => {
  it('merges custom verses with curated verses', (done) => {
    const customVerses = [
      {
        id: 'custom-1',
        theme: 'custom',
        reference: 'John 3:16',
        esv: 'For God so loved the world...',
        niv: 'For God so loved the world...',
      },
    ];

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb(customVerses);
    });

    const { result } = renderHook(() => useVerse({ theme: 'custom', translation: 'esv' }));

    act(() => {
      result.current.selectVerse();
    });

    // Wait for async operation
    setTimeout(() => {
      expect(result.current.currentVerse).toBeDefined();
      expect(result.current.currentVerse.reference).toBe('John 3:16');
      done();
    }, 100);
  });

  it('includes custom verses when theme is random', (done) => {
    const customVerses = [
      {
        id: 'custom-1',
        theme: 'custom',
        reference: 'John 3:16',
        esv: 'For God so loved the world...',
      },
    ];

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb(customVerses);
    });

    const { result } = renderHook(() => useVerse({ theme: 'random', translation: 'esv' }));

    act(() => {
      result.current.selectVerse();
    });

    setTimeout(() => {
      expect(result.current.currentVerse).toBeDefined();
      done();
    }, 100);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/popup/useVerse.test.js --watch=false
```

Expected: FAIL with "getCustomVerses is not defined" or similar

**Step 3: Write minimal implementation**

Update `src/popup/useVerse.js` to import and use custom verses:

```javascript
import { useState, useCallback, useEffect } from 'react';
import verses from '../data/verses';
import reflections from '../data/reflections';
import { getCustomVerses } from './customVerseStorage';

/**
 * Pick a random element from an array
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Hook to manage verse selection based on theme and translation settings.
 * Merges custom verses with curated verses.
 */
export function useVerse(settings) {
  const [currentVerse, setCurrentVerse] = useState(null);
  const [currentReflection, setCurrentReflection] = useState('');
  const [customVerses, setCustomVerses] = useState([]);

  // Load custom verses on mount
  useEffect(() => {
    getCustomVerses((verses) => {
      setCustomVerses(verses || []);
    });
  }, []);

  const getFilteredVerses = useCallback(() => {
    // Combine curated + custom verses
    const allVerses = [...verses, ...customVerses];

    if (settings.theme === 'random') {
      return allVerses;
    }

    if (settings.theme === 'custom') {
      return customVerses.length > 0 ? customVerses : verses;
    }

    const themed = allVerses.filter((v) => v.theme === settings.theme);
    return themed.length > 0 ? themed : allVerses;
  }, [settings.theme, customVerses]);

  const selectVerse = useCallback(() => {
    const pool = getFilteredVerses();
    if (pool.length === 0) {
      setCurrentVerse(null);
      return;
    }
    const verse = pickRandom(pool);
    const translation = settings.translation || 'esv';
    setCurrentVerse({
      reference: verse.reference,
      text: verse[translation] || verse.esv,
      translation: translation.toUpperCase(),
    });
  }, [getFilteredVerses, settings.translation]);

  const selectReflection = useCallback((type) => {
    const pool = type === 'break' ? reflections.breakTime : reflections.preFocus;
    setCurrentReflection(pickRandom(pool));
  }, []);

  return {
    currentVerse,
    currentReflection,
    selectVerse,
    selectReflection,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/popup/useVerse.test.js --watch=false
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/popup/useVerse.js src/popup/useVerse.test.js
git commit -m "feat: update useVerse to merge custom verses with curated verses"
```

---

## Phase 2: Create Custom Verse Management UI (Parallel Track B)

### Task 2.1: Create CustomVerseForm component

**Files:**
- Create: `src/popup/components/CustomVerseForm.jsx`
- Create: `src/popup/components/custom-verse-form.test.jsx`

**Step 1: Write the failing test**

```javascript
// src/popup/components/custom-verse-form.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomVerseForm from './CustomVerseForm';

describe('CustomVerseForm', () => {
  it('renders form with all required fields', () => {
    const mockOnSubmit = jest.fn();
    render(<CustomVerseForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/reference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/esv text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/niv text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kjv text/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add verse/i })).toBeInTheDocument();
  });

  it('submits form with verse data', () => {
    const mockOnSubmit = jest.fn();
    render(<CustomVerseForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/reference/i), {
      target: { value: 'John 3:16' },
    });
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'For God so loved the world...' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: 'John 3:16',
        esv: 'For God so loved the world...',
      })
    );
  });

  it('validates required fields', () => {
    const mockOnSubmit = jest.fn();
    render(<CustomVerseForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/reference is required/i)).toBeInTheDocument();
  });

  it('clears form after successful submission', () => {
    const mockOnSubmit = jest.fn();
    render(<CustomVerseForm onSubmit={mockOnSubmit} />);

    const referenceInput = screen.getByLabelText(/reference/i);
    fireEvent.change(referenceInput, { target: { value: 'John 3:16' } });
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'For God so loved the world...' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    expect(referenceInput.value).toBe('');
  });

  it('pre-fills form when editing verse', () => {
    const verse = {
      id: 'custom-1',
      reference: 'John 3:16',
      esv: 'For God so loved the world...',
    };
    const mockOnSubmit = jest.fn();
    render(<CustomVerseForm verse={verse} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/reference/i)).toHaveValue('John 3:16');
    expect(screen.getByLabelText(/esv text/i)).toHaveValue(
      'For God so loved the world...'
    );
    expect(screen.getByRole('button', { name: /update verse/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/popup/components/custom-verse-form.test.jsx --watch=false
```

Expected: FAIL with "CustomVerseForm not found"

**Step 3: Write minimal implementation**

```javascript
// src/popup/components/CustomVerseForm.jsx
import React, { useState, useEffect } from 'react';

export default function CustomVerseForm({ verse, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    reference: '',
    esv: '',
    niv: '',
    kjv: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (verse) {
      setFormData({
        reference: verse.reference || '',
        esv: verse.esv || '',
        niv: verse.niv || '',
        kjv: verse.kjv || '',
      });
    }
  }, [verse]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference.trim()) {
      newErrors.reference = 'Reference is required';
    }
    if (!formData.esv.trim()) {
      newErrors.esv = 'ESV text is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      id: verse?.id || `custom-${Date.now()}`,
      theme: 'custom',
      ...formData,
    });

    // Reset form if not editing
    if (!verse) {
      setFormData({ reference: '', esv: '', niv: '', kjv: '' });
    }
  };

  return (
    <form className="custom-verse-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="reference">Bible Reference *</label>
        <input
          id="reference"
          type="text"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          placeholder="e.g., John 3:16"
          aria-describedby={errors.reference ? 'reference-error' : undefined}
        />
        {errors.reference && (
          <span id="reference-error" className="error">
            {errors.reference}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="esv">ESV Text *</label>
        <textarea
          id="esv"
          name="esv"
          value={formData.esv}
          onChange={handleChange}
          placeholder="Enter the ESV translation..."
          rows="3"
          aria-describedby={errors.esv ? 'esv-error' : undefined}
        />
        {errors.esv && (
          <span id="esv-error" className="error">
            {errors.esv}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="niv">NIV Text (optional)</label>
        <textarea
          id="niv"
          name="niv"
          value={formData.niv}
          onChange={handleChange}
          placeholder="Enter the NIV translation..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="kjv">KJV Text (optional)</label>
        <textarea
          id="kjv"
          name="kjv"
          value={formData.kjv}
          onChange={handleChange}
          placeholder="Enter the KJV translation..."
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          aria-label={verse ? 'Update verse' : 'Add verse'}
        >
          {verse ? 'Update Verse' : 'Add Verse'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/popup/components/custom-verse-form.test.jsx --watch=false
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/popup/components/CustomVerseForm.jsx src/popup/components/custom-verse-form.test.jsx
git commit -m "feat: add CustomVerseForm component for adding/editing custom verses"
```

---

### Task 2.2: Create CustomVerseList component

**Files:**
- Create: `src/popup/components/CustomVerseList.jsx`
- Create: `src/popup/components/custom-verse-list.test.jsx`

**Step 1: Write the failing test**

```javascript
// src/popup/components/custom-verse-list.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomVerseList from './CustomVerseList';

describe('CustomVerseList', () => {
  const mockVerses = [
    {
      id: 'custom-1',
      reference: 'John 3:16',
      esv: 'For God so loved the world...',
    },
    {
      id: 'custom-2',
      reference: 'Romans 12:1',
      esv: 'I appeal to you therefore...',
    },
  ];

  it('renders empty state when no verses', () => {
    render(<CustomVerseList verses={[]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/no custom verses yet/i)).toBeInTheDocument();
  });

  it('displays list of custom verses', () => {
    render(
      <CustomVerseList verses={mockVerses} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByText('John 3:16')).toBeInTheDocument();
    expect(screen.getByText('Romans 12:1')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(
      <CustomVerseList verses={mockVerses} onEdit={mockOnEdit} onDelete={() => {}} />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockVerses[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    render(
      <CustomVerseList verses={mockVerses} onEdit={() => {}} onDelete={mockOnDelete} />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('custom-1');
  });

  it('shows verse text truncated in list', () => {
    const verses = [
      {
        id: 'custom-1',
        reference: 'John 3:16',
        esv: 'This is a very long verse text that should be truncated in the list view to keep things clean and readable.',
      },
    ];
    render(<CustomVerseList verses={verses} onEdit={() => {}} onDelete={() => {}} />);

    const verseText = screen.getByText(/This is a very long verse/i);
    expect(verseText).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/popup/components/custom-verse-list.test.jsx --watch=false
```

Expected: FAIL

**Step 3: Write minimal implementation**

```javascript
// src/popup/components/CustomVerseList.jsx
import React from 'react';

export default function CustomVerseList({ verses, onEdit, onDelete }) {
  if (verses.length === 0) {
    return (
      <div className="custom-verses-empty">
        <p>No custom verses yet. Add one to get started!</p>
      </div>
    );
  }

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="custom-verses-list">
      <div className="verses-count">
        {verses.length} custom {verses.length === 1 ? 'verse' : 'verses'}
      </div>
      <ul className="verses-items" role="list">
        {verses.map((verse) => (
          <li key={verse.id} className="verse-item">
            <div className="verse-content">
              <div className="verse-reference">{verse.reference}</div>
              <div className="verse-text">{truncateText(verse.esv)}</div>
            </div>
            <div className="verse-actions">
              <button
                className="btn-icon"
                onClick={() => onEdit(verse)}
                aria-label={`Edit ${verse.reference}`}
                title="Edit verse"
              >
                ✎
              </button>
              <button
                className="btn-icon btn-danger"
                onClick={() => onDelete(verse.id)}
                aria-label={`Delete ${verse.reference}`}
                title="Delete verse"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/popup/components/custom-verse-list.test.jsx --watch=false
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/popup/components/CustomVerseList.jsx src/popup/components/custom-verse-list.test.jsx
git commit -m "feat: add CustomVerseList component for displaying and managing verses"
```

---

## Phase 3: Integrate Custom Verses into SettingsView (Sequential - depends on Phase 2)

### Task 3.1: Add custom verses management tab to SettingsView

**Files:**
- Modify: `src/popup/components/SettingsView.jsx`
- Create: `src/popup/components/settings-view.test.jsx` (add new test cases)

**Step 1: Write the failing test**

Add to `settings-view.test.jsx`:

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsView from './SettingsView';

describe('SettingsView custom verses', () => {
  const mockSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    autoStartNext: false,
    scriptureEnabled: true,
    translation: 'esv',
    theme: 'random',
  };

  it('renders custom verses tab', () => {
    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /custom verses/i })).toBeInTheDocument();
  });

  it('displays custom verses section when tab is active', () => {
    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    const tab = screen.getByRole('button', { name: /custom verses/i });
    fireEvent.click(tab);

    expect(screen.getByText(/manage your verses/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/popup/components/settings-view.test.jsx --watch=false
```

Expected: FAIL

**Step 3: Update SettingsView**

Replace `src/popup/components/SettingsView.jsx` with updated version that includes tabs:

```javascript
import React, { useState, useEffect } from 'react';
import CustomVerseForm from './CustomVerseForm';
import CustomVerseList from './CustomVerseList';
import { getCustomVerses, setCustomVerses } from '../customVerseStorage';

const TRANSLATIONS = [
  { value: 'esv', label: 'ESV' },
  { value: 'niv', label: 'NIV' },
  { value: 'kjv', label: 'KJV' },
];

const THEMES = [
  { value: 'random', label: 'Random' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'peace', label: 'Peace' },
  { value: 'discipline', label: 'Discipline' },
  { value: 'work', label: 'Work & Diligence' },
  { value: 'custom', label: 'Custom Verses' },
];

export default function SettingsView({ settings, updateSettings, onClose }) {
  const [activeTab, setActiveTab] = useState('timer');
  const [customVerses, setLocalCustomVerses] = useState([]);
  const [editingVerse, setEditingVerse] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getCustomVerses((verses) => {
      setLocalCustomVerses(verses || []);
    });
  }, []);

  const validateNumericInput = (value, min, max) => {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < min) return min;
    if (parsed > max) return max;
    return parsed;
  };

  const handleChange = (key, value) => {
    let validatedValue = value;

    if (key === 'focusDuration') {
      validatedValue = validateNumericInput(value, 1, 120);
    } else if (key === 'shortBreakDuration') {
      validatedValue = validateNumericInput(value, 1, 30);
    } else if (key === 'longBreakDuration') {
      validatedValue = validateNumericInput(value, 1, 60);
    } else if (key === 'cyclesBeforeLongBreak') {
      validatedValue = validateNumericInput(value, 0, 10);
    }

    updateSettings({ [key]: validatedValue });
  };

  const handleAddVerse = (verseData) => {
    const updatedVerses = editingVerse
      ? customVerses.map((v) => (v.id === verseData.id ? verseData : v))
      : [...customVerses, verseData];

    setCustomVerses(updatedVerses);
    setLocalCustomVerses(updatedVerses);
    setEditingVerse(null);
    setShowForm(false);

    setCustomVerses(updatedVerses, () => {
      // Callback after storage
    });
  };

  const handleDeleteVerse = (verseId) => {
    const updatedVerses = customVerses.filter((v) => v.id !== verseId);
    setLocalCustomVerses(updatedVerses);
    setCustomVerses(updatedVerses);
  };

  const handleEditVerse = (verse) => {
    setEditingVerse(verse);
    setShowForm(true);
  };

  return (
    <div className="view settings-view" role="main" aria-label="Settings">
      <header className="settings-header">
        <h2 className="view-heading">Settings</h2>
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close settings"
          title="Close settings (Escape)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
          role="tab"
          aria-selected={activeTab === 'timer'}
        >
          Timer
        </button>
        <button
          className={`tab-button ${activeTab === 'scripture' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripture')}
          role="tab"
          aria-selected={activeTab === 'scripture'}
        >
          Scripture
        </button>
        <button
          className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
          role="tab"
          aria-selected={activeTab === 'custom'}
        >
          Custom Verses
        </button>
      </div>

      {activeTab === 'timer' && (
        <div className="settings-section" role="tabpanel">
          <h3 className="settings-section-title">Timer Settings</h3>

          <label className="setting-row" htmlFor="focus-duration">
            <span id="focus-duration-label">Focus duration</span>
            <div className="setting-input-group">
              <input
                id="focus-duration"
                type="number"
                min="1"
                max="120"
                value={settings.focusDuration}
                onChange={(e) => handleChange('focusDuration', e.target.value)}
                aria-labelledby="focus-duration-label"
              />
              <span className="setting-unit">min</span>
            </div>
          </label>

          <label className="setting-row" htmlFor="short-break">
            <span id="short-break-label">Short break</span>
            <div className="setting-input-group">
              <input
                id="short-break"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
                aria-labelledby="short-break-label"
              />
              <span className="setting-unit">min</span>
            </div>
          </label>

          <label className="setting-row" htmlFor="long-break">
            <span id="long-break-label">Long break</span>
            <div className="setting-input-group">
              <input
                id="long-break"
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => handleChange('longBreakDuration', e.target.value)}
                aria-labelledby="long-break-label"
              />
              <span className="setting-unit">min</span>
            </div>
          </label>

          <label className="setting-row" htmlFor="cycles-before-long">
            <span id="cycles-label">Cycles before long break</span>
            <div className="setting-input-group">
              <input
                id="cycles-before-long"
                type="number"
                min="0"
                max="10"
                value={settings.cyclesBeforeLongBreak}
                onChange={(e) => handleChange('cyclesBeforeLongBreak', e.target.value)}
                aria-labelledby="cycles-label"
              />
              <span className="setting-unit">(0 to disable)</span>
            </div>
          </label>

          <label className="setting-row" htmlFor="auto-start-toggle">
            <span id="auto-start-label">Auto-start next session</span>
            <input
              id="auto-start-toggle"
              type="checkbox"
              checked={settings.autoStartNext}
              onChange={(e) => handleChange('autoStartNext', e.target.checked)}
              aria-labelledby="auto-start-label"
            />
          </label>
        </div>
      )}

      {activeTab === 'scripture' && (
        <div className="settings-section" role="tabpanel">
          <h3 className="settings-section-title">Scripture Settings</h3>

          <label className="setting-row" htmlFor="scripture-toggle">
            <span id="scripture-label">Show Scripture</span>
            <input
              id="scripture-toggle"
              type="checkbox"
              checked={settings.scriptureEnabled}
              onChange={(e) => handleChange('scriptureEnabled', e.target.checked)}
              aria-labelledby="scripture-label"
            />
          </label>

          <label className="setting-row" htmlFor="translation-select">
            <span id="translation-label">Translation</span>
            <select
              id="translation-select"
              value={settings.translation}
              onChange={(e) => handleChange('translation', e.target.value)}
              aria-labelledby="translation-label"
              disabled={!settings.scriptureEnabled}
            >
              {TRANSLATIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="setting-row" htmlFor="theme-select">
            <span id="theme-label">Theme</span>
            <select
              id="theme-select"
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              aria-labelledby="theme-label"
              disabled={!settings.scriptureEnabled}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className="settings-footer">
            <p className="settings-note">
              Scripture translations sourced for personal devotional use.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="settings-section" role="tabpanel">
          <h3 className="settings-section-title">Custom Verses</h3>
          <p className="settings-description">
            Manage your verses. You can add custom Bible verses to your collection.
          </p>

          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              style={{ marginBottom: '1rem' }}
            >
              + Add New Verse
            </button>
          )}

          {showForm && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <CustomVerseForm
                verse={editingVerse}
                onSubmit={handleAddVerse}
                onCancel={() => {
                  setShowForm(false);
                  setEditingVerse(null);
                }}
              />
            </div>
          )}

          <CustomVerseList
            verses={customVerses}
            onEdit={handleEditVerse}
            onDelete={handleDeleteVerse}
          />
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/popup/components/settings-view.test.jsx --watch=false
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/popup/components/SettingsView.jsx src/popup/components/settings-view.test.jsx
git commit -m "feat: add custom verses management tab to SettingsView"
```

---

## Phase 4: Add Styling for New Components

### Task 4.1: Add CSS for custom verse components

**Files:**
- Modify: `src/popup/styles.css`

**Step 1: Add styles**

Append to `src/popup/styles.css`:

```css
/* Custom Verses Management */
.settings-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #333;
}

.tab-button.active {
  color: #4a90e2;
  border-bottom-color: #4a90e2;
}

/* Custom Verse Form */
.custom-verse-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group .error {
  color: #e74c3c;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-primary:hover {
  background-color: #3a7bc8;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

/* Custom Verse List */
.custom-verses-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
  font-style: italic;
}

.custom-verses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.verses-count {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.verses-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.verse-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.verse-content {
  flex: 1;
  min-width: 0;
}

.verse-reference {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.verse-text {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.verse-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-icon {
  background: none;
  border: 1px solid #ddd;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.btn-icon:hover {
  background-color: #f0f0f0;
  border-color: #999;
}

.btn-icon.btn-danger:hover {
  background-color: #ffe0e0;
  border-color: #e74c3c;
  color: #e74c3c;
}

.settings-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}
```

**Step 2: Commit**

```bash
git add src/popup/styles.css
git commit -m "style: add CSS for custom verse form and list components"
```

---

## Phase 5: Comprehensive Testing and Integration

### Task 5.1: Integration test - full custom verse flow

**Files:**
- Create: `src/popup/components/integration.test.js`

**Step 1: Write integration test**

```javascript
// src/popup/components/integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsView from './SettingsView';
import * as customStorage from '../customVerseStorage';

jest.mock('../customVerseStorage');

describe('Custom Verses Integration', () => {
  const mockSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    autoStartNext: false,
    scriptureEnabled: true,
    translation: 'esv',
    theme: 'random',
  };

  beforeEach(() => {
    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb([]);
    });
    customStorage.setCustomVerses.mockImplementation((verses, cb) => {
      if (cb) cb();
    });
  });

  it('allows user to add custom verse through settings', async () => {
    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    // Navigate to custom verses tab
    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    // Click add new verse button
    fireEvent.click(screen.getByRole('button', { name: /add new verse/i }));

    // Fill in form
    fireEvent.change(screen.getByLabelText(/reference/i), {
      target: { value: 'John 3:16' },
    });
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'For God so loved the world...' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    // Verify setCustomVerses was called
    await waitFor(() => {
      expect(customStorage.setCustomVerses).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            reference: 'John 3:16',
            esv: 'For God so loved the world...',
            theme: 'custom',
          }),
        ]),
        expect.any(Function)
      );
    });
  });

  it('allows user to edit a custom verse', async () => {
    const existingVerse = {
      id: 'custom-1',
      reference: 'John 3:16',
      esv: 'For God so loved the world...',
      theme: 'custom',
    };

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb([existingVerse]);
    });

    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit john 3:16/i });
    fireEvent.click(editButton);

    // Verify form is prefilled
    expect(screen.getByLabelText(/reference/i)).toHaveValue('John 3:16');

    // Update verse
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'Updated text...' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update verse/i }));

    await waitFor(() => {
      expect(customStorage.setCustomVerses).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'custom-1',
            esv: 'Updated text...',
          }),
        ]),
        expect.any(Function)
      );
    });
  });

  it('allows user to delete a custom verse', async () => {
    const existingVerse = {
      id: 'custom-1',
      reference: 'John 3:16',
      esv: 'For God so loved the world...',
      theme: 'custom',
    };

    customStorage.getCustomVerses.mockImplementation((cb) => {
      cb([existingVerse]);
    });

    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete john 3:16/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(customStorage.setCustomVerses).toHaveBeenCalledWith([], expect.any(Function));
    });
  });
});
```

**Step 2: Run test to verify it passes**

```bash
npm test -- src/popup/components/integration.test.js --watch=false
```

**Step 3: Commit**

```bash
git add src/popup/components/integration.test.js
git commit -m "test: add comprehensive integration tests for custom verses"
```

---

### Task 5.2: Build and verify all tests pass

**Files:**
- No new files

**Step 1: Run full test suite**

```bash
npm test -- --coverage --watch=false
```

Expected: All tests PASS with >80% coverage

**Step 2: Build the extension**

```bash
npm run build
```

Expected: Build completes without errors

**Step 3: Commit final state**

```bash
git status
```

If any uncommitted changes (shouldn't be), commit them:

```bash
git commit -m "build: verify all tests pass and build succeeds"
```

---

## Success Criteria

✅ All tests passing (unit + integration)
✅ `useVerse` hook merges custom + curated verses
✅ `CustomVerseForm` component handles add/edit with validation
✅ `CustomVerseList` component displays and allows delete
✅ `SettingsView` has working custom verses tab
✅ Theme selector includes "Custom Verses" option
✅ CSS styling is complete and responsive
✅ No console errors in extension
✅ Build succeeds without warnings
✅ 5 clear git commits with descriptive messages

---

## Parallel Execution Summary

**Can be done in parallel (independent):**
- Phase 1 (Task 1.1): Enhance useVerse
- Phase 2 (Tasks 2.1, 2.2): Create UI components

**Must be sequential (dependent):**
- Phase 3 (Task 3.1): Integration into SettingsView (needs Phase 2 complete)
- Phase 4 (Task 4.1): Styling (can happen anytime, recommended before Phase 3)
- Phase 5: Testing and verification (last phase)

**Recommended execution order with agents:**
1. Agent A: Phase 1 (useVerse enhancement)
2. Agent B (parallel): Phase 2 (UI components)
3. After A & B complete: Agent C: Phase 3 (integration)
4. After B complete: Agent D (parallel to C): Phase 4 (styling)
5. After all: Agent E: Phase 5 (testing)
6. Final: Code review and merge

---

## Estimated Effort

- **Phase 1:** ~15 minutes (1 task)
- **Phase 2:** ~30 minutes (2 tasks)
- **Phase 3:** ~20 minutes (1 task)
- **Phase 4:** ~10 minutes (1 task)
- **Phase 5:** ~15 minutes (2 tasks)

**Total: ~90 minutes** (~1.5 hours for a team of 2-3 agents working in parallel)


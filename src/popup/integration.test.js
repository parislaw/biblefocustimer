import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsView from './components/SettingsView';
import * as customStorage from './customVerseStorage';

jest.mock('./customVerseStorage');

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
    customStorage.getCustomVerses.mockClear();
    customStorage.setCustomVerses.mockClear();
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
      const calls = customStorage.setCustomVerses.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toEqual([]);
    });
  });

  it('displays custom verses in list after addition', async () => {
    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    // Add a verse
    fireEvent.click(screen.getByRole('button', { name: /add new verse/i }));
    fireEvent.change(screen.getByLabelText(/reference/i), {
      target: { value: 'Romans 12:1' },
    });
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'I appeal to you therefore...' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    // Verse should appear in the list
    await waitFor(() => {
      expect(screen.getByText('Romans 12:1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no verses exist', () => {
    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    expect(screen.getByText(/no custom verses yet/i)).toBeInTheDocument();
  });

  it('maintains other tab settings when switching tabs', () => {
    render(
      <SettingsView
        settings={mockSettings}
        updateSettings={() => {}}
        onClose={() => {}}
      />
    );

    // Navigate to Timer tab
    fireEvent.click(screen.getByRole('tab', { name: /^timer$/i }));
    expect(screen.getByLabelText(/focus duration/i)).toBeInTheDocument();

    // Navigate to Scripture tab
    fireEvent.click(screen.getByRole('tab', { name: /^scripture$/i }));
    expect(screen.getByLabelText(/show scripture/i)).toBeInTheDocument();

    // Navigate to Custom Verses tab
    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));
    expect(screen.getByText(/manage your verses/i)).toBeInTheDocument();

    // Back to Timer
    fireEvent.click(screen.getByRole('tab', { name: /^timer$/i }));
    expect(screen.getByLabelText(/focus duration/i)).toBeInTheDocument();
  });
});

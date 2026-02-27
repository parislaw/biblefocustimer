import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlatformProvider } from '../platform';
import { createMockPlatform } from './testPlatform';
import SettingsView from './components/SettingsView';

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

function renderSettingsView(initialCustomVerses = [], persistCustomVerses = jest.fn()) {
  function Wrapper() {
    const [customVerses, setCustomVerses] = useState(initialCustomVerses);
    const persist = (verses) => {
      setCustomVerses(verses);
      persistCustomVerses(verses);
    };
    return (
      <PlatformProvider platform={createMockPlatform()}>
        <SettingsView
          settings={mockSettings}
          updateSettings={() => {}}
          customVerses={customVerses}
          persistCustomVerses={persist}
          onClose={() => {}}
        />
      </PlatformProvider>
    );
  }
  return render(<Wrapper />);
}

describe('Custom Verses Integration', () => {
  it('allows user to add custom verse through settings', async () => {
    const persistMock = jest.fn();
    renderSettingsView([], persistMock);

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));
    fireEvent.click(screen.getByRole('button', { name: /add new verse/i }));

    fireEvent.change(screen.getByLabelText(/reference/i), {
      target: { value: 'John 3:16' },
    });
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'For God so loved the world...' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    await waitFor(() => {
      expect(persistMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            reference: 'John 3:16',
            esv: 'For God so loved the world...',
            theme: 'custom',
          }),
        ])
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
    const persistMock = jest.fn();
    renderSettingsView([existingVerse], persistMock);

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    const editButton = screen.getByRole('button', { name: /edit john 3:16/i });
    fireEvent.click(editButton);

    expect(screen.getByLabelText(/reference/i)).toHaveValue('John 3:16');

    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'Updated text...' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update verse/i }));

    await waitFor(() => {
      expect(persistMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'custom-1',
            esv: 'Updated text...',
          }),
        ])
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
    const persistMock = jest.fn();
    renderSettingsView([existingVerse], persistMock);

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    const deleteButton = screen.getByRole('button', { name: /delete john 3:16/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(persistMock).toHaveBeenCalledWith([]);
    });
  });

  it('displays custom verses in list after addition', async () => {
    renderSettingsView([]);

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    fireEvent.click(screen.getByRole('button', { name: /add new verse/i }));
    fireEvent.change(screen.getByLabelText(/reference/i), {
      target: { value: 'Romans 12:1' },
    });
    fireEvent.change(screen.getByLabelText(/esv text/i), {
      target: { value: 'I appeal to you therefore...' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add verse/i }));

    await waitFor(() => {
      expect(screen.getByText('Romans 12:1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no verses exist', () => {
    renderSettingsView([]);

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));

    expect(screen.getByText(/no custom verses yet/i)).toBeInTheDocument();
  });

  it('maintains other tab settings when switching tabs', () => {
    renderSettingsView([]);

    fireEvent.click(screen.getByRole('tab', { name: /^timer$/i }));
    expect(screen.getByLabelText(/focus duration/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^scripture$/i }));
    expect(screen.getByLabelText(/show scripture/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /custom verses/i }));
    expect(screen.getByText(/manage your verses/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^timer$/i }));
    expect(screen.getByLabelText(/focus duration/i)).toBeInTheDocument();
  });
});

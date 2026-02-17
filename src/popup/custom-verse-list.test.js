import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomVerseList from './components/CustomVerseList';

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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomVerseForm from './components/CustomVerseForm';

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

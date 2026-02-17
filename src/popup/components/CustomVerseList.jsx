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

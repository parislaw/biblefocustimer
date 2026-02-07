import React from 'react';

export default function VerseCard({ verse }) {
  if (!verse) return null;

  return (
    <div className="verse-card">
      <p className="verse-text">{verse.text}</p>
      <p className="verse-reference">
        — {verse.reference} ({verse.translation})
      </p>
    </div>
  );
}

import React from 'react';
import VerseCard from './VerseCard';

export default function PreFocusView({ verse, reflection, settings, onBeginFocus }) {
  return (
    <div className="view prefocus-view">
      <h2 className="view-heading">Before you begin...</h2>

      {verse && <VerseCard verse={verse} />}

      {settings.scriptureEnabled && reflection && (
        <p className="reflection-prompt">{reflection}</p>
      )}

      <button className="btn-primary" onClick={onBeginFocus}>
        Start Focus
      </button>
    </div>
  );
}

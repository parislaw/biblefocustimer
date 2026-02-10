import React from 'react';
import VerseCard from './VerseCard';

export default function PreFocusView({ verse, reflection, settings, onBeginFocus }) {
  return (
    <div className="view prefocus-view" role="main" aria-label="Prepare for focus session">
      <h2 className="view-heading">Before you begin...</h2>

      {verse && (
        <article role="article" aria-label="Focus verse">
          <VerseCard verse={verse} />
        </article>
      )}

      {settings.scriptureEnabled && reflection && (
        <p className="reflection-prompt" role="doc-tip" aria-label="Reflection prompt">
          {reflection}
        </p>
      )}

      <button
        className="btn-primary"
        onClick={onBeginFocus}
        aria-label="Start focus session"
        title="Start Focus Session (Enter)"
      >
        Start Focus
      </button>
    </div>
  );
}

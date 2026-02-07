import { useState, useCallback } from 'react';
import verses from '../data/verses';
import reflections from '../data/reflections';

/**
 * Simple deterministic hash from a string to a number.
 * Used to pick the same verse for a given date.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Hook to manage verse selection based on theme, translation, and verse mode settings.
 */
export function useVerse(settings) {
  const [currentVerse, setCurrentVerse] = useState(null);
  const [currentReflection, setCurrentReflection] = useState('');

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getFilteredVerses = useCallback(() => {
    if (settings.theme === 'random') {
      return verses;
    }
    const themed = verses.filter((v) => v.theme === settings.theme);
    return themed.length > 0 ? themed : verses;
  }, [settings.theme]);

  const selectVerse = useCallback(() => {
    const pool = getFilteredVerses();
    const translation = settings.translation || 'esv';

    let verse;
    if (settings.verseMode === 'daily') {
      // Deterministic: same verse all day for the same theme
      const seed = todayKey() + ':' + (settings.theme || 'random');
      const index = hashString(seed) % pool.length;
      verse = pool[index];
    } else {
      verse = pickRandom(pool);
    }

    setCurrentVerse({
      reference: verse.reference,
      text: verse[translation] || verse.esv,
      translation: translation.toUpperCase(),
    });
  }, [getFilteredVerses, settings.translation, settings.verseMode, settings.theme]);

  const selectReflection = useCallback((type) => {
    const pool = type === 'break' ? reflections.breakTime : reflections.preFocus;

    if (settings.verseMode === 'daily') {
      // Rotate through reflections based on date + type
      const seed = todayKey() + ':' + type;
      const index = hashString(seed) % pool.length;
      setCurrentReflection(pool[index]);
    } else {
      setCurrentReflection(pickRandom(pool));
    }
  }, [settings.verseMode]);

  return {
    currentVerse,
    currentReflection,
    selectVerse,
    selectReflection,
  };
}

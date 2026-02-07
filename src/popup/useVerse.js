import { useState, useCallback } from 'react';
import verses from '../data/verses';
import reflections from '../data/reflections';

/**
 * Hook to manage verse selection based on theme and translation settings.
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

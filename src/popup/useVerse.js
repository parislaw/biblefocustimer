import { useState, useCallback, useEffect } from 'react';
import verses from '../data/verses';
import reflections from '../data/reflections';
import { getCustomVerses } from './customVerseStorage';

/**
 * Pick a random element from an array
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Hook to manage verse selection based on theme and translation settings.
 * Merges custom verses with curated verses.
 */
export function useVerse(settings) {
  const [currentVerse, setCurrentVerse] = useState(null);
  const [currentReflection, setCurrentReflection] = useState('');
  const [customVerses, setCustomVerses] = useState([]);

  // Load custom verses on mount
  useEffect(() => {
    getCustomVerses((loadedVerses) => {
      setCustomVerses(loadedVerses || []);
    });
  }, []);

  const getFilteredVerses = useCallback(() => {
    // Combine curated + custom verses
    const allVerses = [...verses, ...customVerses];

    if (settings.theme === 'random') {
      return allVerses;
    }

    if (settings.theme === 'custom') {
      return customVerses.length > 0 ? customVerses : verses;
    }

    const themed = allVerses.filter((v) => v.theme === settings.theme);
    return themed.length > 0 ? themed : allVerses;
  }, [settings.theme, customVerses]);

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

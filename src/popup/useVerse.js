import { useState, useCallback, useEffect } from 'react';
import { usePlatform } from '../platform';
import verses from '../data/verses';
import reflections from '../data/reflections';

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Hook to manage verse selection and custom verses via platform.
 */
export function useVerse(settings) {
  const platform = usePlatform();
  const [currentVerse, setCurrentVerse] = useState(null);
  const [currentReflection, setCurrentReflection] = useState('');
  const [customVerses, setCustomVerses] = useState([]);

  useEffect(() => {
    platform.getCustomVerses((loadedVerses) => {
      setCustomVerses(loadedVerses || []);
    });

    const removeListener = platform.addCustomVersesListener?.((next) => {
      setCustomVerses(Array.isArray(next) ? next : []);
    });
    return () => { if (removeListener) removeListener(); };
  }, [platform]);

  const persistCustomVerses = useCallback((versesList, callback) => {
    platform.setCustomVerses(versesList, () => {
      setCustomVerses(versesList);
      if (callback) callback();
    });
  }, [platform]);

  const getFilteredVerses = useCallback(() => {
    const allVerses = [...verses, ...customVerses];

    if (settings.theme === 'random') return allVerses;
    if (settings.theme === 'custom') return customVerses.length > 0 ? customVerses : verses;

    const themed = allVerses.filter((v) => v.theme === settings.theme);
    return themed.length > 0 ? themed : allVerses;
  }, [settings.theme, customVerses]);

  const selectVerse = useCallback(() => {
    const pool = getFilteredVerses();
    if (pool.length === 0) {
      setCurrentVerse(null);
      return;
    }
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
    customVerses,
    persistCustomVerses,
    selectVerse,
    selectReflection,
  };
}

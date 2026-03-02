import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './useStorage';
import { useTimer } from './useTimer';
import { useVerse } from './useVerse';
import IdleView from './components/IdleView';
import PreFocusView from './components/PreFocusView';
import FocusView from './components/FocusView';
import BreakView from './components/BreakView';
import SettingsView from './components/SettingsView';

const isWeb = typeof window !== 'undefined' && !window.chrome?.runtime?.id;

function isFormElement(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  const role = (target.getAttribute && target.getAttribute('role')) || '';
  return tag === 'input' || tag === 'select' || tag === 'textarea' || role === 'combobox' || target.isContentEditable;
}

export default function App() {
  const { settings, updateSettings, loaded } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const timer = useTimer(settings);
  const verse = useVerse(settings);

  const handleStartFocus = useCallback(() => {
    verse.selectVerse();
    verse.selectReflection('preFocus');
    timer.startFocusSession();
  }, [verse, timer]);

  const handleBeginFocus = useCallback(() => {
    timer.beginFocusFromPreFocus();
  }, [timer]);

  const handleBreakVerse = useCallback(() => {
    if (settings.scriptureEnabled) {
      verse.selectVerse();
      verse.selectReflection('break');
    }
  }, [settings.scriptureEnabled, verse]);

  const handleQuickFocus = useCallback((minutes) => {
    timer.startFocusWithDuration(minutes);
  }, [timer]);

  const handleQuickBreak = useCallback((minutes) => {
    timer.startBreakWithDuration(minutes);
  }, [timer]);

  const urlPresetApplied = useRef(false);
  useEffect(() => {
    if (!loaded || !isWeb || urlPresetApplied.current) return;
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('preset');
    const minutesParam = params.get('minutes');
    const minutes = minutesParam ? parseInt(minutesParam, 10) : null;
    if (preset === 'focus' || (minutes != null && minutes > 0 && !preset)) {
      const mins = minutes != null && minutes > 0 ? Math.min(120, minutes) : settings.focusDuration;
      urlPresetApplied.current = true;
      timer.startFocusWithDuration(mins);
      window.history.replaceState({}, '', window.location.pathname || '/');
    } else if (preset === 'break') {
      const mins = minutes != null && minutes > 0 ? Math.min(60, minutes) : settings.shortBreakDuration;
      urlPresetApplied.current = true;
      timer.startBreakWithDuration(mins);
      window.history.replaceState({}, '', window.location.pathname || '/');
    }
  }, [loaded, isWeb, settings.focusDuration, settings.shortBreakDuration, timer]);

  useEffect(() => {
    if (!loaded) return;

    const handleKeyDown = (e) => {
      if (isFormElement(e.target)) return;

      if (showSettings) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSettings(false);
        }
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (timer.phase === 'focus' || timer.phase === 'break') {
            if (timer.isRunning) timer.pause();
            else timer.resume();
          }
          break;
        case 'r':
        case 'R':
          if (timer.phase === 'focus') {
            e.preventDefault();
            timer.reset();
          }
          break;
        case 's':
        case 'S':
          if (e.altKey) {
            e.preventDefault();
            setShowSettings(true);
          } else if (timer.phase === 'break') {
            e.preventDefault();
            timer.skipBreak();
          }
          break;
        case 'Enter':
          if (timer.phase === 'idle') {
            e.preventDefault();
            handleStartFocus();
          } else if (timer.phase === 'preFocus') {
            e.preventDefault();
            handleBeginFocus();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loaded, showSettings, timer, handleStartFocus, handleBeginFocus]);

  if (!loaded) {
    return (
      <div className="app loading" role="status" aria-label="Loading Selah Focus">
        <div className="loading-text">Selah...</div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="app">
        <SettingsView
          settings={settings}
          updateSettings={updateSettings}
          customVerses={verse.customVerses}
          persistCustomVerses={verse.persistCustomVerses}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  return (
    <div className={`app phase-${timer.phase}`} role="main">
      {timer.phase === 'idle' && (
        <IdleView
          settings={settings}
          verse={verse}
          cycleCount={timer.cycleCount}
          onStartFocus={handleStartFocus}
          onOpenSettings={() => setShowSettings(true)}
          isWeb={isWeb}
          onQuickFocus={handleQuickFocus}
          onQuickBreak={handleQuickBreak}
        />
      )}

      {timer.phase === 'preFocus' && (
        <PreFocusView
          verse={verse.currentVerse}
          reflection={verse.currentReflection}
          settings={settings}
          onBeginFocus={handleBeginFocus}
        />
      )}

      {timer.phase === 'focus' && (
        <FocusView
          secondsLeft={timer.secondsLeft}
          isRunning={timer.isRunning}
          cycleCount={timer.cycleCount}
          cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
          sessionTotalSeconds={timer.sessionTotalSeconds}
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={timer.reset}
        />
      )}

      {timer.phase === 'break' && (
        <BreakView
          secondsLeft={timer.secondsLeft}
          isRunning={timer.isRunning}
          isLongBreak={timer.isLongBreak}
          cycleCount={timer.cycleCount}
          sessionTotalSeconds={timer.sessionTotalSeconds}
          verse={verse.currentVerse}
          reflection={verse.currentReflection}
          settings={settings}
          onPause={timer.pause}
          onResume={timer.resume}
          onSkipBreak={timer.skipBreak}
          selectVerse={verse.selectVerse}
          selectReflection={verse.selectReflection}
        />
      )}
    </div>
  );
}

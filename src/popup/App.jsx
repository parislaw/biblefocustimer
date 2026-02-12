import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from './useStorage';
import { useTimer } from './useTimer';
import { useVerse } from './useVerse';
import IdleView from './components/IdleView';
import PreFocusView from './components/PreFocusView';
import FocusView from './components/FocusView';
import BreakView from './components/BreakView';
import SettingsView from './components/SettingsView';

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

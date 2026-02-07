import React, { useState } from 'react';
import { useSettings } from './useStorage';
import { useTimer } from './useTimer';
import { useVerse } from './useVerse';
import IdleView from './components/IdleView';
import PreFocusView from './components/PreFocusView';
import FocusView from './components/FocusView';
import BreakView from './components/BreakView';
import SettingsView from './components/SettingsView';

export default function App() {
  const { settings, updateSettings, loaded } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const timer = useTimer(settings);
  const verse = useVerse(settings);

  if (!loaded) {
    return (
      <div className="app loading">
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

  const handleStartFocus = () => {
    verse.selectVerse();
    verse.selectReflection('preFocus');
    timer.startFocusSession();
  };

  const handleBeginFocus = () => {
    timer.beginFocusFromPreFocus();
  };

  const handleBreakVerse = () => {
    if (settings.scriptureEnabled) {
      verse.selectVerse();
      verse.selectReflection('break');
    }
  };

  return (
    <div className={`app phase-${timer.phase}`}>
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
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={timer.reset}
          onBreakStart={handleBreakVerse}
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

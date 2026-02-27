import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PlatformProvider } from '../platform';
import { createMockPlatform } from './testPlatform';
import { useTimer } from './useTimer';

const defaultSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  scriptureEnabled: false,
};

const wrapper = ({ children }) => (
  <PlatformProvider platform={createMockPlatform()}>
    {children}
  </PlatformProvider>
);

describe('useTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase', () => {
    const { result } = renderHook(() => useTimer(defaultSettings), { wrapper });
    expect(result.current.phase).toBe('idle');
    expect(result.current.secondsLeft).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.cycleCount).toBe(0);
  });

  it('startFocusSession with scripture disabled goes to focus and starts running', () => {
    const { result } = renderHook(() => useTimer(defaultSettings), { wrapper });
    act(() => {
      result.current.startFocusSession();
    });
    expect(result.current.phase).toBe('focus');
    expect(result.current.isRunning).toBe(true);
    expect(result.current.secondsLeft).toBe(25 * 60);
  });

  it('pause stops the timer', () => {
    const { result } = renderHook(() => useTimer(defaultSettings), { wrapper });
    act(() => {
      result.current.startFocusSession();
    });
    expect(result.current.isRunning).toBe(true);
    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);
  });

  it('reset returns to idle and zeroes cycleCount', () => {
    const { result } = renderHook(() => useTimer(defaultSettings), { wrapper });
    act(() => {
      result.current.startFocusSession();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.phase).toBe('idle');
    expect(result.current.cycleCount).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('countdown decreases secondsLeft every second', () => {
    const { result } = renderHook(() => useTimer(defaultSettings), { wrapper });
    act(() => {
      result.current.startFocusSession();
    });
    const initial = result.current.secondsLeft;
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.secondsLeft).toBe(initial - 5);
  });

  it('skipBreak returns to idle', () => {
    const { result } = renderHook(() => useTimer(defaultSettings), { wrapper });
    act(() => {
      result.current.startFocusSession();
    });
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    expect(result.current.phase).toBe('break');
    act(() => {
      result.current.skipBreak();
    });
    expect(result.current.phase).toBe('idle');
  });
});

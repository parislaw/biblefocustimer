import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PlatformProvider } from '../platform';
import { createMockPlatform } from './testPlatform';
import { useSettings, DEFAULT_SETTINGS } from './useStorage';

const wrapper = ({ children }) => (
  <PlatformProvider platform={createMockPlatform()}>
    {children}
  </PlatformProvider>
);

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings and loaded true when storage is empty', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(result.current.loaded).toBe(true);
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('updateSettings merges with current settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => {
      result.current.updateSettings({ focusDuration: 30 });
    });
    expect(result.current.settings.focusDuration).toBe(30);
    expect(result.current.settings.shortBreakDuration).toBe(DEFAULT_SETTINGS.shortBreakDuration);
  });

  it('updateSettings merges multiple keys', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => {
      result.current.updateSettings({ theme: 'peace', focusDuration: 20 });
    });
    expect(result.current.settings.theme).toBe('peace');
    expect(result.current.settings.focusDuration).toBe(20);
  });
});

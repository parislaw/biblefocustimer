import React, { createContext, useContext } from 'react';

const PlatformContext = createContext(null);

export function PlatformProvider({ platform, children }) {
  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const platform = useContext(PlatformContext);
  if (!platform) throw new Error('usePlatform must be used within PlatformProvider');
  return platform;
}

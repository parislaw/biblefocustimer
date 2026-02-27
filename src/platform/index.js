/**
 * Platform abstraction: Chrome extension vs standalone web.
 * Each entry point (popup vs web) injects its implementation via PlatformProvider.
 */

export { chromePlatform } from './chromePlatform';
export { webPlatform } from './webPlatform';
export { PlatformProvider, usePlatform } from './context';

import { useMemo } from 'react';

/**
 * Hook to detect the current platform/environment
 * Returns information about whether we're in Electron, browser, mobile, etc.
 */
export function usePlatform() {
  return useMemo(() => {
    const isElectron = typeof window !== 'undefined' && !!window.electron;
    const isBrowser = typeof window !== 'undefined' && !window.electron;
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isDesktop = !isMobile;
    
    // OS Detection
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const isWindows = /Windows/.test(userAgent);
    const isMac = /Mac/.test(userAgent);
    const isLinux = /Linux/.test(userAgent) && !(/Android/.test(userAgent));

    return {
      isElectron,
      isBrowser,
      isMobile,
      isDesktop,
      isWindows,
      isMac,
      isLinux,
      // Feature flags
      canMinimize: isElectron,
      canClose: isElectron,
      canPin: isElectron,
      canDock: isElectron,
      hasNativeClipboard: isElectron,
    };
  }, []);
}

export default usePlatform;

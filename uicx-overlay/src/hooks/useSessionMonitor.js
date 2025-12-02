import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook to monitor session health and auto-refresh when needed
 */
function useSessionMonitor() {
  const { 
    isAuthenticated, 
    session, 
    sessionStatus,
    updateLastActivity,
    refreshSession,
    isSessionValid
  } = useAuthStore();

  // Update last activity on user interaction
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      updateLastActivity();
    }
  }, [isAuthenticated, updateLastActivity]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Throttle activity updates
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // Update every minute max
        lastUpdate = now;
        handleActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
    };
  }, [isAuthenticated, handleActivity]);

  // Auto-refresh session when approaching expiry
  useEffect(() => {
    if (!isAuthenticated || !session) return;

    const checkAndRefresh = async () => {
      if (!isSessionValid()) {
        console.log('Session approaching expiry, refreshing...');
        await refreshSession();
      }
    };

    // Check every 4 minutes
    const interval = setInterval(checkAndRefresh, 4 * 60 * 1000);
    
    // Also check immediately
    checkAndRefresh();

    return () => clearInterval(interval);
  }, [isAuthenticated, session, isSessionValid, refreshSession]);

  // Handle visibility change (tab focus)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, check session
        if (!isSessionValid()) {
          console.log('Tab visible, session needs refresh');
          await refreshSession();
        }
        updateLastActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, isSessionValid, refreshSession, updateLastActivity]);

  return {
    sessionStatus,
    isSessionValid: isSessionValid()
  };
}

export default useSessionMonitor;

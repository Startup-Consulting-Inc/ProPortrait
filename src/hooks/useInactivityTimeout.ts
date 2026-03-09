import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInactivityTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onLogout: () => void;
  onWarning: () => void;
  onDismissWarning?: () => void;
  disabled?: boolean;
}

/**
 * Hook to track user inactivity and trigger logout after timeout.
 * Resets timer on mouse move, key press, scroll, and touch events.
 * Pauses timer when tab is hidden.
 */
export function useInactivityTimeout({
  timeoutMinutes = 15,
  warningMinutes = 1,
  onLogout,
  onWarning,
  onDismissWarning,
  disabled = false,
}: UseInactivityTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;
  const warningThreshold = timeoutMs - warningMs;

  const activityTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (activityTimerRef.current) {
      window.clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    onLogout();
  }, [clearTimers, onLogout]);

  const showWarningCallback = useCallback(() => {
    setShowWarning(true);
    onWarning();
  }, [onWarning]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    onDismissWarning?.();
  }, [onDismissWarning]);

  const resetTimer = useCallback(() => {
    if (disabled) return;

    // Don't reset if warning is showing (user must actively dismiss or be logged out)
    if (showWarning) return;

    clearTimers();
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningTimerRef.current = window.setTimeout(() => {
      showWarningCallback();
    }, warningThreshold);

    // Set logout timer
    activityTimerRef.current = window.setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [clearTimers, disabled, logout, showWarning, showWarningCallback, timeoutMs, warningThreshold]);

  // Handle user activity events
  useEffect(() => {
    if (disabled) {
      clearTimers();
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      clearTimers();
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [disabled, clearTimers, resetTimer]);

  // Handle tab visibility (pause timer when tab is hidden)
  useEffect(() => {
    if (disabled) return;

    let hiddenTime: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - clear timers
        hiddenTime = Date.now();
        clearTimers();
      } else {
        // Tab visible again
        if (hiddenTime && showWarning) {
          // If warning was showing, check if we should logout
          const elapsed = Date.now() - hiddenTime;
          if (elapsed >= warningMs) {
            logout();
          } else {
            // Restart warning timer with remaining time
            warningTimerRef.current = window.setTimeout(() => {
              logout();
            }, warningMs - elapsed);
          }
        } else if (hiddenTime) {
          // Check if we've exceeded timeout while away
          const elapsed = Date.now() - hiddenTime;
          if (elapsed >= timeoutMs - (Date.now() - lastActivityRef.current)) {
            logout();
          } else {
            resetTimer();
          }
        }
        hiddenTime = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [disabled, clearTimers, logout, resetTimer, showWarning, timeoutMs, warningMs]);

  return {
    showWarning,
    dismissWarning,
    resetTimer,
    logout,
  };
}

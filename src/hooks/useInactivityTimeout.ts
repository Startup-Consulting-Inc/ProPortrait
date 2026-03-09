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
 * Works correctly even when tab is hidden (uses elapsed time check).
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

  // Use refs to track state without causing re-renders
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const logoutTimerRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (checkIntervalRef.current) {
      window.clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    warningShownRef.current = false;
    onLogout();
  }, [clearTimers, onLogout]);

  const showWarningCallback = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      setShowWarning(true);
      onWarning();
    }
  }, [onWarning]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    warningShownRef.current = false;
    onDismissWarning?.();
  }, [onDismissWarning]);

  // Check if we should logout or show warning based on elapsed time
  const checkElapsedTime = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastActivityRef.current;

    // If we've exceeded total timeout, logout
    if (elapsed >= timeoutMs) {
      logout();
      return;
    }

    // If we've exceeded warning threshold, show warning
    if (elapsed >= timeoutMs - warningMs && !warningShownRef.current) {
      showWarningCallback();
    }
  }, [logout, showWarningCallback, timeoutMs, warningMs]);

  const resetTimer = useCallback(() => {
    if (disabled) return;

    // Don't reset if warning is showing (user must actively dismiss or be logged out)
    if (showWarning) return;

    clearTimers();
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // Set up periodic checks (every 10 seconds) to handle tab visibility changes
    checkIntervalRef.current = window.setInterval(() => {
      checkElapsedTime();
    }, 10000);

    // Set main logout timer
    logoutTimerRef.current = window.setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [clearTimers, checkElapsedTime, disabled, logout, showWarning, timeoutMs]);

  // Handle user activity events
  useEffect(() => {
    if (disabled) {
      clearTimers();
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      // Only reset if warning is not showing, or if user clicks "Stay Logged In"
      if (!showWarning) {
        resetTimer();
      }
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
  }, [disabled, clearTimers, resetTimer, showWarning]);

  // Handle tab visibility - check elapsed time when tab becomes visible
  useEffect(() => {
    if (disabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - check if we should have logged out
        checkElapsedTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [disabled, checkElapsedTime]);

  return {
    showWarning,
    dismissWarning,
    resetTimer,
    logout,
  };
}

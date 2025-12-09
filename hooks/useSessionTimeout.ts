"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface UseSessionTimeoutOptions {
  /** Time in milliseconds before showing warning (default: 14 minutes) */
  warningTime?: number;
  /** Time in milliseconds before auto-logout (default: 15 minutes) */
  timeoutTime?: number;
  /** Interval to check for inactivity (default: 1 minute) */
  checkInterval?: number;
  /** Events to track for user activity */
  activityEvents?: string[];
}

interface SessionTimeoutState {
  showWarning: boolean;
  timeRemaining: number;
  isActive: boolean;
}

export function useSessionTimeout(
  onTimeout: () => void,
  options: UseSessionTimeoutOptions = {}
) {
  const {
    warningTime = 14 * 60 * 1000, // 14 minutes
    timeoutTime = 15 * 60 * 1000, // 15 minutes
    checkInterval = 60 * 1000, // 1 minute
    activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "visibilitychange",
      "focus",
    ],
  } = options;

  const [state, setState] = useState<SessionTimeoutState>({
    showWarning: false,
    timeRemaining: 0,
    isActive: true,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (warningShownRef.current) {
      // User is active again, hide warning
      warningShownRef.current = false;
      setState({
        showWarning: false,
        timeRemaining: 0,
        isActive: true,
      });
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, []);

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;

    if (timeSinceActivity >= timeoutTime) {
      // Timeout reached, logout
      setState({
        showWarning: false,
        timeRemaining: 0,
        isActive: false,
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      onTimeout();
    } else if (timeSinceActivity >= warningTime && !warningShownRef.current) {
      // Show warning
      warningShownRef.current = true;
      const remaining = timeoutTime - timeSinceActivity;
      setState({
        showWarning: true,
        timeRemaining: remaining,
        isActive: true,
      });

      // Start countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      countdownRef.current = setInterval(() => {
        const currentTimeSinceActivity = Date.now() - lastActivityRef.current;
        const currentRemaining = timeoutTime - currentTimeSinceActivity;

        if (currentRemaining <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          onTimeout();
        } else {
          setState((prev) => ({
            ...prev,
            timeRemaining: currentRemaining,
          }));
        }
      }, 1000); // Update every second
    }
  }, [warningTime, timeoutTime, onTimeout]);

  useEffect(() => {
    // Set initial activity time
    lastActivityRef.current = Date.now();

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      if (event === "visibilitychange") {
        document.addEventListener(event, updateActivity, { passive: true });
      } else {
        window.addEventListener(event, updateActivity, { passive: true });
      }
    });

    // Start checking for inactivity
    intervalRef.current = setInterval(checkInactivity, checkInterval);

    // Initial check
    checkInactivity();

    return () => {
      // Cleanup
      activityEvents.forEach((event) => {
        if (event === "visibilitychange") {
          document.removeEventListener(event, updateActivity);
        } else {
          window.removeEventListener(event, updateActivity);
        }
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [activityEvents, updateActivity, checkInactivity, checkInterval]);

  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  return {
    showWarning: state.showWarning,
    timeRemaining: state.timeRemaining,
    extendSession,
  };
}


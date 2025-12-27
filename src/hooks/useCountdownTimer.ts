/**
 * useCountdownTimer Hook
 *
 * Reusable countdown timer hook consolidating duplicated implementations in:
 * - SurvivalGame.tsx (lines 716-752)
 * - CharacterQuiz.tsx (lines 228-241)
 *
 * Features:
 * - Configurable update interval
 * - Pause/resume support
 * - Reset with optional new duration
 * - Percentage calculation for progress bars
 * - Stable callback handling
 *
 * @module hooks/useCountdownTimer
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for the countdown timer hook.
 */
export interface UseCountdownTimerOptions {
  /** Initial time in milliseconds */
  initialTimeMs: number;
  /** Callback when timer reaches zero */
  onTimeout?: () => void;
  /** Update interval in milliseconds (default: 50) */
  updateIntervalMs?: number;
  /** Whether to start immediately (default: false) */
  autoStart?: boolean;
}

/**
 * Result returned by the countdown timer hook.
 */
export interface UseCountdownTimerResult {
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Time remaining as percentage (0-100) */
  timePercent: number;
  /** Whether timer is currently running */
  isRunning: boolean;
  /** Whether timer has expired */
  isExpired: boolean;
  /** Start or resume the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Reset timer to initial time (stops if running). Optionally set new time. */
  reset: (newTimeMs?: number) => void;
  /** Stop timer and mark as not expired */
  stop: () => void;
}

/**
 * A reusable countdown timer hook with pause, resume, and reset capabilities.
 *
 * @example
 * ```tsx
 * const timer = useCountdownTimer({
 *   initialTimeMs: 5000,
 *   onTimeout: () => console.log('Time up!'),
 *   autoStart: true,
 * });
 *
 * // In JSX
 * <div style={{ width: `${timer.timePercent}%` }} />
 * <span>{(timer.timeRemaining / 1000).toFixed(1)}s</span>
 *
 * // Control methods
 * timer.pause();
 * timer.start();
 * timer.reset(); // Reset to initialTimeMs
 * timer.reset(10000); // Reset to new time
 * ```
 */
export function useCountdownTimer(options: UseCountdownTimerOptions): UseCountdownTimerResult {
  const {
    initialTimeMs,
    onTimeout,
    updateIntervalMs = 50,
    autoStart = false,
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(initialTimeMs);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  // Track the base time for percentage calculation (state for render access)
  const [baseTimeMs, setBaseTimeMs] = useState(initialTimeMs);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingAtPauseRef = useRef<number>(initialTimeMs);
  const onTimeoutRef = useRef(onTimeout);

  // Keep onTimeout ref updated without triggering effect re-runs
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Main timer logic
  useEffect(() => {
    if (!isRunning || isExpired) {
      return;
    }

    // Handle edge case: 0ms timer should immediately expire
    // Use setTimeout to defer state updates and avoid sync setState in effect
    if (remainingAtPauseRef.current <= 0) {
      const timeoutId = setTimeout(() => {
        setTimeRemaining(0);
        setIsRunning(false);
        setIsExpired(true);
        onTimeoutRef.current?.();
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingAtPauseRef.current - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setIsExpired(true);
        onTimeoutRef.current?.();
      }
    }, updateIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isExpired, updateIntervalMs]);

  const start = useCallback(() => {
    if (isExpired) return;
    remainingAtPauseRef.current = timeRemaining;
    setIsRunning(true);
  }, [isExpired, timeRemaining]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    remainingAtPauseRef.current = timeRemaining;
    setIsRunning(false);
  }, [timeRemaining]);

  const reset = useCallback((newTimeMs?: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const time = newTimeMs ?? initialTimeMs;
    if (newTimeMs !== undefined) {
      setBaseTimeMs(newTimeMs);
    }
    setTimeRemaining(time);
    remainingAtPauseRef.current = time;
    setIsRunning(false);
    setIsExpired(false);
  }, [initialTimeMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsExpired(false);
  }, []);

  // Calculate percentage based on base time
  const timePercent = baseTimeMs > 0
    ? (timeRemaining / baseTimeMs) * 100
    : 0;

  return {
    timeRemaining,
    timePercent,
    isRunning,
    isExpired,
    start,
    pause,
    reset,
    stop,
  };
}

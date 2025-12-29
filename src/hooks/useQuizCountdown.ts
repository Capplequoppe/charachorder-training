/**
 * useQuizCountdown Hook
 *
 * Manages quiz countdown state and timer logic for training components.
 * Provides a countdown that ticks down when active in quiz phase.
 *
 * @module hooks
 */

import { useState, useEffect, useCallback } from 'react';
import type { TrainingPhase } from './useTrainingPhase';

/**
 * Options for useQuizCountdown hook.
 */
export interface UseQuizCountdownOptions {
  /** Current training phase */
  phase: TrainingPhase;
  /** Initial countdown value (default: 3) */
  initialValue?: number;
}

/**
 * Result returned by useQuizCountdown hook.
 */
export interface UseQuizCountdownResult {
  /** Current countdown value (null = not counting, 0 = finished) */
  quizCountdown: number | null;
  /** Whether countdown is active (counting down) */
  isCountingDown: boolean;
  /** Whether countdown has finished */
  isCountdownComplete: boolean;
  /** Start the countdown */
  startCountdown: (value?: number) => void;
  /** Reset countdown to null */
  resetCountdown: () => void;
}

/**
 * Hook for managing quiz countdown timer.
 *
 * @example
 * ```tsx
 * const {
 *   quizCountdown,
 *   isCountingDown,
 *   isCountdownComplete,
 *   startCountdown,
 * } = useQuizCountdown({ phase: phaseControl.phase });
 *
 * // Start countdown when entering quiz mode
 * const handleModeSelect = (mode) => {
 *   if (mode === 'review-all') {
 *     startCountdown(3);
 *     phaseControl.goToQuiz();
 *   }
 * };
 *
 * // Enable input only after countdown completes
 * const input = useChordInput({
 *   enabled: phase === 'quiz' && isCountdownComplete,
 * });
 * ```
 */
export function useQuizCountdown({
  phase,
  initialValue = 3,
}: UseQuizCountdownOptions): UseQuizCountdownResult {
  const [quizCountdown, setQuizCountdown] = useState<number | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (phase !== 'quiz' || quizCountdown === null || quizCountdown <= 0) return;

    const timer = setTimeout(() => {
      setQuizCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, quizCountdown]);

  // Start countdown
  const startCountdown = useCallback((value?: number) => {
    setQuizCountdown(value ?? initialValue);
  }, [initialValue]);

  // Reset countdown
  const resetCountdown = useCallback(() => {
    setQuizCountdown(null);
  }, []);

  // Derived state
  const isCountingDown = quizCountdown !== null && quizCountdown > 0;
  const isCountdownComplete = quizCountdown === 0;

  return {
    quizCountdown,
    isCountingDown,
    isCountdownComplete,
    startCountdown,
    resetCountdown,
  };
}

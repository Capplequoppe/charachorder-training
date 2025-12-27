/**
 * useTrainingPhase Hook
 *
 * Manages training phase transitions with state machine semantics.
 * Ensures only valid transitions occur for each training mode.
 *
 * Phase sequences by mode:
 * - learn: mode-select → intro → sync-practice → practice → complete
 * - review-due/review-all: mode-select → quiz → complete
 * - survival: mode-select → survival
 * - boss: mode-select → boss
 * - journey: mode-select → journey
 *
 * @module hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrainingMode, TrainingPhase } from '../domain';
import { PHASE_TRANSITION_DELAY_MS } from '../domain';

/**
 * Options for useTrainingPhase hook.
 */
export interface UseTrainingPhaseOptions {
  /** Current training mode */
  mode: TrainingMode;
  /** Initial phase (defaults to 'mode-select') */
  initialPhase?: TrainingPhase;
  /** Whether to include sync practice for power chords */
  includeSyncPractice?: boolean;
  /** Callback when phase changes */
  onPhaseChange?: (from: TrainingPhase, to: TrainingPhase) => void;
}

/**
 * Result returned by useTrainingPhase hook.
 */
export interface UseTrainingPhaseResult {
  /** Current phase */
  phase: TrainingPhase;

  /** Direct phase setter (use with caution - prefer transition functions) */
  setPhase: (phase: TrainingPhase) => void;

  // Phase transitions
  goToIntro: () => void;
  goToSyncPractice: () => void;
  goToPractice: () => void;
  goToQuiz: () => void;
  goToComplete: () => void;
  goToModeSelect: () => void;
  goToSurvival: () => void;
  goToBoss: () => void;
  goToJourney: () => void;

  // Delayed transitions
  goToIntroDelayed: (delayMs?: number) => void;
  goToPracticeDelayed: (delayMs?: number) => void;
  goToCompleteDelayed: (delayMs?: number) => void;

  // Phase queries
  canGoToPhase: (phase: TrainingPhase) => boolean;
  isActivePhase: (phase: TrainingPhase) => boolean;
  getPhaseSequence: () => TrainingPhase[];

  // Mode helpers
  isSurvivalMode: boolean;
  isBossMode: boolean;
  isJourneyMode: boolean;
  isQuizMode: boolean;
  isLearnMode: boolean;

  // Reset
  reset: () => void;
}

/**
 * Valid transitions for each mode.
 */
const MODE_TRANSITIONS: Record<TrainingMode, Record<TrainingPhase, TrainingPhase[]>> = {
  learn: {
    'mode-select': ['intro', 'journey'],
    'intro': ['sync-practice', 'practice'],
    'sync-practice': ['practice'],
    'practice': ['intro', 'complete'],
    'quiz': [],
    'complete': ['mode-select'],
    'survival': [],
    'boss': [],
    'journey': ['mode-select'],
  },
  'review-due': {
    'mode-select': ['quiz', 'journey'],
    'intro': [],
    'sync-practice': [],
    'practice': [],
    'quiz': ['complete'],
    'complete': ['mode-select'],
    'survival': [],
    'boss': [],
    'journey': ['mode-select'],
  },
  'review-all': {
    'mode-select': ['quiz', 'journey'],
    'intro': [],
    'sync-practice': [],
    'practice': [],
    'quiz': ['complete'],
    'complete': ['mode-select'],
    'survival': [],
    'boss': [],
    'journey': ['mode-select'],
  },
  survival: {
    'mode-select': ['survival'],
    'intro': [],
    'sync-practice': [],
    'practice': [],
    'quiz': [],
    'complete': ['mode-select'],
    'survival': ['complete', 'mode-select'],
    'boss': [],
    'journey': [],
  },
  boss: {
    'mode-select': ['boss'],
    'intro': [],
    'sync-practice': [],
    'practice': [],
    'quiz': [],
    'complete': ['mode-select'],
    'survival': [],
    'boss': ['complete', 'mode-select'],
    'journey': [],
  },
};

/**
 * Phase sequence for each mode (for UI display).
 */
const MODE_PHASE_SEQUENCE: Record<TrainingMode, TrainingPhase[]> = {
  learn: ['mode-select', 'intro', 'sync-practice', 'practice', 'complete'],
  'review-due': ['mode-select', 'quiz', 'complete'],
  'review-all': ['mode-select', 'quiz', 'complete'],
  survival: ['mode-select', 'survival'],
  boss: ['mode-select', 'boss'],
};

/**
 * Hook for managing training phase transitions.
 *
 * @example
 * ```tsx
 * const {
 *   phase,
 *   goToIntro,
 *   goToPractice,
 *   goToComplete,
 *   canGoToPhase,
 * } = useTrainingPhase({
 *   mode: 'learn',
 *   onPhaseChange: (from, to) => console.log(`${from} → ${to}`),
 * });
 * ```
 */
export function useTrainingPhase(options: UseTrainingPhaseOptions): UseTrainingPhaseResult {
  const {
    mode,
    initialPhase = 'mode-select',
    includeSyncPractice = true,
    onPhaseChange,
  } = options;

  const [phase, setPhaseInternal] = useState<TrainingPhase>(initialPhase);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousModeRef = useRef<TrainingMode>(mode);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset to mode-select when mode changes
  useEffect(() => {
    if (mode !== previousModeRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset state when mode prop changes
      setPhaseInternal('mode-select');
      previousModeRef.current = mode;
    }
  }, [mode]);

  /**
   * Check if a transition is valid.
   */
  const canGoToPhase = useCallback(
    (targetPhase: TrainingPhase): boolean => {
      const transitions = MODE_TRANSITIONS[mode]?.[phase];
      return transitions?.includes(targetPhase) ?? false;
    },
    [mode, phase]
  );

  /**
   * Set phase with validation and callback.
   */
  const setPhase = useCallback(
    (newPhase: TrainingPhase) => {
      const oldPhase = phase;
      setPhaseInternal(newPhase);
      if (onPhaseChange && oldPhase !== newPhase) {
        onPhaseChange(oldPhase, newPhase);
      }
    },
    [phase, onPhaseChange]
  );

  /**
   * Transition to a phase with validation.
   */
  const transitionTo = useCallback(
    (targetPhase: TrainingPhase, force = false) => {
      if (!force && !canGoToPhase(targetPhase)) {
        if (import.meta.env.DEV) {
          console.warn(
            `useTrainingPhase: Invalid transition from "${phase}" to "${targetPhase}" in mode "${mode}"`
          );
        }
        return;
      }
      setPhase(targetPhase);
    },
    [canGoToPhase, setPhase, phase, mode]
  );

  /**
   * Transition with delay.
   */
  const transitionToDelayed = useCallback(
    (targetPhase: TrainingPhase, delayMs = PHASE_TRANSITION_DELAY_MS) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        transitionTo(targetPhase);
        timeoutRef.current = null;
      }, delayMs);
    },
    [transitionTo]
  );

  // Transition functions
  const goToModeSelect = useCallback(() => {
    // Always allow going back to mode-select
    setPhase('mode-select');
  }, [setPhase]);

  const goToIntro = useCallback(() => {
    transitionTo('intro');
  }, [transitionTo]);

  const goToSyncPractice = useCallback(() => {
    if (includeSyncPractice) {
      transitionTo('sync-practice');
    } else {
      // Skip sync practice, go directly to practice
      transitionTo('practice');
    }
  }, [transitionTo, includeSyncPractice]);

  const goToPractice = useCallback(() => {
    transitionTo('practice');
  }, [transitionTo]);

  const goToQuiz = useCallback(() => {
    transitionTo('quiz');
  }, [transitionTo]);

  const goToComplete = useCallback(() => {
    transitionTo('complete');
  }, [transitionTo]);

  const goToSurvival = useCallback(() => {
    transitionTo('survival');
  }, [transitionTo]);

  const goToBoss = useCallback(() => {
    transitionTo('boss');
  }, [transitionTo]);

  const goToJourney = useCallback(() => {
    transitionTo('journey', true); // Force because journey might not be in all modes
  }, [transitionTo]);

  // Delayed transitions
  const goToIntroDelayed = useCallback(
    (delayMs?: number) => {
      transitionToDelayed('intro', delayMs);
    },
    [transitionToDelayed]
  );

  const goToPracticeDelayed = useCallback(
    (delayMs?: number) => {
      transitionToDelayed('practice', delayMs);
    },
    [transitionToDelayed]
  );

  const goToCompleteDelayed = useCallback(
    (delayMs?: number) => {
      transitionToDelayed('complete', delayMs);
    },
    [transitionToDelayed]
  );

  /**
   * Check if currently in a specific phase.
   */
  const isActivePhase = useCallback(
    (checkPhase: TrainingPhase): boolean => {
      return phase === checkPhase;
    },
    [phase]
  );

  /**
   * Get phase sequence for current mode.
   */
  const getPhaseSequence = useCallback((): TrainingPhase[] => {
    const sequence = MODE_PHASE_SEQUENCE[mode] ?? [];
    if (!includeSyncPractice && mode === 'learn') {
      return sequence.filter((p) => p !== 'sync-practice');
    }
    return sequence;
  }, [mode, includeSyncPractice]);

  /**
   * Reset to mode-select.
   */
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPhase('mode-select');
  }, [setPhase]);

  // Mode helpers
  const isSurvivalMode = mode === 'survival';
  const isBossMode = mode === 'boss';
  const isJourneyMode = phase === 'journey';
  const isQuizMode = mode === 'review-due' || mode === 'review-all';
  const isLearnMode = mode === 'learn';

  return {
    phase,
    setPhase,

    // Transitions
    goToIntro,
    goToSyncPractice,
    goToPractice,
    goToQuiz,
    goToComplete,
    goToModeSelect,
    goToSurvival,
    goToBoss,
    goToJourney,

    // Delayed transitions
    goToIntroDelayed,
    goToPracticeDelayed,
    goToCompleteDelayed,

    // Queries
    canGoToPhase,
    isActivePhase,
    getPhaseSequence,

    // Mode helpers
    isSurvivalMode,
    isBossMode,
    isJourneyMode,
    isQuizMode,
    isLearnMode,

    // Reset
    reset,
  };
}

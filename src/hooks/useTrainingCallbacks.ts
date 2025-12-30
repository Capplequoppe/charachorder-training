/**
 * useTrainingCallbacks Hook
 *
 * Provides common callbacks used across training components.
 * Consolidates backToModeSelect, handleBossComplete, continueLearnMore,
 * and handleModeSelect logic.
 *
 * @module hooks
 */

import { useCallback, useState } from 'react';
import { useCampaign, ChapterId, BOSS_REQUIREMENTS } from '../campaign';
import { useTips, TipTrigger } from '../tips';
import type { UseTrainingSessionResult } from './useTrainingSession';
import type { UseTrainingPhaseResult } from './useTrainingPhase';
import type { BossResult } from '../components/training/SurvivalGame';
import { TrainingMode } from '@/components/training';

/**
 * Options for useTrainingCallbacks hook.
 */
export interface UseTrainingCallbacksOptions {
  /** The chapter ID */
  chapterId: ChapterId;
  /** The training session */
  session: UseTrainingSessionResult;
  /** The phase control */
  phaseControl: UseTrainingPhaseResult;
  /** Callback to refresh progress */
  refreshProgress: () => void;
  /** Whether this training has sync practice (power chords) */
  hasSyncPractice?: boolean;
}

/**
 * Result returned by useTrainingCallbacks hook.
 */
export interface UseTrainingCallbacksResult {
  /** Go back to mode selection screen */
  backToModeSelect: () => void;
  /** Handle boss completion */
  handleBossComplete: (result: BossResult) => void;
  /** Continue learning more items */
  continueLearnMore: () => void;
  /** Handle mode selection */
  handleModeSelect: (mode: TrainingMode) => void;
  /** Sync successes count (for power chord training) */
  syncSuccesses: number;
  /** Set sync successes */
  setSyncSuccesses: React.Dispatch<React.SetStateAction<number>>;
  /** Reset sync successes to 0 */
  resetSyncSuccesses: () => void;
  /** Boss requirements for this chapter */
  bossRequirements: { targetScore: number; itemCount: number };
  /** Start quiz countdown callback (to be called by handleModeSelect) */
  onStartQuizCountdown?: () => void;
  /** Set the quiz countdown starter */
  setOnStartQuizCountdown: (fn: () => void) => void;
}

/**
 * Hook for common training callbacks.
 *
 * @example
 * ```tsx
 * const {
 *   backToModeSelect,
 *   handleBossComplete,
 *   continueLearnMore,
 *   handleModeSelect,
 *   syncSuccesses,
 *   setSyncSuccesses,
 *   bossRequirements,
 * } = useTrainingCallbacks({
 *   chapterId,
 *   session,
 *   phaseControl,
 *   refreshProgress,
 *   hasSyncPractice: true,
 * });
 * ```
 */
export function useTrainingCallbacks({
  chapterId,
  session,
  phaseControl,
  refreshProgress,
  hasSyncPractice = false,
}: UseTrainingCallbacksOptions): UseTrainingCallbacksResult {
  const campaign = useCampaign();
  const { triggerTip } = useTips();
  const bossRequirements = BOSS_REQUIREMENTS[chapterId];

  // Sync practice state (only used by power chord training)
  const [syncSuccesses, setSyncSuccesses] = useState(0);

  // Quiz countdown starter (set by the component that owns the countdown)
  const [onStartQuizCountdown, setOnStartQuizCountdownState] = useState<(() => void) | undefined>();

  // Back to mode select
  const backToModeSelect = useCallback(() => {
    refreshProgress();
    phaseControl.goToModeSelect();
    session.restart();
  }, [refreshProgress, phaseControl, session]);

  // Handle boss completion
  const handleBossComplete = useCallback((result: BossResult) => {
    campaign.recordBossAttempt(chapterId, result.scorePercent);
    if (result.passed) {
      campaign.completeChapter(chapterId);
      // Trigger dopamine reinforcement tip after first boss victory
      setTimeout(() => triggerTip(TipTrigger.BOSS_VICTORY), 1000);
    }
  }, [campaign, chapterId, triggerTip]);

  // Continue learning more (start a new learn session without going back to mode select)
  const continueLearnMore = useCallback(() => {
    refreshProgress();
    if (hasSyncPractice) {
      setSyncSuccesses(0);
    }
    session.selectMode('learn');
    phaseControl.goToIntro();
  }, [refreshProgress, hasSyncPractice, session, phaseControl]);

  // Handle mode selection
  const handleModeSelect = useCallback((mode: TrainingMode) => {
    if (hasSyncPractice) {
      setSyncSuccesses(0);
    }

    // Handle journey mode separately (not a session mode)
    if (mode === 'journey') {
      phaseControl.goToJourney();
      return;
    }

    session.selectMode(mode);

    switch (mode) {
      case 'learn':
        phaseControl.goToIntro();
        break;
      case 'review-due':
      case 'review-all':
        onStartQuizCountdown?.();
        phaseControl.goToQuiz();
        break;
      case 'survival':
        phaseControl.goToSurvival();
        break;
      case 'boss':
        phaseControl.goToBoss();
        break;
    }
  }, [hasSyncPractice, session, phaseControl, onStartQuizCountdown]);

  // Reset sync successes
  const resetSyncSuccesses = useCallback(() => {
    setSyncSuccesses(0);
  }, []);

  // Wrapper to set the countdown starter
  const setOnStartQuizCountdown = useCallback((fn: () => void) => {
    setOnStartQuizCountdownState(() => fn);
  }, []);

  return {
    backToModeSelect,
    handleBossComplete,
    continueLearnMore,
    handleModeSelect,
    syncSuccesses,
    setSyncSuccesses,
    resetSyncSuccesses,
    bossRequirements,
    onStartQuizCountdown,
    setOnStartQuizCountdown,
  };
}

/**
 * useCampaignProgress Hook
 *
 * Provides campaign mastery progress state and calculations for training components.
 * Extracts common progress-related logic used across IntraHandTraining,
 * CrossHandTraining, and WordChordTraining.
 *
 * @module hooks
 */

import { useState, useMemo, useCallback } from 'react';
import { useCampaign, ChapterId, ChapterMasteryProgress } from '../campaign';
import type { UseTrainingSessionResult } from './useTrainingSession';

/**
 * Options for useCampaignProgress hook.
 */
export interface UseCampaignProgressOptions {
  /** The chapter ID to track progress for */
  chapterId: ChapterId;
  /** The training session (used to detect completion for fresh progress) */
  session: UseTrainingSessionResult;
}

/**
 * Result returned by useCampaignProgress hook.
 */
export interface UseCampaignProgressResult {
  /** Current mastery progress for the chapter */
  masteryProgress: ChapterMasteryProgress;
  /** Number of items remaining to learn */
  itemsRemainingToLearn: number;
  /** Whether the boss has been defeated */
  bossDefeated: boolean;
  /** Best score achieved on the boss */
  bossBestScore: number;
  /** Refresh counter for forcing updates */
  refreshCounter: number;
  /** Increment refresh counter to force progress recalculation */
  refreshProgress: () => void;
}

/**
 * Hook for managing campaign progress state in training components.
 *
 * @example
 * ```tsx
 * const {
 *   masteryProgress,
 *   itemsRemainingToLearn,
 *   bossDefeated,
 *   bossBestScore,
 *   refreshProgress,
 * } = useCampaignProgress({
 *   chapterId: ChapterId.POWER_CHORDS_LEFT,
 *   session,
 * });
 * ```
 */
export function useCampaignProgress({
  chapterId,
  session,
}: UseCampaignProgressOptions): UseCampaignProgressResult {
  const campaign = useCampaign();
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Mastery progress for mode selector
  const masteryProgress = useMemo(() => {
    return campaign.getChapterMasteryProgress(chapterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, chapterId, refreshCounter]);

  // Calculate remaining items to learn (for continue learning more button)
  // This needs to account for items just learned in the current session
  const itemsRemainingToLearn = useMemo(() => {
    // When session is complete, items have been transitioned to LEARNING state
    // so we need to get fresh progress to see the updated count
    if (session.isComplete && session.isLearnMode) {
      const freshProgress = campaign.getChapterMasteryProgress(chapterId);
      return freshProgress.totalItems - freshProgress.itemsLearned;
    }
    return masteryProgress.totalItems - masteryProgress.itemsLearned;
  }, [campaign, chapterId, masteryProgress, session.isComplete, session.isLearnMode]);

  // Boss status
  const bossDefeated = campaign.campaignState.chapters[chapterId]?.bossDefeated ?? false;
  const bossBestScore = campaign.campaignState.chapters[chapterId]?.bossBestScore ?? 0;

  // Refresh progress (increment counter to force recalculation)
  const refreshProgress = useCallback(() => {
    setRefreshCounter(c => c + 1);
  }, []);

  return {
    masteryProgress,
    itemsRemainingToLearn,
    bossDefeated,
    bossBestScore,
    refreshCounter,
    refreshProgress,
  };
}

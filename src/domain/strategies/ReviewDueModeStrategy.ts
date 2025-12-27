/**
 * ReviewDueModeStrategy - Strategy for reviewing items due for spaced repetition.
 *
 * Review Due mode presents items whose nextReviewDate has passed.
 * This is the core spaced repetition review mode.
 *
 * Key behaviors:
 * - Only shows items where now >= nextReviewDate
 * - Only shows items that have been attempted before (totalAttempts > 0)
 * - DOES update mastery (reviews affect SRS scheduling)
 * - Quiz mode (1 attempt per item)
 * - Items shuffled randomly
 *
 * @module domain/strategies
 */

import { TrainableItem } from '../entities/TrainableItem';
import { IProgressRepository } from '../../data/repositories';
import {
  TrainingModeStrategy,
  TrainingMode,
  TrainingPhase,
  CompletionCriteria,
  ModeDisplayConfig,
  QUIZ_COMPLETION_CRITERIA,
} from './TrainingModeStrategy';

/**
 * Strategy implementation for Review Due mode.
 */
export class ReviewDueModeStrategy implements TrainingModeStrategy {
  readonly mode: TrainingMode = 'review-due';

  /**
   * Selects only items that are due for review.
   *
   * An item is due for review if:
   * - totalAttempts > 0 (has been learned before)
   * - now >= nextReviewDate (review time has arrived)
   */
  selectItems(
    allItems: readonly TrainableItem[],
    progressRepo: IProgressRepository
  ): TrainableItem[] {
    const now = new Date();

    const dueItems = allItems.filter(item => {
      const progress = progressRepo.getProgress(item.id, item.type);

      // Item must have been attempted and be due for review
      const isDue = progress &&
        progress.totalAttempts > 0 &&
        now >= progress.nextReviewDate;

      return isDue;
    });

    // Shuffle the items for varied review order
    return this.shuffleArray(dueItems);
  }

  /**
   * Review Due mode uses quiz criteria (1 attempt per item).
   */
  getCompletionCriteria(): CompletionCriteria {
    return QUIZ_COMPLETION_CRITERIA;
  }

  /**
   * Review Due mode DOES update mastery.
   *
   * Reviews are the core of spaced repetition - they must affect
   * SRS scheduling to work correctly.
   */
  shouldUpdateMastery(): boolean {
    return true;
  }

  /**
   * Review Due mode phase sequence (quiz mode, no intro).
   */
  getPhaseSequence(): TrainingPhase[] {
    return ['mode-select', 'quiz', 'complete'];
  }

  /**
   * Display configuration for Review Due mode.
   */
  getDisplayConfig(): ModeDisplayConfig {
    return {
      title: 'Review Due Items',
      showIntroPhase: false,
      showSyncPractice: false,
      shuffleItems: true,
    };
  }

  /**
   * Fisher-Yates shuffle for randomizing item order.
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

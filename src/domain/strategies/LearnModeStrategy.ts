/**
 * LearnModeStrategy - Strategy for learning new items.
 *
 * Learn mode presents items that have never been attempted before.
 * This is the entry point for users encountering new content.
 *
 * Key behaviors:
 * - Only shows items with totalAttempts === 0 or masteryLevel === NEW
 * - Does NOT update mastery (learning phase doesn't count toward SRS)
 * - Shows intro phase with item details
 * - Requires 5 successes per item
 * - Items presented in sequential order (not shuffled)
 *
 * @module domain/strategies
 */

import { MasteryLevel } from '../aggregates/LearningProgress';
import { TrainableItem } from '../entities/TrainableItem';
import { IProgressRepository } from '../../data/repositories';
import {
  TrainingModeStrategy,
  TrainingMode,
  TrainingPhase,
  CompletionCriteria,
  ModeDisplayConfig,
  DEFAULT_COMPLETION_CRITERIA,
} from './TrainingModeStrategy';

/**
 * Strategy implementation for Learn mode.
 *
 * This is the **single source of truth** for determining which items
 * are considered "new" and should be shown in Learn mode.
 */
export class LearnModeStrategy implements TrainingModeStrategy {
  readonly mode: TrainingMode = 'learn';

  /**
   * Selects only NEW items (never attempted).
   *
   * An item is considered NEW if:
   * - No progress record exists, OR
   * - totalAttempts === 0, OR
   * - masteryLevel === MasteryLevel.NEW
   *
   * This filtering logic was the cause of the "Learn more showing mastered items"
   * bug when it was duplicated across components with inconsistent implementations.
   */
  selectItems(
    allItems: readonly TrainableItem[],
    progressRepo: IProgressRepository
  ): TrainableItem[] {
    return allItems.filter(item => {
      const progress = progressRepo.getProgress(item.id, item.type);

      // Item is NEW if:
      // 1. No progress record exists
      // 2. totalAttempts is 0
      // 3. masteryLevel is explicitly NEW
      const isNew = !progress ||
        progress.totalAttempts === 0 ||
        progress.masteryLevel === MasteryLevel.NEW;

      return isNew;
    });
    // Note: Items are returned in original order (not shuffled)
  }

  /**
   * Learn mode uses standard completion criteria (5 successes per item).
   */
  getCompletionCriteria(): CompletionCriteria {
    return {
      ...DEFAULT_COMPLETION_CRITERIA,
      isQuizMode: false,
    };
  }

  /**
   * Learn mode does NOT update mastery.
   *
   * This ensures the learning phase is "safe" - users can practice
   * without affecting their SRS scheduling or mastery levels.
   */
  shouldUpdateMastery(): boolean {
    return false;
  }

  /**
   * Learn mode phase sequence includes intro and sync practice.
   */
  getPhaseSequence(): TrainingPhase[] {
    return ['mode-select', 'intro', 'sync-practice', 'practice', 'complete'];
  }

  /**
   * Display configuration for Learn mode.
   */
  getDisplayConfig(): ModeDisplayConfig {
    return {
      title: 'Learn New Items',
      showIntroPhase: true,
      showSyncPractice: true,
      shuffleItems: false,
    };
  }
}

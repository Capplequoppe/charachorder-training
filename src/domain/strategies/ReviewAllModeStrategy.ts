/**
 * ReviewAllModeStrategy - Strategy for reviewing all learned items.
 *
 * Review All mode presents all items that have been learned (non-NEW).
 * This is useful for general practice without waiting for spaced repetition.
 *
 * Key behaviors:
 * - Shows all items where masteryLevel !== NEW
 * - Prioritizes non-mastered items (LEARNING, FAMILIAR) over MASTERED
 * - DOES update mastery (reviews affect SRS scheduling)
 * - Quiz mode (1 attempt per item)
 * - Items shuffled randomly (with priority ordering)
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
  QUIZ_COMPLETION_CRITERIA,
} from './TrainingModeStrategy';

/**
 * Strategy implementation for Review All mode.
 */
export class ReviewAllModeStrategy implements TrainingModeStrategy {
  readonly mode: TrainingMode = 'review-all';

  /**
   * Selects all learned (non-NEW) items, prioritizing non-mastered ones.
   *
   * An item is included if:
   * - masteryLevel !== MasteryLevel.NEW
   *
   * Items are ordered with priority:
   * 1. LEARNING items first (need most practice)
   * 2. FAMILIAR items second
   * 3. MASTERED items last
   * Within each group, items are shuffled.
   */
  selectItems(
    allItems: readonly TrainableItem[],
    progressRepo: IProgressRepository
  ): TrainableItem[] {
    // Separate items by mastery level
    const learningItems: TrainableItem[] = [];
    const familiarItems: TrainableItem[] = [];
    const masteredItems: TrainableItem[] = [];

    for (const item of allItems) {
      const progress = progressRepo.getProgress(item.id, item.type);

      if (!progress || progress.masteryLevel === MasteryLevel.NEW) {
        // Skip NEW items
        continue;
      }

      switch (progress.masteryLevel) {
        case MasteryLevel.LEARNING:
          learningItems.push(item);
          break;
        case MasteryLevel.FAMILIAR:
          familiarItems.push(item);
          break;
        case MasteryLevel.MASTERED:
          masteredItems.push(item);
          break;
      }
    }

    // Shuffle each group
    this.shuffleArray(learningItems);
    this.shuffleArray(familiarItems);
    this.shuffleArray(masteredItems);

    // Combine with priority order
    return [...learningItems, ...familiarItems, ...masteredItems];
  }

  /**
   * Review All mode uses quiz criteria (1 attempt per item).
   */
  getCompletionCriteria(): CompletionCriteria {
    return QUIZ_COMPLETION_CRITERIA;
  }

  /**
   * Review All mode DOES update mastery.
   */
  shouldUpdateMastery(): boolean {
    return true;
  }

  /**
   * Review All mode phase sequence (quiz mode, no intro).
   */
  getPhaseSequence(): TrainingPhase[] {
    return ['mode-select', 'quiz', 'complete'];
  }

  /**
   * Display configuration for Review All mode.
   */
  getDisplayConfig(): ModeDisplayConfig {
    return {
      title: 'Review All Items',
      showIntroPhase: false,
      showSyncPractice: false,
      shuffleItems: true,
    };
  }

  /**
   * Fisher-Yates shuffle (in-place).
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

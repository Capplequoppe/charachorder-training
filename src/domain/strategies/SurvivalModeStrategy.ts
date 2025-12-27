/**
 * SurvivalModeStrategy - Strategy for survival mode practice.
 *
 * Survival mode is an endless quiz on learned items where one mistake
 * ends the session. It's designed for building speed and accuracy.
 *
 * Key behaviors:
 * - Shows all items where masteryLevel !== NEW
 * - DOES update mastery (survival attempts count)
 * - Delegates to SurvivalGame component
 * - No traditional completion (endless until failure)
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
 * Strategy implementation for Survival mode.
 */
export class SurvivalModeStrategy implements TrainingModeStrategy {
  readonly mode: TrainingMode = 'survival';

  /**
   * Selects all learned (non-NEW) items.
   *
   * Survival mode tests all items that have been learned,
   * regardless of mastery level.
   */
  selectItems(
    allItems: readonly TrainableItem[],
    progressRepo: IProgressRepository
  ): TrainableItem[] {
    const learnedItems = allItems.filter(item => {
      const progress = progressRepo.getProgress(item.id, item.type);

      // Include items that are not NEW
      return progress && progress.masteryLevel !== MasteryLevel.NEW;
    });

    // Shuffle for variety
    return this.shuffleArray(learnedItems);
  }

  /**
   * Survival mode uses quiz criteria.
   */
  getCompletionCriteria(): CompletionCriteria {
    return {
      ...QUIZ_COMPLETION_CRITERIA,
      // Survival has no fixed completion - endless until failure
    };
  }

  /**
   * Survival mode DOES update mastery.
   */
  shouldUpdateMastery(): boolean {
    return true;
  }

  /**
   * Survival mode delegates to dedicated component.
   */
  getPhaseSequence(): TrainingPhase[] {
    return ['mode-select', 'survival'];
  }

  /**
   * Display configuration for Survival mode.
   */
  getDisplayConfig(): ModeDisplayConfig {
    return {
      title: 'Survival Mode',
      showIntroPhase: false,
      showSyncPractice: false,
      shuffleItems: true,
    };
  }

  /**
   * Fisher-Yates shuffle.
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

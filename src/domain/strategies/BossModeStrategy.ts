/**
 * BossModeStrategy - Strategy for boss challenge mode.
 *
 * Boss mode is a special challenge that tests ALL items (including NEW).
 * Completing the boss unlocks the next chapter in campaign mode.
 *
 * Key behaviors:
 * - Shows ALL items (no filtering)
 * - DOES update mastery
 * - Has target score requirement
 * - Delegates to SurvivalGame component with boss config
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
 * Strategy implementation for Boss mode.
 */
export class BossModeStrategy implements TrainingModeStrategy {
  readonly mode: TrainingMode = 'boss';

  /**
   * Selects ALL items for the boss challenge.
   *
   * Unlike other modes, Boss mode includes everything - this is the
   * ultimate test of all content in a chapter.
   */
  selectItems(
    allItems: readonly TrainableItem[],
    _progressRepo: IProgressRepository
  ): TrainableItem[] {
    // Boss mode includes all items, shuffled
    return this.shuffleArray([...allItems]);
  }

  /**
   * Boss mode uses quiz criteria.
   */
  getCompletionCriteria(): CompletionCriteria {
    return {
      ...QUIZ_COMPLETION_CRITERIA,
      // Boss has target score requirement (handled by SurvivalGame)
    };
  }

  /**
   * Boss mode DOES update mastery.
   */
  shouldUpdateMastery(): boolean {
    return true;
  }

  /**
   * Boss mode delegates to dedicated component.
   */
  getPhaseSequence(): TrainingPhase[] {
    return ['mode-select', 'boss'];
  }

  /**
   * Display configuration for Boss mode.
   */
  getDisplayConfig(): ModeDisplayConfig {
    return {
      title: 'Boss Challenge',
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

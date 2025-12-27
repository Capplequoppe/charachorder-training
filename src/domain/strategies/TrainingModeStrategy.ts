/**
 * TrainingModeStrategy - Strategy pattern for training mode behavior.
 *
 * Each training mode (learn, review-due, review-all, survival, boss) has
 * different behavior for:
 * - Which items to include
 * - How to order items
 * - When an item/session is complete
 * - Whether attempts affect mastery
 *
 * This interface provides a single source of truth for mode-specific behavior,
 * eliminating the duplicated switch statements across training components.
 *
 * @module domain/strategies
 */

import { TrainableItem } from '../entities/TrainableItem';
import { IProgressRepository } from '../../data/repositories';

/**
 * Training mode identifiers.
 * These match the modes in TrainingModeSelector.
 */
export type TrainingMode =
  | 'learn'      // Learn new items (never attempted)
  | 'review-due' // Review items due for spaced repetition
  | 'review-all' // Review all learned items
  | 'survival'   // Survival mode (endless quiz)
  | 'boss';      // Boss challenge mode

/**
 * Training phases for the state machine.
 */
export type TrainingPhase =
  | 'mode-select'
  | 'intro'
  | 'sync-practice'
  | 'practice'
  | 'quiz'
  | 'complete'
  | 'survival'
  | 'boss'
  | 'journey';

/**
 * Completion criteria for a training session.
 */
export interface CompletionCriteria {
  /**
   * Number of successful attempts required per item.
   * For quiz mode, this is typically 1 (one-shot).
   * For practice mode, typically 5.
   */
  readonly successesRequired: number;

  /**
   * Whether this is a quiz mode (one attempt per item, then move on).
   */
  readonly isQuizMode: boolean;

  /**
   * Number of sync successes required (for power chord sync practice).
   * Only applicable to modes that include sync practice phase.
   */
  readonly syncSuccessesRequired: number;
}

/**
 * Display configuration for a training mode.
 */
export interface ModeDisplayConfig {
  /**
   * Title to show for this mode.
   */
  readonly title: string;

  /**
   * Whether to show intro phase before practice.
   */
  readonly showIntroPhase: boolean;

  /**
   * Whether to show sync practice phase (for power chords).
   */
  readonly showSyncPractice: boolean;

  /**
   * Whether to shuffle item order.
   */
  readonly shuffleItems: boolean;
}

/**
 * Strategy interface for training mode behavior.
 *
 * Implementations encapsulate all mode-specific logic, providing a single
 * source of truth for how each mode behaves.
 */
export interface TrainingModeStrategy {
  /**
   * The mode this strategy handles.
   */
  readonly mode: TrainingMode;

  /**
   * Selects and orders items for this training mode.
   *
   * This is the **single source of truth** for item filtering.
   * All training components should use this method instead of implementing
   * their own filtering logic.
   *
   * @param allItems - All available items of this type
   * @param progressRepo - Repository for checking progress/mastery
   * @returns Filtered and ordered array of items to train
   */
  selectItems(
    allItems: readonly TrainableItem[],
    progressRepo: IProgressRepository
  ): TrainableItem[];

  /**
   * Gets the completion criteria for this mode.
   *
   * @returns Completion criteria specifying when items/sessions are done
   */
  getCompletionCriteria(): CompletionCriteria;

  /**
   * Whether attempts in this mode should update mastery/SRS scheduling.
   *
   * Learn mode returns false (learning doesn't count toward mastery).
   * Review modes return true (reviews affect SRS scheduling).
   *
   * @returns true if attempts should update mastery
   */
  shouldUpdateMastery(): boolean;

  /**
   * Gets the valid phase sequence for this mode.
   *
   * @returns Array of phases in order for this mode
   */
  getPhaseSequence(): TrainingPhase[];

  /**
   * Gets display configuration for this mode.
   *
   * @returns Configuration for UI rendering
   */
  getDisplayConfig(): ModeDisplayConfig;
}

/**
 * Default completion criteria used as a base for most modes.
 */
export const DEFAULT_COMPLETION_CRITERIA: CompletionCriteria = {
  successesRequired: 5,
  isQuizMode: false,
  syncSuccessesRequired: 3,
};

/**
 * Quiz completion criteria (one attempt per item).
 */
export const QUIZ_COMPLETION_CRITERIA: CompletionCriteria = {
  successesRequired: 1,
  isQuizMode: true,
  syncSuccessesRequired: 0,
};

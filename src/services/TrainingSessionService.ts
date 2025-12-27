/**
 * TrainingSessionService
 *
 * Orchestrates training sessions by selecting items based on training mode
 * using the strategy pattern. This is the single source of truth for
 * "what items should I train?"
 *
 * Key responsibilities:
 * - Item selection via TrainingModeStrategy
 * - Session configuration (completion criteria, mastery updates)
 * - Phase sequencing for different modes
 *
 * @module services
 */

import type { Repositories } from '../data';
import {
  TrainableItem,
  TrainableItemType,
  powerChordToTrainableItem,
  wordToTrainableItem,
  PowerChord,
} from '../domain';
import type { TrainingMode, TrainingPhase, CompletionCriteria, ModeDisplayConfig, TrainingModeStrategy } from '../domain';
import {
  LearnModeStrategy,
  ReviewDueModeStrategy,
  ReviewAllModeStrategy,
  SurvivalModeStrategy,
  BossModeStrategy,
} from '../domain';

/**
 * Filter options for item selection.
 */
export interface ItemFilter {
  /** Filter power chords by hand */
  hand?: 'left' | 'right' | 'cross';
}

/**
 * Session configuration returned for a training mode.
 */
export interface SessionConfig {
  completionCriteria: CompletionCriteria;
  shouldUpdateMastery: boolean;
  phaseSequence: TrainingPhase[];
  displayConfig: ModeDisplayConfig;
}

/**
 * Interface for TrainingSessionService.
 */
export interface ITrainingSessionService {
  /**
   * Get trainable items for a specific mode and item type.
   * @param itemType Type of items to get (powerChord or word)
   * @param mode Training mode
   * @param filter Optional filter options
   * @returns Array of trainable items filtered by the mode's strategy
   */
  getItemsForMode(
    itemType: TrainableItemType,
    mode: TrainingMode,
    filter?: ItemFilter
  ): TrainableItem[];

  /**
   * Get count of items without loading all item data.
   * Useful for UI display.
   * @param itemType Type of items to count
   * @param mode Training mode
   * @param filter Optional filter options
   * @returns Number of items that would be returned
   */
  getItemCount(
    itemType: TrainableItemType,
    mode: TrainingMode,
    filter?: ItemFilter
  ): number;

  /**
   * Get full session configuration for a mode.
   * @param mode Training mode
   * @returns Session configuration
   */
  getSessionConfig(mode: TrainingMode): SessionConfig;

  /**
   * Get completion criteria for a mode.
   * @param mode Training mode
   * @returns Completion criteria
   */
  getCompletionCriteria(mode: TrainingMode): CompletionCriteria;

  /**
   * Check if mastery should be updated for a mode.
   * @param mode Training mode
   * @returns Whether mastery should be updated
   */
  shouldUpdateMastery(mode: TrainingMode): boolean;

  /**
   * Get the strategy for a specific mode.
   * Useful for advanced customization.
   * @param mode Training mode
   * @returns The mode's strategy
   */
  getStrategy(mode: TrainingMode): TrainingModeStrategy;
}

/**
 * Service dependencies.
 */
export interface TrainingSessionServiceDependencies {
  repositories: Repositories;
}

/**
 * TrainingSessionService implementation.
 */
export class TrainingSessionService implements ITrainingSessionService {
  private readonly repositories: Repositories;
  private readonly strategies: Map<TrainingMode, TrainingModeStrategy>;

  constructor(deps: TrainingSessionServiceDependencies) {
    this.repositories = deps.repositories;

    // Initialize all strategies
    this.strategies = new Map<TrainingMode, TrainingModeStrategy>([
      ['learn', new LearnModeStrategy()],
      ['review-due', new ReviewDueModeStrategy()],
      ['review-all', new ReviewAllModeStrategy()],
      ['survival', new SurvivalModeStrategy()],
      ['boss', new BossModeStrategy()],
    ]);
  }

  /**
   * Get all items of a given type, optionally filtered by hand.
   */
  private getAllItems(itemType: TrainableItemType, filter?: ItemFilter): TrainableItem[] {
    const { powerChords, words } = this.repositories;

    if (itemType === 'powerChord') {
      let chords: PowerChord[];
      if (filter?.hand) {
        chords = powerChords.getByHand(filter.hand);
      } else {
        chords = powerChords.getAll();
      }
      return chords.map(powerChordToTrainableItem);
    } else {
      // Words don't have hand filtering
      return words.getAll().map(wordToTrainableItem);
    }
  }

  /**
   * Get trainable items for a specific mode and item type.
   */
  getItemsForMode(
    itemType: TrainableItemType,
    mode: TrainingMode,
    filter?: ItemFilter
  ): TrainableItem[] {
    const strategy = this.getStrategy(mode);
    const allItems = this.getAllItems(itemType, filter);

    return strategy.selectItems(allItems, this.repositories.progress);
  }

  /**
   * Get count of items without loading all item data.
   */
  getItemCount(
    itemType: TrainableItemType,
    mode: TrainingMode,
    filter?: ItemFilter
  ): number {
    // For now, just get items and count them
    // Could be optimized later to avoid full item conversion
    return this.getItemsForMode(itemType, mode, filter).length;
  }

  /**
   * Get full session configuration for a mode.
   */
  getSessionConfig(mode: TrainingMode): SessionConfig {
    const strategy = this.getStrategy(mode);

    return {
      completionCriteria: strategy.getCompletionCriteria(),
      shouldUpdateMastery: strategy.shouldUpdateMastery(),
      phaseSequence: strategy.getPhaseSequence(),
      displayConfig: strategy.getDisplayConfig(),
    };
  }

  /**
   * Get completion criteria for a mode.
   */
  getCompletionCriteria(mode: TrainingMode): CompletionCriteria {
    return this.getStrategy(mode).getCompletionCriteria();
  }

  /**
   * Check if mastery should be updated for a mode.
   */
  shouldUpdateMastery(mode: TrainingMode): boolean {
    return this.getStrategy(mode).shouldUpdateMastery();
  }

  /**
   * Get the strategy for a specific mode.
   */
  getStrategy(mode: TrainingMode): TrainingModeStrategy {
    const strategy = this.strategies.get(mode);
    if (!strategy) {
      throw new Error(`Unknown training mode: ${mode}`);
    }
    return strategy;
  }
}

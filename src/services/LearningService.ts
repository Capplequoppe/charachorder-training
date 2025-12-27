/**
 * Learning Service
 *
 * Implements spaced repetition algorithm (SM-2 variant) and
 * learning progression logic.
 */

import {
  LearningProgress,
  LearningItemType,
  MasteryLevel,
} from '../domain';
import { IProgressRepository } from '../data/repositories';
import {
  getInitialInterval,
  getExpectedTime,
  SM2_CONSTANTS,
  calculateSelectionWeight,
  getConfidenceLevel as getConfidenceLevelFromConfig,
} from '../data/static/learningConfig';

/**
 * Learning stages representing the progression through the curriculum.
 */
export enum LearningStage {
  FINGER_INTRODUCTION = 'finger_introduction',
  CHARACTER_QUIZ = 'character_quiz',
  INTRA_HAND_POWER_CHORDS = 'intra_hand_power_chords',
  CROSS_HAND_POWER_CHORDS = 'cross_hand_power_chords',
  WORD_CHORDS = 'word_chords',
  CHUNK_EXTENSION = 'chunk_extension',
  SPEED_CHALLENGES = 'speed_challenges',
  REAL_TYPING = 'real_typing',
}

/**
 * Stage requirements for progression.
 */
const STAGE_REQUIREMENTS: Record<LearningStage, { requiredMastery: number; dependsOn?: LearningStage }> = {
  [LearningStage.FINGER_INTRODUCTION]: { requiredMastery: 0 },
  [LearningStage.CHARACTER_QUIZ]: { requiredMastery: 0.5, dependsOn: LearningStage.FINGER_INTRODUCTION },
  [LearningStage.INTRA_HAND_POWER_CHORDS]: { requiredMastery: 0.7, dependsOn: LearningStage.CHARACTER_QUIZ },
  [LearningStage.CROSS_HAND_POWER_CHORDS]: { requiredMastery: 0.7, dependsOn: LearningStage.INTRA_HAND_POWER_CHORDS },
  [LearningStage.WORD_CHORDS]: { requiredMastery: 0.7, dependsOn: LearningStage.CROSS_HAND_POWER_CHORDS },
  [LearningStage.CHUNK_EXTENSION]: { requiredMastery: 0.7, dependsOn: LearningStage.WORD_CHORDS },
  [LearningStage.SPEED_CHALLENGES]: { requiredMastery: 0.8, dependsOn: LearningStage.CHUNK_EXTENSION },
  [LearningStage.REAL_TYPING]: { requiredMastery: 0.8, dependsOn: LearningStage.SPEED_CHALLENGES },
};

/**
 * Quality rating for SRS algorithm (SM-2).
 * 0 = complete blackout, 5 = perfect response
 */
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Confidence level based on performance.
 */
export type ConfidenceLevel = 'weak' | 'moderate' | 'strong';

/**
 * Interface for learning service operations.
 */
export interface ILearningService {
  // SRS Algorithm
  calculateNextReview(progress: LearningProgress, quality: QualityRating): LearningProgress;
  getQualityFromAttempt(correct: boolean, responseTimeMs: number, expectedTimeMs?: number): QualityRating;

  // Item selection
  getNextItemsToReview(type: LearningItemType, count: number): LearningProgress[];
  getWeightedSelection(items: LearningProgress[], count: number): LearningProgress[];

  // Mastery checks
  isItemMastered(itemId: string, itemType: LearningItemType): boolean;
  getMasteryLevel(itemId: string, itemType: LearningItemType): MasteryLevel;

  // Stage progression
  getCurrentLearningStage(): LearningStage;
  canAdvanceToStage(stage: LearningStage): boolean;
  getUnlockedStages(): LearningStage[];
  getStageProgress(stage: LearningStage): number;

  // Statistics
  getAccuracyForItem(itemId: string, itemType: LearningItemType): number;
  getAverageResponseTime(itemId: string, itemType: LearningItemType): number;
  getConfidenceLevel(itemId: string, itemType: LearningItemType): ConfidenceLevel;
}

/**
 * Learning service implementation with SM-2 algorithm.
 */
export class LearningService implements ILearningService {
  private progressRepo: IProgressRepository;

  constructor(progressRepo: IProgressRepository) {
    this.progressRepo = progressRepo;
  }

  // ==================== SRS Algorithm (SM-2) ====================

  /**
   * Calculates the next review using SM-2 algorithm with accelerated intervals.
   *
   * SM-2 Algorithm:
   * If quality < 3:
   *   repetitions = 0
   *   interval = 1
   * Else:
   *   Use accelerated intervals for early repetitions (item-type specific)
   *   Otherwise: interval = interval * easeFactor
   *   repetitions += 1
   *
   * easeFactor = max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
   */
  calculateNextReview(progress: LearningProgress, quality: QualityRating): LearningProgress {
    // Clone the progress to avoid mutating the original
    const newProgress = progress.clone();

    // Update ease factor using SM-2 formula
    const efChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    newProgress.easeFactor = Math.max(
      SM2_CONSTANTS.minEaseFactor,
      Math.min(SM2_CONSTANTS.maxEaseFactor, progress.easeFactor + efChange)
    );

    if (quality < SM2_CONSTANTS.successThreshold) {
      // Failed - reset repetitions
      newProgress.repetitions = 0;
      newProgress.interval = SM2_CONSTANTS.initialInterval;
    } else {
      // Success - advance interval using accelerated progression
      const acceleratedInterval = getInitialInterval(
        progress.itemType,
        progress.repetitions
      );

      if (acceleratedInterval !== undefined) {
        // Use accelerated interval for early repetitions
        newProgress.interval = acceleratedInterval;
      } else {
        // Use standard SM-2 calculation for later repetitions
        newProgress.interval = Math.round(progress.interval * newProgress.easeFactor);
      }
      newProgress.repetitions = progress.repetitions + 1;
    }

    // Cap interval based on mastery level to prevent absurdly long review intervals
    // Non-mastered items need more frequent reviews to maintain/improve skill
    const maxInterval = newProgress.masteryLevel === MasteryLevel.MASTERED
      ? SM2_CONSTANTS.maxIntervalMastered
      : SM2_CONSTANTS.maxIntervalNotMastered;
    newProgress.interval = Math.min(newProgress.interval, maxInterval);

    // Calculate next review date
    const nextReview = new Date();
    // Handle fractional days (hours) by using milliseconds
    const intervalMs = newProgress.interval * 24 * 60 * 60 * 1000;
    nextReview.setTime(nextReview.getTime() + intervalMs);
    newProgress.nextReviewDate = nextReview;

    // Update mastery level
    newProgress.updateMasteryLevel();

    return newProgress;
  }

  /**
   * Determines quality rating from attempt results.
   * Uses item-type specific expected times from learningConfig.
   */
  getQualityFromAttempt(
    correct: boolean,
    responseTimeMs: number,
    expectedTimeMs?: number,
    itemType?: LearningItemType,
    masteryLevel?: MasteryLevel
  ): QualityRating {
    // Calculate expected time if not provided
    const expected = expectedTimeMs ??
      (itemType ? getExpectedTime(itemType, masteryLevel ?? MasteryLevel.NEW) : 1500);

    if (!correct) {
      // Incorrect responses
      if (responseTimeMs < 500) return 0; // Quick wrong = blackout
      if (responseTimeMs < 2000) return 1; // Some thought, still wrong
      return 2; // Long thought, wrong
    }

    // Correct responses - grade by speed relative to expected time
    const timeRatio = responseTimeMs / expected;

    if (timeRatio < 0.5) return 5; // Very fast - perfect
    if (timeRatio < 0.75) return 5; // Fast
    if (timeRatio < 1.0) return 4; // Good - within expected time
    if (timeRatio < 1.5) return 4; // Slightly slow but acceptable
    if (timeRatio < 2.0) return 3; // Slow but correct
    return 3; // Very slow but correct
  }

  // ==================== Item Selection ====================

  getNextItemsToReview(type: LearningItemType, count: number): LearningProgress[] {
    const dueItems = this.progressRepo.getItemsDueForReview(type);

    // Sort by: overdue first, then by ease factor (harder items first)
    const now = new Date();
    dueItems.sort((a, b) => {
      const aOverdue = now.getTime() - a.nextReviewDate.getTime();
      const bOverdue = now.getTime() - b.nextReviewDate.getTime();

      // Heavily overdue items first
      if (aOverdue > 86400000 && bOverdue <= 86400000) return -1;
      if (bOverdue > 86400000 && aOverdue <= 86400000) return 1;

      // Then by ease factor (lower = harder = higher priority)
      return a.easeFactor - b.easeFactor;
    });

    return dueItems.slice(0, count);
  }

  getWeightedSelection(items: LearningProgress[], count: number): LearningProgress[] {
    if (items.length <= count) return [...items];

    // Calculate weights using the sophisticated weight function from learningConfig
    // This considers: fail ratio, overdue time, and attempt count
    const weighted = items.map((item) => ({
      item,
      weight: calculateSelectionWeight(item),
    }));

    // Weighted random selection without replacement
    const selected: LearningProgress[] = [];
    const remaining = [...weighted];

    while (selected.length < count && remaining.length > 0) {
      const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < remaining.length; i++) {
        random -= remaining[i].weight;
        if (random <= 0) {
          selected.push(remaining[i].item);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return selected;
  }

  // ==================== Mastery Checks ====================

  isItemMastered(itemId: string, itemType: LearningItemType): boolean {
    return this.getMasteryLevel(itemId, itemType) === MasteryLevel.MASTERED;
  }

  getMasteryLevel(itemId: string, itemType: LearningItemType): MasteryLevel {
    const progress = this.getProgress(itemId, itemType);
    return progress?.masteryLevel ?? MasteryLevel.NEW;
  }

  private getProgress(itemId: string, itemType: LearningItemType): LearningProgress | undefined {
    switch (itemType) {
      case 'character':
        return this.progressRepo.getCharacterProgress(itemId);
      case 'powerChord':
        return this.progressRepo.getPowerChordProgress(itemId);
      case 'word':
        return this.progressRepo.getWordProgress(itemId);
    }
  }

  // ==================== Stage Progression ====================

  getCurrentLearningStage(): LearningStage {
    const stages = Object.values(LearningStage);

    // Find the highest unlocked stage
    for (let i = stages.length - 1; i >= 0; i--) {
      if (this.canAdvanceToStage(stages[i])) {
        return stages[i];
      }
    }

    return LearningStage.FINGER_INTRODUCTION;
  }

  canAdvanceToStage(stage: LearningStage): boolean {
    const requirements = STAGE_REQUIREMENTS[stage];

    // Check dependency
    if (requirements.dependsOn) {
      const dependencyProgress = this.getStageProgress(requirements.dependsOn);
      if (dependencyProgress < requirements.requiredMastery) {
        return false;
      }
    }

    return true;
  }

  getUnlockedStages(): LearningStage[] {
    return Object.values(LearningStage).filter((stage) =>
      this.canAdvanceToStage(stage)
    );
  }

  getStageProgress(stage: LearningStage): number {
    const stats = this.progressRepo.getTotalStats();

    switch (stage) {
      case LearningStage.FINGER_INTRODUCTION:
        // Progress based on fingers practiced
        return Math.min(1, stats.charactersLearned / 26);

      case LearningStage.CHARACTER_QUIZ:
        // Progress based on character mastery
        return Math.min(1, stats.charactersMastered / 26);

      case LearningStage.INTRA_HAND_POWER_CHORDS:
      case LearningStage.CROSS_HAND_POWER_CHORDS:
        // Progress based on power chord mastery
        return Math.min(1, stats.powerChordsMastered / 15);

      case LearningStage.WORD_CHORDS:
      case LearningStage.CHUNK_EXTENSION:
        // Progress based on word mastery
        return Math.min(1, stats.wordsMastered / 50);

      case LearningStage.SPEED_CHALLENGES:
      case LearningStage.REAL_TYPING:
        // Progress based on overall mastery
        return Math.min(1, stats.wordsMastered / 100);

      default:
        return 0;
    }
  }

  // ==================== Statistics ====================

  getAccuracyForItem(itemId: string, itemType: LearningItemType): number {
    const progress = this.getProgress(itemId, itemType);
    if (!progress || progress.totalAttempts === 0) return 0;
    return progress.accuracy;
  }

  getAverageResponseTime(itemId: string, itemType: LearningItemType): number {
    const progress = this.getProgress(itemId, itemType);
    return progress?.averageResponseTimeMs ?? 0;
  }

  getConfidenceLevel(itemId: string, itemType: LearningItemType): ConfidenceLevel {
    const progress = this.getProgress(itemId, itemType);
    if (!progress) return 'weak';
    return getConfidenceLevelFromConfig(progress);
  }
}

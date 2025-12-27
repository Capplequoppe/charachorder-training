import { Direction } from '../enums/Direction';

/**
 * Type of learnable item.
 */
export type LearningItemType = 'character' | 'powerChord' | 'word';

/**
 * Mastery level for an item.
 */
export enum MasteryLevel {
  /** Never practiced */
  NEW = 'new',
  /** Currently learning (low accuracy) */
  LEARNING = 'learning',
  /** Familiar (moderate accuracy) */
  FAMILIAR = 'familiar',
  /** Mastered (high accuracy, fast response) */
  MASTERED = 'mastered',
}

/**
 * Record of a single attempt for rolling window calculations.
 */
export interface AttemptRecord {
  correct: boolean;
  responseTimeMs: number;
  timestamp: number;
}

/**
 * Number of recent attempts to consider for accuracy calculation.
 * This allows users to "recover" from early mistakes.
 */
export const MASTERY_WINDOW_SIZE = 5;

/**
 * Number of recent attempts to consider for response time calculation.
 * Uses the same window as mastery accuracy for consistency.
 */
export const RESPONSE_TIME_WINDOW_SIZE = 5;

/**
 * Accuracy threshold (0-1) required for FAMILIAR level.
 */
export const FAMILIAR_ACCURACY_THRESHOLD = 0.7;

/**
 * Accuracy threshold (0-1) required for MASTERED level.
 */
export const MASTERED_ACCURACY_THRESHOLD = 0.9;

/**
 * Maximum average response time (ms) required for MASTERED level.
 */
export const MASTERED_RESPONSE_TIME_THRESHOLD = 1750;

/**
 * Maximum response time (ms) to record for any single attempt.
 * Times beyond this are capped to prevent AFK/distraction penalties
 * from making mastery impossible. Set to ~17 seconds (10x mastery threshold).
 */
export const MAX_RESPONSE_TIME_PENALTY_MS = 17500;

/**
 * Progress tracking for a specific direction.
 */
export interface DirectionProgress {
  /** Total attempts for this direction */
  attempts: number;

  /** Correct attempts for this direction */
  correct: number;

  /** Average response time in ms */
  averageTimeMs: number;

  /** Last practiced date */
  lastPracticed: Date | null;
}

/**
 * Default direction progress values.
 */
function createDefaultDirectionProgress(): DirectionProgress {
  return {
    attempts: 0,
    correct: 0,
    averageTimeMs: 0,
    lastPracticed: null,
  };
}

/**
 * Represents user's progress on any learnable item.
 * Uses a simplified SM-2 spaced repetition algorithm.
 *
 * This is an Aggregate with mutable state for tracking progress.
 */
export class LearningProgress {
  /** ID of the item (character, powerChord id, or word) */
  readonly itemId: string;

  /** Type of item */
  readonly itemType: LearningItemType;

  /**
   * Ease factor for SRS algorithm.
   * Starts at 2.5, adjusts based on performance.
   * Lower = harder, reviewed more often.
   */
  easeFactor: number;

  /**
   * Days until next review.
   * Doubles on successful reviews, resets on failures.
   */
  interval: number;

  /** Date when this item should next be reviewed */
  nextReviewDate: Date;

  /** Number of successful reviews in a row */
  repetitions: number;

  /** Total number of attempts */
  totalAttempts: number;

  /** Number of correct attempts */
  correctAttempts: number;

  /** Average response time in milliseconds (rolling window of last 5 attempts) */
  averageResponseTimeMs: number;

  /** Date of last attempt */
  lastAttemptDate: Date | null;

  /** Date of last correct attempt */
  lastCorrectDate: Date | null;

  /**
   * Confidence levels per direction (for characters only).
   * Allows tracking which directions need more practice.
   */
  directionConfidence?: Record<Direction, DirectionProgress>;

  /**
   * Rolling window of recent attempts for mastery calculation.
   * Only the last MASTERY_WINDOW_SIZE attempts are kept.
   */
  recentAttempts: AttemptRecord[];

  /** Current mastery level (computed from metrics) */
  masteryLevel: MasteryLevel;

  /**
   * Creates a new LearningProgress aggregate.
   * Private constructor - use static factory method.
   */
  private constructor(params: {
    itemId: string;
    itemType: LearningItemType;
    easeFactor: number;
    interval: number;
    nextReviewDate: Date;
    repetitions: number;
    totalAttempts: number;
    correctAttempts: number;
    averageResponseTimeMs: number;
    lastAttemptDate: Date | null;
    lastCorrectDate: Date | null;
    masteryLevel: MasteryLevel;
    directionConfidence?: Record<Direction, DirectionProgress>;
    recentAttempts?: AttemptRecord[];
  }) {
    this.itemId = params.itemId;
    this.itemType = params.itemType;
    this.easeFactor = params.easeFactor;
    this.interval = params.interval;
    this.nextReviewDate = params.nextReviewDate;
    this.repetitions = params.repetitions;
    this.totalAttempts = params.totalAttempts;
    this.correctAttempts = params.correctAttempts;
    this.averageResponseTimeMs = params.averageResponseTimeMs;
    this.lastAttemptDate = params.lastAttemptDate;
    this.lastCorrectDate = params.lastCorrectDate;
    this.masteryLevel = params.masteryLevel;
    this.directionConfidence = params.directionConfidence;
    this.recentAttempts = params.recentAttempts ?? [];
  }

  /**
   * Creates a new LearningProgress for an item.
   */
  static create(itemId: string, itemType: LearningItemType): LearningProgress {
    const progress = new LearningProgress({
      itemId,
      itemType,
      easeFactor: 2.5,
      interval: 0,
      nextReviewDate: new Date(),
      repetitions: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      averageResponseTimeMs: 0,
      lastAttemptDate: null,
      lastCorrectDate: null,
      masteryLevel: MasteryLevel.NEW,
    });

    // Add direction tracking for characters
    if (itemType === 'character') {
      progress.directionConfidence = {
        [Direction.UP]: createDefaultDirectionProgress(),
        [Direction.DOWN]: createDefaultDirectionProgress(),
        [Direction.LEFT]: createDefaultDirectionProgress(),
        [Direction.RIGHT]: createDefaultDirectionProgress(),
        [Direction.PRESS]: createDefaultDirectionProgress(),
      };
    }

    return progress;
  }

  /**
   * Creates a LearningProgress from existing data (e.g., from storage).
   */
  static fromData(data: {
    itemId: string;
    itemType: LearningItemType;
    easeFactor?: number;
    interval?: number;
    nextReviewDate?: Date | string;
    repetitions?: number;
    totalAttempts?: number;
    correctAttempts?: number;
    averageResponseTimeMs?: number;
    lastAttemptDate?: Date | string | null;
    lastCorrectDate?: Date | string | null;
    masteryLevel?: MasteryLevel;
    directionConfidence?: Record<Direction, DirectionProgress>;
    recentAttempts?: AttemptRecord[];
  }): LearningProgress {
    const parseDate = (d: Date | string | null | undefined): Date | null => {
      if (!d) return null;
      return d instanceof Date ? d : new Date(d);
    };

    return new LearningProgress({
      itemId: data.itemId,
      itemType: data.itemType,
      easeFactor: data.easeFactor ?? 2.5,
      interval: data.interval ?? 0,
      nextReviewDate: parseDate(data.nextReviewDate) ?? new Date(),
      repetitions: data.repetitions ?? 0,
      totalAttempts: data.totalAttempts ?? 0,
      correctAttempts: data.correctAttempts ?? 0,
      averageResponseTimeMs: data.averageResponseTimeMs ?? 0,
      lastAttemptDate: parseDate(data.lastAttemptDate),
      lastCorrectDate: parseDate(data.lastCorrectDate),
      masteryLevel: data.masteryLevel ?? MasteryLevel.NEW,
      directionConfidence: data.directionConfidence,
      recentAttempts: data.recentAttempts ?? [],
    });
  }

  /**
   * Calculates and updates the mastery level based on current metrics.
   */
  updateMasteryLevel(): void {
    this.masteryLevel = LearningProgress.calculateMasteryLevel(this);
  }

  /**
   * Calculates a new running average given the current average, a new value, and total count.
   * Uses the incremental mean formula: newAvg = (currentAvg * (n-1) + newValue) / n
   */
  static calculateNewAverage(
    currentAvg: number,
    newValue: number,
    totalCount: number
  ): number {
    if (totalCount <= 1) return newValue;
    return Math.round((currentAvg * (totalCount - 1) + newValue) / totalCount);
  }

  /**
   * Calculates mastery level from progress metrics.
   * Uses a rolling window of recent attempts to determine mastery,
   * allowing users to recover from early mistakes/slowness.
   *
   * - Accuracy: based on last MASTERY_WINDOW_SIZE (5) attempts
   * - Response time: based on last RESPONSE_TIME_WINDOW_SIZE (2) attempts
   *
   * Note: Once MASTERED, items stay MASTERED (no automatic demotion).
   * Users can manually demote items if desired.
   */
  static calculateMasteryLevel(progress: LearningProgress): MasteryLevel {
    const { totalAttempts, recentAttempts, masteryLevel: currentLevel } = progress;

    // Once mastered, stay mastered (no automatic demotion)
    // Users can manually demote if they want to re-learn
    if (currentLevel === MasteryLevel.MASTERED) {
      return MasteryLevel.MASTERED;
    }

    if (totalAttempts === 0) {
      return MasteryLevel.NEW;
    }

    // Mastery is calculated ONLY from recentAttempts (the rolling window)
    // If recentAttempts is empty, this means only learning-phase attempts exist
    // (which use skipMasteryUpdate=true and don't populate recentAttempts)
    // In this case, stay at NEW since no real quiz/practice attempts have been made
    if (recentAttempts.length === 0) {
      return MasteryLevel.NEW;
    }

    // Calculate accuracy from full window (up to MASTERY_WINDOW_SIZE)
    const accuracyCount = recentAttempts.length;
    const correctCount = recentAttempts.filter(a => a.correct).length;
    const recentAccuracy = correctCount / accuracyCount;

    // Calculate response time from last RESPONSE_TIME_WINDOW_SIZE attempts only
    const responseTimeAttempts = recentAttempts.slice(-RESPONSE_TIME_WINDOW_SIZE);
    const recentAvgResponseTime = responseTimeAttempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / responseTimeAttempts.length;

    // Mastered: high accuracy and fast response time
    // Need at least MASTERY_WINDOW_SIZE attempts in the window
    if (recentAccuracy >= MASTERED_ACCURACY_THRESHOLD && recentAvgResponseTime < MASTERED_RESPONSE_TIME_THRESHOLD && accuracyCount >= MASTERY_WINDOW_SIZE) {
      return MasteryLevel.MASTERED;
    }

    // Familiar: moderate accuracy with enough attempts
    if (recentAccuracy >= FAMILIAR_ACCURACY_THRESHOLD && accuracyCount >= MASTERY_WINDOW_SIZE) {
      return MasteryLevel.FAMILIAR;
    }

    // Learning: has been practiced (at least 1 real attempt in recentAttempts)
    return MasteryLevel.LEARNING;
  }

  /**
   * Checks if this item is due for review.
   */
  get isDueForReview(): boolean {
    return new Date() >= this.nextReviewDate;
  }

  /**
   * Gets the accuracy percentage.
   */
  get accuracy(): number {
    if (this.totalAttempts === 0) return 0;
    return this.correctAttempts / this.totalAttempts;
  }

  /**
   * Gets the accuracy as a formatted percentage string.
   */
  get accuracyPercent(): string {
    return `${Math.round(this.accuracy * 100)}%`;
  }

  /**
   * Returns true if this item has been practiced.
   */
  get hasPracticed(): boolean {
    return this.totalAttempts > 0;
  }

  /**
   * Returns true if this item is new (never practiced).
   */
  get isNew(): boolean {
    return this.masteryLevel === MasteryLevel.NEW;
  }

  /**
   * Returns true if this item is mastered.
   */
  get isMastered(): boolean {
    return this.masteryLevel === MasteryLevel.MASTERED;
  }

  /**
   * Returns the number of days since last practice.
   */
  get daysSinceLastPractice(): number | null {
    if (!this.lastAttemptDate) return null;
    const now = new Date();
    const diff = now.getTime() - this.lastAttemptDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Records an attempt and updates statistics.
   * Note: SRS scheduling (interval, nextReviewDate, easeFactor, repetitions)
   * is handled separately by LearningService.calculateNextReview().
   */
  recordAttempt(correct: boolean, responseTimeMs: number): void {
    const now = new Date();

    // Cap response time to prevent AFK/distraction from permanently penalizing progress
    const cappedResponseTime = Math.min(responseTimeMs, MAX_RESPONSE_TIME_PENALTY_MS);

    this.totalAttempts++;
    this.lastAttemptDate = now;

    // Add to rolling window for mastery calculation
    this.recentAttempts.push({
      correct,
      responseTimeMs: cappedResponseTime,
      timestamp: now.getTime(),
    });

    // Keep only the last MASTERY_WINDOW_SIZE attempts
    if (this.recentAttempts.length > MASTERY_WINDOW_SIZE) {
      this.recentAttempts = this.recentAttempts.slice(-MASTERY_WINDOW_SIZE);
    }

    if (correct) {
      this.correctAttempts++;
      this.lastCorrectDate = now;
    }

    // Update average response time from rolling window (last N attempts)
    // This reflects current skill level, not historical baggage
    this.averageResponseTimeMs = this.calculateRollingAverageResponseTime();

    // Update mastery level
    this.updateMasteryLevel();
  }

  /**
   * Calculates the average response time from the rolling window of recent attempts.
   */
  private calculateRollingAverageResponseTime(): number {
    if (this.recentAttempts.length === 0) return 0;

    const windowAttempts = this.recentAttempts.slice(-RESPONSE_TIME_WINDOW_SIZE);
    const sum = windowAttempts.reduce((total, attempt) => total + attempt.responseTimeMs, 0);
    return Math.round(sum / windowAttempts.length);
  }

  /**
   * Records a direction-specific attempt (for characters).
   */
  recordDirectionAttempt(
    direction: Direction,
    correct: boolean,
    responseTimeMs: number
  ): void {
    if (!this.directionConfidence) return;

    // Cap response time to prevent AFK/distraction penalties
    const cappedResponseTime = Math.min(responseTimeMs, MAX_RESPONSE_TIME_PENALTY_MS);

    const dirProgress = this.directionConfidence[direction];
    dirProgress.attempts++;
    if (correct) {
      dirProgress.correct++;
    }
    dirProgress.lastPracticed = new Date();

    // Update average time (using capped value)
    dirProgress.averageTimeMs = LearningProgress.calculateNewAverage(
      dirProgress.averageTimeMs,
      cappedResponseTime,
      dirProgress.attempts
    );
  }

  /**
   * Gets the direction with lowest accuracy (for targeted practice).
   */
  getWeakestDirection(): Direction | null {
    if (!this.directionConfidence) return null;

    let weakest: Direction | null = null;
    let lowestAccuracy = 1;

    for (const [dir, progress] of Object.entries(this.directionConfidence) as [Direction, DirectionProgress][]) {
      if (progress.attempts > 0) {
        const acc = progress.correct / progress.attempts;
        if (acc < lowestAccuracy) {
          lowestAccuracy = acc;
          weakest = dir;
        }
      } else {
        // Unpracticed directions are weakest
        return dir;
      }
    }

    return weakest;
  }

  /**
   * Manually demotes the item from MASTERED to FAMILIAR.
   * This allows users to re-practice items they feel they need to review.
   * Clears recent attempts so the item can be re-evaluated.
   */
  demote(): void {
    if (this.masteryLevel === MasteryLevel.MASTERED) {
      this.masteryLevel = MasteryLevel.FAMILIAR;
      // Clear recent attempts so the user can build up fresh data
      this.recentAttempts = [];
      // Set next review to now so it appears in review queue
      this.nextReviewDate = new Date();
    }
  }

  /**
   * Creates a copy of this progress.
   */
  clone(): LearningProgress {
    return LearningProgress.fromData({
      itemId: this.itemId,
      itemType: this.itemType,
      easeFactor: this.easeFactor,
      interval: this.interval,
      nextReviewDate: new Date(this.nextReviewDate),
      repetitions: this.repetitions,
      totalAttempts: this.totalAttempts,
      correctAttempts: this.correctAttempts,
      averageResponseTimeMs: this.averageResponseTimeMs,
      lastAttemptDate: this.lastAttemptDate ? new Date(this.lastAttemptDate) : null,
      lastCorrectDate: this.lastCorrectDate ? new Date(this.lastCorrectDate) : null,
      masteryLevel: this.masteryLevel,
      directionConfidence: this.directionConfidence
        ? { ...this.directionConfidence }
        : undefined,
      recentAttempts: [...this.recentAttempts],
    });
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `LearningProgress(${this.itemId}, ${this.itemType}, mastery=${this.masteryLevel})`;
  }
}

/**
 * Default values for new learning progress.
 */
export const DEFAULT_LEARNING_PROGRESS = {
  easeFactor: 2.5,
  interval: 0,
  nextReviewDate: new Date(),
  repetitions: 0,
  totalAttempts: 0,
  correctAttempts: 0,
  averageResponseTimeMs: 0,
  lastAttemptDate: null,
  lastCorrectDate: null,
  masteryLevel: MasteryLevel.NEW,
};

/**
 * Learning Configuration
 *
 * Constants and helper functions for the spaced repetition system (SRS).
 * Based on SM-2 algorithm with modifications for motor skill learning.
 */

import { LearningProgress, LearningItemType, MasteryLevel } from '../../domain';

// ==================== Expected Response Times ====================

/**
 * Expected response times in milliseconds by item type and skill level.
 * Used to calculate quality ratings.
 */
export const EXPECTED_RESPONSE_TIMES_MS = {
  character: {
    beginner: 2000,     // 2 seconds for new learners
    intermediate: 1000, // 1 second with some practice
    advanced: 500,      // 0.5 seconds when mastered
  },
  powerChord: {
    beginner: 3000,     // 3 seconds - need to coordinate two fingers
    intermediate: 1500, // 1.5 seconds with practice
    advanced: 750,      // 0.75 seconds when mastered
  },
  word: {
    beginner: 4000,     // 4 seconds - multiple keys
    intermediate: 2000, // 2 seconds with practice
    advanced: 1000,     // 1 second when mastered
  },
} as const;

/**
 * Gets the expected response time based on item type and mastery level.
 */
export function getExpectedTime(
  itemType: LearningItemType,
  masteryLevel: MasteryLevel
): number {
  const times = EXPECTED_RESPONSE_TIMES_MS[itemType];

  switch (masteryLevel) {
    case MasteryLevel.NEW:
    case MasteryLevel.LEARNING:
      return times.beginner;
    case MasteryLevel.FAMILIAR:
      return times.intermediate;
    case MasteryLevel.MASTERED:
      return times.advanced;
    default:
      return times.beginner;
  }
}

// ==================== Accelerated Intervals ====================

/**
 * Initial interval progression by item type.
 * Characters use accelerated intervals since they're foundational.
 * Values are in days (fractions allowed for hours).
 */
export const INITIAL_INTERVALS: Record<LearningItemType, readonly number[]> = {
  character: [
    2 / 1440,  // 2 minutes
    10 / 1440, // 10 minutes
    1 / 24,    // 1 hour
    4 / 24,    // 4 hours
    1,         // 1 day
    3,         // 3 days
    7,         // 1 week
    14,        // 2 weeks
    30,        // 1 month
  ],
  powerChord: [
    2 / 1440,  // 2 minutes
    10 / 1440, // 10 minutes
    1 / 24,    // 1 hour
    4 / 24,    // 4 hours
    1,         // 1 day
    3,         // 3 days
    7,         // 1 week
    14,        // 2 weeks
  ],
  word: [
    2 / 1440,  // 2 minutes
    10 / 1440, // 10 minutes
    1 / 24,    // 1 hour
    1,         // 1 day
    6,         // 6 days
    // Then calculated by easeFactor
  ],
} as const;

/**
 * Gets the initial interval for a repetition count.
 * Returns undefined if should use standard SM-2 calculation.
 */
export function getInitialInterval(
  itemType: LearningItemType,
  repetitions: number
): number | undefined {
  const intervals = INITIAL_INTERVALS[itemType];
  if (repetitions < intervals.length) {
    return intervals[repetitions];
  }
  return undefined;
}

// ==================== Mastery Thresholds ====================

/**
 * Thresholds for determining when an item is considered "mastered".
 */
export const MASTERY_THRESHOLDS = {
  /** Minimum successful repetitions for mastery */
  minRepetitions: 5,

  /** Minimum ease factor for mastery */
  minEaseFactor: 2.0,

  /** Minimum accuracy percentage (0-1) */
  minAccuracy: 0.85,

  /** Minimum interval (days) to be considered mastered */
  minInterval: 7,

  /** Maximum response time for mastery (ms) */
  maxResponseTimeMs: 800,
} as const;

/**
 * Standalone function to check if an item is mastered.
 * More thorough than the LearningProgress.calculateMasteryLevel.
 */
export function isItemMastered(progress: LearningProgress): boolean {
  return (
    progress.repetitions >= MASTERY_THRESHOLDS.minRepetitions &&
    progress.easeFactor >= MASTERY_THRESHOLDS.minEaseFactor &&
    progress.accuracy >= MASTERY_THRESHOLDS.minAccuracy &&
    progress.interval >= MASTERY_THRESHOLDS.minInterval &&
    (progress.averageResponseTimeMs === 0 ||
      progress.averageResponseTimeMs <= MASTERY_THRESHOLDS.maxResponseTimeMs)
  );
}

// ==================== Quality Rating Helpers ====================

/**
 * Quality rating descriptions for UI display.
 */
export const QUALITY_DESCRIPTIONS = {
  0: 'Complete blackout',
  1: 'Wrong, but recognized correct answer',
  2: 'Wrong, but correct felt familiar',
  3: 'Correct with difficulty',
  4: 'Correct with slight hesitation',
  5: 'Perfect, immediate recall',
} as const;

/**
 * Maps quality rating to a friendly label.
 */
export function getQualityLabel(quality: 0 | 1 | 2 | 3 | 4 | 5): string {
  const labels: Record<number, string> = {
    0: 'Blackout',
    1: 'Wrong',
    2: 'Almost',
    3: 'Hard',
    4: 'Good',
    5: 'Perfect',
  };
  return labels[quality];
}

// ==================== SM-2 Algorithm Constants ====================

/**
 * SM-2 algorithm constants.
 */
export const SM2_CONSTANTS = {
  /** Default ease factor for new items */
  defaultEaseFactor: 2.5,

  /** Minimum ease factor (prevents items from becoming too difficult) */
  minEaseFactor: 1.3,

  /** Maximum ease factor */
  maxEaseFactor: 3.5,

  /** Quality threshold for successful review (>= this value = success) */
  successThreshold: 3,

  /** Initial interval after first successful review (days) */
  initialInterval: 1,

  /** Second interval after two successful reviews (days) */
  secondInterval: 6,

  /** Maximum interval for mastered items (days) - 6 months */
  maxIntervalMastered: 180,

  /** Maximum interval for non-mastered items (days) - 2 weeks */
  maxIntervalNotMastered: 14,
} as const;

// ==================== Learning Session Config ====================

/**
 * Configuration for learning sessions.
 */
export const SESSION_CONFIG = {
  /** Maximum new items to introduce per session */
  maxNewItemsPerSession: 5,

  /** Maximum items to review per session */
  maxReviewsPerSession: 20,

  /** Ideal session length in minutes */
  idealSessionMinutes: 10,

  /** Break reminder interval in minutes */
  breakReminderMinutes: 25,

  /** Minimum time between reviews of same item (ms) */
  minTimeBetweenReviews: 30000, // 30 seconds
} as const;

// ==================== Confidence Level Helpers ====================

/**
 * Confidence level thresholds.
 */
export const CONFIDENCE_THRESHOLDS = {
  strong: {
    minAccuracy: 0.9,
    maxResponseTimeMs: 800,
    minAttempts: 10,
  },
  moderate: {
    minAccuracy: 0.7,
    maxResponseTimeMs: 1500,
    minAttempts: 5,
  },
  // Below moderate = weak
} as const;

/**
 * Gets the confidence level for a progress record.
 */
export function getConfidenceLevel(
  progress: LearningProgress
): 'weak' | 'moderate' | 'strong' {
  if (progress.totalAttempts < CONFIDENCE_THRESHOLDS.moderate.minAttempts) {
    return 'weak';
  }

  const avgTime = progress.averageResponseTimeMs;

  if (
    progress.totalAttempts >= CONFIDENCE_THRESHOLDS.strong.minAttempts &&
    progress.accuracy >= CONFIDENCE_THRESHOLDS.strong.minAccuracy &&
    avgTime <= CONFIDENCE_THRESHOLDS.strong.maxResponseTimeMs
  ) {
    return 'strong';
  }

  if (
    progress.accuracy >= CONFIDENCE_THRESHOLDS.moderate.minAccuracy &&
    avgTime <= CONFIDENCE_THRESHOLDS.moderate.maxResponseTimeMs
  ) {
    return 'moderate';
  }

  return 'weak';
}

/**
 * Gets the confidence level from raw metrics (without a LearningProgress object).
 * Useful for aggregated progress data like FingerProgress.
 */
export function getConfidenceLevelFromMetrics(
  accuracy: number,
  totalAttempts: number,
  averageResponseTimeMs: number = 0
): 'weak' | 'moderate' | 'strong' {
  if (totalAttempts < CONFIDENCE_THRESHOLDS.moderate.minAttempts) {
    return 'weak';
  }

  // If no response time data, use a permissive default
  const avgTime = averageResponseTimeMs || CONFIDENCE_THRESHOLDS.moderate.maxResponseTimeMs;

  if (
    totalAttempts >= CONFIDENCE_THRESHOLDS.strong.minAttempts &&
    accuracy >= CONFIDENCE_THRESHOLDS.strong.minAccuracy &&
    avgTime <= CONFIDENCE_THRESHOLDS.strong.maxResponseTimeMs
  ) {
    return 'strong';
  }

  if (
    accuracy >= CONFIDENCE_THRESHOLDS.moderate.minAccuracy &&
    avgTime <= CONFIDENCE_THRESHOLDS.moderate.maxResponseTimeMs
  ) {
    return 'moderate';
  }

  return 'weak';
}

// ==================== Cross-Hand Timing Thresholds ====================

/**
 * Timing tolerance thresholds for cross-hand power chords.
 * Lower values require more precise synchronization.
 */
export const CROSS_HAND_TIMING_THRESHOLDS = {
  /** Easy tolerance for beginners */
  beginner: 100,
  /** Moderate tolerance for intermediate users */
  intermediate: 75,
  /** Strict tolerance for advanced users */
  advanced: 50,
  /** Expert-level precision */
  expert: 30,
} as const;

/**
 * Gets the appropriate cross-hand timing tolerance based on progress.
 */
export function getCrossHandTolerance(progress: LearningProgress): number {
  if (progress.accuracy < 0.6) return CROSS_HAND_TIMING_THRESHOLDS.beginner;
  if (progress.accuracy < 0.75) return CROSS_HAND_TIMING_THRESHOLDS.intermediate;
  if (progress.accuracy < 0.9) return CROSS_HAND_TIMING_THRESHOLDS.advanced;
  return CROSS_HAND_TIMING_THRESHOLDS.expert;
}

// ==================== Review Scheduling ====================

/**
 * Weight factors for item selection priority.
 */
export const SELECTION_WEIGHTS = {
  /** Base weight multiplier for failed items */
  failedMultiplier: 4,

  /** Weight boost per day overdue (divided by 24 for hours) */
  overdueBoostPerDay: 1,

  /** Bonus weight for items with few attempts */
  lowAttemptBonus: 0.5,

  /** Threshold for "low attempt" count */
  lowAttemptThreshold: 3,

  /** Minimum base weight (ensures all items can be selected) */
  minBaseWeight: 0.1,
} as const;

/**
 * Calculates selection weight for an item.
 * Higher weight = more likely to be selected.
 */
export function calculateSelectionWeight(progress: LearningProgress): number {
  let weight = SELECTION_WEIGHTS.minBaseWeight;

  // Failed items get higher weight
  const failRatio = 1 - progress.accuracy;
  weight += failRatio * SELECTION_WEIGHTS.failedMultiplier;

  // Overdue items get weight boost
  const now = new Date();
  const hoursSinceReview = Math.max(
    0,
    (now.getTime() - progress.nextReviewDate.getTime()) / (1000 * 60 * 60)
  );
  weight += (hoursSinceReview / 24) * SELECTION_WEIGHTS.overdueBoostPerDay;

  // Low attempt items get a boost (for exposure)
  if (progress.totalAttempts < SELECTION_WEIGHTS.lowAttemptThreshold) {
    weight += SELECTION_WEIGHTS.lowAttemptBonus;
  }

  return weight;
}

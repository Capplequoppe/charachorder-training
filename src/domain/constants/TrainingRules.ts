/**
 * Training Rules - Centralized business rules for training sessions.
 *
 * This file contains all training-related constants that were previously
 * scattered across components as magic numbers. Having them in one place:
 * - Makes rules discoverable and documentable
 * - Prevents divergence when the same rule is used in multiple places
 * - Makes testing easier (can import and verify against)
 *
 * Note: SRS-related constants remain in learningConfig.ts
 * This file is specifically for training session rules.
 *
 * @module domain/constants
 */

// ==================== Completion Criteria ====================

/**
 * Number of successful attempts required to complete an item in practice mode.
 *
 * Previously hardcoded as:
 * - IntraHandTraining.tsx:239 `successes + 1 >= 5`
 * - CrossHandTraining.tsx:285 `successes + 1 >= 5`
 */
export const SUCCESSES_REQUIRED_FOR_COMPLETION = 5;

/**
 * Number of sync successes required to complete sync practice phase.
 *
 * Previously hardcoded as:
 * - IntraHandTraining.tsx:495 `syncSuccesses >= 3`
 * - CrossHandTraining.tsx:279 `syncSuccesses + 1 >= 3`
 */
export const SYNC_SUCCESSES_REQUIRED = 3;

/**
 * Number of attempts per item in quiz mode.
 * Quiz mode gives one chance per item, then moves on.
 */
export const QUIZ_ATTEMPTS_PER_ITEM = 1;

// ==================== Timing Constants ====================

/**
 * Duration to display feedback (correct/incorrect) before advancing.
 * In milliseconds.
 *
 * Previously hardcoded as:
 * - IntraHandTraining.tsx:220 `setTimeout(() => {...}, 400)`
 * - CrossHandTraining.tsx:244 `setTimeout(() => {...}, 400)`
 */
export const FEEDBACK_DISPLAY_MS = 400;

/**
 * Delay before transitioning to the next phase.
 * In milliseconds.
 *
 * Previously hardcoded inconsistently as:
 * - IntraHandTraining.tsx:496 `setTimeout(() => setPhase("practice"), 600)`
 * - CrossHandTraining.tsx:281 `setTimeout(() => {...}, 500)`
 */
export const PHASE_TRANSITION_DELAY_MS = 500;

/**
 * Delay after completing an item before moving to next.
 * In milliseconds.
 */
export const ITEM_COMPLETION_DELAY_MS = 500;

/**
 * Minimum time between accepting inputs (debounce).
 * Prevents double-processing of rapid inputs.
 * In milliseconds.
 */
export const INPUT_DEBOUNCE_MS = 100;

// ==================== Sync Practice Timing ====================

/**
 * Timing tolerance for intra-hand (same hand) sync practice.
 * Keys must be pressed within this many milliseconds of each other.
 *
 * Previously defined in IntraHandTraining.tsx:33 `SYNC_TOLERANCE_MS = 80`
 */
export const INTRA_HAND_SYNC_TOLERANCE_MS = 80;

/**
 * Cross-hand timing thresholds by skill level.
 * Lower values require more precise synchronization.
 *
 * Note: These are also defined in crossHandConfig.ts.
 * When using cross-hand timing, prefer importing from there.
 */
export const CROSS_HAND_TIMING = {
  /** Easy tolerance for beginners */
  beginner: 100,
  /** Moderate tolerance for intermediate users */
  intermediate: 75,
  /** Strict tolerance for advanced users */
  advanced: 50,
  /** Expert-level precision */
  expert: 30,
} as const;

// ==================== Boss Mode ====================

/**
 * Minimum percentage of items mastered to unlock boss challenge.
 *
 * Previously hardcoded in TrainingModeSelector.tsx:84
 * `(itemsMastered / totalItems) >= 0.75`
 */
export const BOSS_UNLOCK_MASTERY_PERCENT = 0.75;

/**
 * Whether all items must be at least familiar to unlock boss.
 *
 * Previously: `(itemsMastered + itemsFamiliar) === totalItems`
 */
export const BOSS_UNLOCK_REQUIRES_ALL_FAMILIAR = true;

// ==================== CharaChorder Input Detection ====================

/**
 * Maximum duration for chord input to be considered a chord (not typing).
 * If characters arrive faster than this, it's likely a chord.
 * In milliseconds.
 *
 * This should match the value in InputService.
 */
export const CHORD_MAX_DURATION_MS = 50;

/**
 * Multiplier for chord timing tolerance in text input detection.
 * Used when distinguishing chord output from manual typing.
 */
export const CHORD_TIMING_TOLERANCE_MULTIPLIER = 2;

// ==================== Training Rules Object ====================

/**
 * All training rules as a single object.
 * Useful for passing to components or services that need multiple rules.
 */
export const TRAINING_RULES = {
  // Completion
  successesRequired: SUCCESSES_REQUIRED_FOR_COMPLETION,
  syncSuccessesRequired: SYNC_SUCCESSES_REQUIRED,
  quizAttemptsPerItem: QUIZ_ATTEMPTS_PER_ITEM,

  // Timing
  feedbackDisplayMs: FEEDBACK_DISPLAY_MS,
  phaseTransitionDelayMs: PHASE_TRANSITION_DELAY_MS,
  itemCompletionDelayMs: ITEM_COMPLETION_DELAY_MS,
  inputDebounceMs: INPUT_DEBOUNCE_MS,

  // Sync
  intraHandSyncToleranceMs: INTRA_HAND_SYNC_TOLERANCE_MS,
  crossHandTiming: CROSS_HAND_TIMING,

  // Boss
  bossUnlockMasteryPercent: BOSS_UNLOCK_MASTERY_PERCENT,
  bossUnlockRequiresAllFamiliar: BOSS_UNLOCK_REQUIRES_ALL_FAMILIAR,

  // Input
  chordMaxDurationMs: CHORD_MAX_DURATION_MS,
  chordTimingToleranceMultiplier: CHORD_TIMING_TOLERANCE_MULTIPLIER,
} as const;

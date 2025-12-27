/**
 * Domain Constants
 *
 * Centralized constants for the domain layer.
 * These are business rules that should be consistent across the application.
 *
 * @module domain/constants
 */

export {
  // Completion criteria
  SUCCESSES_REQUIRED_FOR_COMPLETION,
  SYNC_SUCCESSES_REQUIRED,
  QUIZ_ATTEMPTS_PER_ITEM,

  // Timing
  FEEDBACK_DISPLAY_MS,
  PHASE_TRANSITION_DELAY_MS,
  ITEM_COMPLETION_DELAY_MS,
  INPUT_DEBOUNCE_MS,

  // Sync practice
  INTRA_HAND_SYNC_TOLERANCE_MS,
  CROSS_HAND_TIMING,

  // Boss mode
  BOSS_UNLOCK_MASTERY_PERCENT,
  BOSS_UNLOCK_REQUIRES_ALL_FAMILIAR,

  // Input detection
  CHORD_MAX_DURATION_MS,
  CHORD_TIMING_TOLERANCE_MULTIPLIER,

  // Combined object
  TRAINING_RULES,
} from './TrainingRules';

// Difficulty configuration
export {
  DIFFICULTY_PRESETS,
  getDifficultyConfig,
  getDifficultyConfigForMode,
  getAvailableDifficulties,
  getTimeLimitMs,
  getDifficultyOrder,
  isValidDifficultyId,
  getDefaultDifficulty,
} from './DifficultyConfig';

export type { DifficultyId, DifficultyConfig, DifficultyMode } from './DifficultyConfig';

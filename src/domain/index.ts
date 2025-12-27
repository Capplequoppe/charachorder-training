/**
 * CharaChorder Trainer Domain Layer
 *
 * This module exports all domain models used throughout the application.
 * The domain layer follows Domain-Driven Design principles:
 *
 * - Enums: Categorical types with fixed values (Hand, Direction, FingerType)
 * - Entities: Objects with identity (Finger, Character, PowerChord)
 * - Value Objects: Immutable objects defined by attributes (ColorDefinition, NoteDefinition)
 * - Aggregates: Clusters of related objects (Chord, Word, LearningProgress)
 *
 * Key Design Decisions:
 * 1. All models are TypeScript classes with static factory methods
 * 2. Enums use string values for debuggability and serialization
 * 3. No dependencies on React or infrastructure concerns
 *
 * @module domain
 */

// Enums
export {
  Hand,
  Direction,
  FingerType,
  ALL_DIRECTIONS,
  CARDINAL_DIRECTIONS,
  FINGER_TYPES_IN_ORDER,
  FINGER_TYPE_DISPLAY_NAMES,
} from './enums';

// Entities
export {
  Finger,
  Character,
  PowerChord,
  LEFT_FINGER_IDS,
  RIGHT_FINGER_IDS,
  ALL_FINGER_IDS,
  INTERVAL_NAMES,
  // TrainableItem adapters
  powerChordToTrainableItem,
  wordToTrainableItem,
  isPowerChordItem,
  isWordItem,
} from './entities';

export type {
  FingerId,
  VisualPosition,
  PowerChordHand,
  // TrainableItem types
  TrainableItem,
  TrainableItemType,
  DisplayCharacter,
} from './entities';

// Value Objects
export {
  ColorDefinition,
  NoteDefinition,
} from './valueObjects';

export type { AudioVariation } from './valueObjects';

// Aggregates
export {
  // Enums
  MasteryLevel,
  SemanticCategory,

  // Classes
  Chord,
  Word,
  LearningProgress,

  // Constants
  DEFAULT_LEARNING_PROGRESS,
  MASTERY_WINDOW_SIZE,
  RESPONSE_TIME_WINDOW_SIZE,
  FAMILIAR_ACCURACY_THRESHOLD,
  MASTERED_ACCURACY_THRESHOLD,
  MASTERED_RESPONSE_TIME_THRESHOLD,
  MAX_RESPONSE_TIME_PENALTY_MS,
  SEMANTIC_CATEGORY_NAMES,
  SEMANTIC_CATEGORY_ICONS,
} from './aggregates';

export type { DirectionProgress, LearningItemType, AttemptRecord } from './aggregates';

// Strategies
export {
  DEFAULT_COMPLETION_CRITERIA,
  QUIZ_COMPLETION_CRITERIA,
  // Concrete strategies
  LearnModeStrategy,
  ReviewDueModeStrategy,
  ReviewAllModeStrategy,
  SurvivalModeStrategy,
  BossModeStrategy,
} from './strategies';

export type {
  TrainingMode,
  TrainingPhase,
  CompletionCriteria,
  ModeDisplayConfig,
  TrainingModeStrategy,
} from './strategies';

// Constants
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

  // Difficulty configuration
  DIFFICULTY_PRESETS,
  getDifficultyConfig,
  getDifficultyConfigForMode,
  getAvailableDifficulties,
  getTimeLimitMs,
  getDifficultyOrder,
  isValidDifficultyId,
  getDefaultDifficulty,
} from './constants';

export type { DifficultyId, DifficultyConfig, DifficultyMode } from './constants';

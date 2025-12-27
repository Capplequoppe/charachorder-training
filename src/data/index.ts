/**
 * Data Layer
 *
 * This module provides data access through the Repository pattern.
 * It centralizes all data operations and provides a consistent API
 * for accessing fingers, characters, chords, words, and user progress.
 *
 * Architecture:
 * - repositories/: Data access interfaces and implementations
 * - static/: Source-of-truth configuration files
 * - storage/: Persistence layer (LocalStorage)
 *
 * Usage:
 * ```typescript
 * import { getRepositories } from '@/data';
 *
 * const { fingers, characters, powerChords, words, progress } = getRepositories();
 *
 * // Access finger data
 * const allFingers = fingers.getAll();
 * const leftHand = fingers.getByHand(Hand.LEFT);
 *
 * // Access character mappings
 * const charE = characters.getByChar('e');
 *
 * // Track user progress
 * const charProgress = progress.getOrCreate('e', 'character');
 * ```
 *
 * @module data
 */

// Repository factory
export {
  createRepositories,
  getRepositories,
  resetRepositories,
} from './repositoryFactory';
export type { Repositories } from './repositoryFactory';

// Repository interfaces and implementations
export {
  FingerRepository,
  CharacterRepository,
  PowerChordRepository,
  WordRepository,
  ProgressRepository,
  ExtensionRepository,
} from './repositories';
export type {
  IFingerRepository,
  ICharacterRepository,
  IPowerChordRepository,
  IWordRepository,
  IProgressRepository,
  IExtensionRepository,
  ProgressStats,
  ExtensionPath,
} from './repositories';

// Static configuration (for direct access when needed)
export {
  FINGER_CONFIG,
  FINGERS_IN_ORDER,
  CHARACTER_CONFIG,
  POWER_CHORD_CONFIG,
  FINGER_COLORS,
  getFingerColor,
  getAllFingerColors,
  getFingerColorName,
  FINGER_NOTES,
  AUDIO_DURATIONS,
  CHORD_STAGGER,
  INTERVAL_CONSONANCE,
  OPTIMIZED_INTERVALS,
  getInterval,
  getFingerPairConsonance,
  getFingerFrequency,
  getFingerAudioVariation,
  fingerHasSound,
  getFingersWithSound,
  // Learning config
  EXPECTED_RESPONSE_TIMES_MS,
  getExpectedTime,
  INITIAL_INTERVALS,
  getInitialInterval,
  MASTERY_THRESHOLDS,
  isItemMastered,
  QUALITY_DESCRIPTIONS,
  getQualityLabel,
  SM2_CONSTANTS,
  SESSION_CONFIG,
  CONFIDENCE_THRESHOLDS,
  getConfidenceLevel,
  SELECTION_WEIGHTS,
  calculateSelectionWeight,
  CROSS_HAND_TIMING_THRESHOLDS,
  getCrossHandTolerance,
} from './static';
export type { FingerColorConfig, FingerAudioConfig, IntervalType, ChordExtension, SemanticCategory, CategoryDefinition } from './static';

// Chord extension data
export {
  CHORD_EXTENSIONS,
  EXTENSIONS_BY_BASE,
  getExtensionsForBase,
  getExtensionByWord,
  getExtensionsByCategory,
  getBaseChordIdsWithExtensions,
} from './static';

// Semantic categories
export {
  CATEGORY_DEFINITIONS,
  CATEGORY_MAP,
  WORD_CATEGORIES,
  getWordCategory,
  getCategoryDefinition,
  getWordsByCategory,
  getCategoryIcon,
  getCategoryColor,
  getCategoryDisplayName,
  getCategoriesByPriority,
} from './static';

// Challenge configuration
export {
  TIME_ATTACK_PRESETS,
  SPRINT_PRESETS,
  SCORING_CONFIG,
  getTimeAttackPresets,
  getSprintPresets,
  getTimeAttackById,
  getSprintById,
  getMedalForTime,
  getMedalColor,
  getMedalEmoji,
  getDifficultyColor,
  getItemTypeDisplayName,
} from './static';
export type {
  ChallengeType,
  ItemType,
  Difficulty,
  Medal,
  TimeAttackConfig,
  SprintConfig,
} from './static';

// Combo configuration
export {
  COMBO_TIERS,
  getComboTier,
  getNextComboTier,
  getComboProgress,
  getStreaksToNextTier,
  isNewTier,
  getComboTierIndex,
  getComboTierThresholds,
} from './static';
export type { ComboTier } from './static';

// Storage utilities
export {
  storage,
  STORAGE_KEYS,
} from './storage';

// Re-export existing chord data for backwards compatibility
export { CHORD_DATA } from './chords';
export type { ChordEntry, WordEntry } from './types';

// Data models
export type {
  DailyStats,
  WeeklyStats,
  MonthlyOverview,
  ItemType as AnalyticsItemType,
  ItemAnalytics,
  SkillTrend,
  SkillLevel,
  SkillAnalytics,
  FingerHeatmapData,
  DistributionData,
  ProgressPoint,
  ProgressTrend,
  WpmTrend,
  AccuracyTrend,
  InsightType,
  Insight,
  RecommendationPriority,
  Recommendation,
} from './models';
export {
  createEmptyDailyStats,
  createEmptyWeeklyStats,
  createEmptyMonthlyOverview,
} from './models';

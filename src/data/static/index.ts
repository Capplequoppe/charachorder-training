/**
 * Static configuration exports.
 * These are the source-of-truth data files for the application.
 */

export {
  FINGER_COLORS,
  COLOR_VARIATION_AMOUNTS,
  DIRECTION_SYMBOLS,
  DIRECTION_NAMES,
  getFingerColor,
  getAllFingerColors,
  getFingerColorName,
} from './colorConfig';
export type { FingerColorConfig } from './colorConfig';

export {
  FINGER_CONFIG,
  FINGERS_IN_ORDER,
  getAllFingers,
  getFingersWithCharacters,
} from './fingerConfig';

export {
  CHARACTER_CONFIG,
  CHAR_TO_CONFIG,
  FINGER_DIRECTION_TO_CHAR,
  getCharsForFinger,
  getConfigForChar,
  getCharForFingerDirection,
  ALL_CHARACTERS,
  CHARS_PER_FINGER,
} from './characterConfig';
export type { CharacterConfigEntry } from './characterConfig';

export {
  POWER_CHORD_CONFIG,
  POWER_CHORD_MAP,
  getPowerChordsByHand,
  getPowerChordsWithChar,
  getTopPowerChords,
} from './powerChordConfig';
export type { PowerChordConfigEntry } from './powerChordConfig';

export {
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
  getFingerNoteOrThrow,
  getFingerNoteName,
} from './audioConfig';
export type { FingerAudioConfig, IntervalType } from './audioConfig';

export {
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
} from './learningConfig';

export {
  CHORD_EXTENSIONS,
  EXTENSIONS_BY_BASE,
  EXTENSION_BY_WORD,
  getExtensionsForBase,
  getExtensionByWord,
  getExtensionsByCategory,
  getBaseChordIdsWithExtensions,
  getExtensionCount,
} from './chordExtensions';
export type { ChordExtension } from './chordExtensions';

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
} from './semanticCategories';
export type { SemanticCategory, CategoryDefinition } from './semanticCategories';

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
} from './challengeConfig';
export type {
  ChallengeType,
  ItemType,
  Difficulty,
  Medal,
  TimeAttackConfig,
  SprintConfig,
} from './challengeConfig';

export {
  COMBO_TIERS,
  getComboTier,
  getNextComboTier,
  getComboProgress,
  getStreaksToNextTier,
  isNewTier,
  getComboTierIndex,
  getComboTierThresholds,
} from './comboConfig';
export type { ComboTier } from './comboConfig';

export {
  AchievementCategory,
  TIER_COLORS,
  TIER_XP,
  ACHIEVEMENTS,
  getTierColor,
  getTierXp,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByTier,
  getVisibleAchievements,
  getAchievementsWithRewards,
  getCategoryDisplayName as getAchievementCategoryDisplayName,
  getCategoryIcon as getAchievementCategoryIcon,
} from './achievements';
export type {
  AchievementTier,
  CriteriaType,
  AchievementCriteria,
  Reward,
  AchievementDefinition,
} from './achievements';

export {
  PRACTICE_SENTENCES,
  SENTENCE_CATEGORIES,
  getSentencesByDifficulty,
  getSentencesByCategory,
  getSentences,
  getRandomSentence,
  getSentenceById,
  getSentenceCategoryInfo,
  getSentenceCountByDifficulty,
  getSentencesByChordCoverage,
  getSentencesWithMinCoverage,
  getTotalWordCount,
  getUniqueWords,
} from './sentences';
export type {
  SentenceCategory,
  SentenceDifficulty,
  PracticeSentence,
  SentenceCategoryInfo,
} from './sentences';

export {
  TRANSCRIPTION_TEXTS,
  TRANSCRIPTION_CATEGORIES,
  getTextsByDifficulty,
  getTextsByCategory,
  getTexts,
  getRandomText,
  getTextById,
  getTranscriptionCategoryInfo,
  getTextCountByDifficulty,
  getTextsByTime,
  getTextsWithMinChordable,
  getTotalCharacterCount,
} from './transcriptionTexts';
export type {
  TranscriptionCategory,
  TranscriptionDifficulty,
  TranscriptionText,
  TranscriptionCategoryInfo,
} from './transcriptionTexts';

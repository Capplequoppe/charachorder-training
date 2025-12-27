/**
 * Difficulty Configuration
 *
 * Unified difficulty settings used across quiz, survival, and endless modes.
 * Replaces duplicated DIFFICULTY_SETTINGS/DIFFICULTY_CONFIG definitions in:
 * - QuizMode.tsx
 * - SurvivalGame.tsx
 * - CharacterQuiz.tsx
 *
 * @module domain/constants/DifficultyConfig
 */

/**
 * Canonical difficulty identifiers ordered from easiest to hardest.
 */
export type DifficultyId = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Complete difficulty configuration with all settings needed by any mode.
 */
export interface DifficultyConfig {
  /** Unique identifier */
  id: DifficultyId;
  /** Display label */
  label: string;
  /** Human-readable description */
  description: string;
  /** Time limit in milliseconds */
  timeLimitMs: number;
  /** Maximum attempts allowed (for quiz modes) */
  maxAttempts: number;
  /** Whether to show hints (finger hints, etc.) */
  showHints: boolean;
}

/**
 * Standard difficulty presets used across all modes.
 * Individual modes may use a subset of these difficulties.
 */
export const DIFFICULTY_PRESETS: Record<DifficultyId, DifficultyConfig> = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    description: '10 seconds per item',
    timeLimitMs: 10000,
    maxAttempts: 5,
    showHints: true,
  },
  easy: {
    id: 'easy',
    label: 'Easy',
    description: '5 seconds per item',
    timeLimitMs: 5000,
    maxAttempts: 3,
    showHints: true,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    description: '2 seconds per item',
    timeLimitMs: 2000,
    maxAttempts: 2,
    showHints: false,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: '1 second per item',
    timeLimitMs: 1000,
    maxAttempts: 1,
    showHints: false,
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    description: '500ms per item',
    timeLimitMs: 500,
    maxAttempts: 1,
    showHints: false,
  },
};

/**
 * Mode types that can use difficulty configuration.
 */
export type DifficultyMode = 'quiz' | 'survival' | 'endless' | 'character-quiz';

/**
 * Mapping of modes to their available difficulty levels.
 * - quiz: Excludes beginner (original QuizMode behavior)
 * - survival: Uses beginner, medium (as "intermediate"), expert
 * - endless/character-quiz: All 5 levels
 */
const MODE_DIFFICULTIES: Record<DifficultyMode, DifficultyId[]> = {
  quiz: ['easy', 'medium', 'hard', 'expert'],
  survival: ['beginner', 'medium', 'expert'],
  endless: ['beginner', 'easy', 'medium', 'hard', 'expert'],
  'character-quiz': ['beginner', 'easy', 'medium', 'hard', 'expert'],
};

/**
 * Label overrides for specific modes.
 * Survival mode calls "medium" difficulty "Intermediate".
 */
const MODE_LABEL_OVERRIDES: Partial<Record<DifficultyMode, Partial<Record<DifficultyId, string>>>> = {
  survival: {
    medium: 'Intermediate',
  },
};

/**
 * Get configuration for a specific difficulty.
 */
export function getDifficultyConfig(id: DifficultyId): DifficultyConfig {
  return DIFFICULTY_PRESETS[id];
}

/**
 * Get configuration with mode-specific label overrides.
 */
export function getDifficultyConfigForMode(id: DifficultyId, mode: DifficultyMode): DifficultyConfig {
  const config = DIFFICULTY_PRESETS[id];
  const labelOverride = MODE_LABEL_OVERRIDES[mode]?.[id];

  if (labelOverride) {
    return { ...config, label: labelOverride };
  }

  return config;
}

/**
 * Get difficulties available for a specific mode.
 */
export function getAvailableDifficulties(mode: DifficultyMode): DifficultyId[] {
  return MODE_DIFFICULTIES[mode];
}

/**
 * Get time limit in milliseconds for a difficulty.
 */
export function getTimeLimitMs(difficulty: DifficultyId): number {
  return DIFFICULTY_PRESETS[difficulty].timeLimitMs;
}

/**
 * Get all difficulty IDs in order from easiest to hardest.
 */
export function getDifficultyOrder(): DifficultyId[] {
  return ['beginner', 'easy', 'medium', 'hard', 'expert'];
}

/**
 * Check if a difficulty ID is valid.
 */
export function isValidDifficultyId(id: string): id is DifficultyId {
  return id in DIFFICULTY_PRESETS;
}

/**
 * Get the default difficulty for a mode.
 */
export function getDefaultDifficulty(mode: DifficultyMode): DifficultyId {
  const available = getAvailableDifficulties(mode);
  // Return the first (easiest) available difficulty
  return available[0];
}

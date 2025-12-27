/**
 * High Score Service
 *
 * Centralized service for high score persistence, replacing separate implementations in:
 * - SurvivalGame.tsx (cc_survival_high_scores)
 * - CharacterQuiz.tsx (charachorder_endless_high_scores)
 *
 * Features:
 * - Unified storage with versioned key
 * - Automatic migration from legacy formats
 * - Type-safe category and difficulty handling
 *
 * @module services/HighScoreService
 */

import type { DifficultyId } from '@/domain';

/**
 * High score categories covering all game modes.
 * Survival categories use the pattern 'survival-{itemType}'.
 */
export type HighScoreCategory =
  // Survival mode categories (match SurvivalItemType)
  | 'survival-left-hand'
  | 'survival-right-hand'
  | 'survival-cross-hand'
  | 'survival-all-power-chords'
  | 'survival-word-chords'
  | 'survival-fingers'
  | 'survival-characters'
  // Character quiz categories
  | 'endless-characters';

/**
 * Extended difficulty type that includes 'intermediate' for legacy survival mode support.
 * New code should use DifficultyId; 'intermediate' maps to 'medium'.
 */
export type HighScoreDifficulty = DifficultyId | 'intermediate';

/**
 * A single high score entry with metadata.
 */
export interface HighScoreEntry {
  category: HighScoreCategory;
  difficulty: HighScoreDifficulty;
  score: number;
  achievedAt: string; // ISO date string
}

/**
 * Internal storage format.
 */
interface HighScoreStorage {
  version: 1;
  scores: Record<string, HighScoreEntry>;
}

/**
 * Legacy survival high score format (from SurvivalGame.tsx).
 */
interface LegacySurvivalHighScore {
  itemType: string;
  difficulty: string;
  score: number;
  achievedAt: Date | string;
}

/**
 * Service interface for dependency injection and testing.
 */
export interface IHighScoreService {
  /** Get high score for a category and difficulty. Returns 0 if none exists. */
  getHighScore(category: HighScoreCategory, difficulty: HighScoreDifficulty): number;

  /**
   * Set high score if it beats the current record.
   * @returns true if this was a new high score, false otherwise
   */
  setHighScore(category: HighScoreCategory, difficulty: HighScoreDifficulty, score: number): boolean;

  /** Get full entry details (including date) */
  getHighScoreEntry(category: HighScoreCategory, difficulty: HighScoreDifficulty): HighScoreEntry | null;

  /** Get all high scores as a map */
  getAllHighScores(): Map<string, HighScoreEntry>;

  /** Clear all high scores (for testing/reset) */
  clearAllHighScores(): void;

  /** Clear high scores for a specific category */
  clearCategoryHighScores(category: HighScoreCategory): void;
}

// Storage keys
const HIGH_SCORES_STORAGE_KEY = 'charachorder_high_scores_v1';
const LEGACY_SURVIVAL_KEY = 'cc_survival_high_scores';
const LEGACY_ENDLESS_KEY = 'charachorder_endless_high_scores';

/**
 * HighScoreService implementation.
 */
export class HighScoreService implements IHighScoreService {
  private migrationCompleted = false;

  constructor() {
    // Migrate on first access
    this.ensureMigration();
  }

  /**
   * Get the composite storage key for a category/difficulty pair.
   */
  private getStorageKey(category: HighScoreCategory, difficulty: HighScoreDifficulty): string {
    return `${category}:${difficulty}`;
  }

  /**
   * Load all scores from localStorage.
   */
  private loadFromStorage(): HighScoreStorage {
    try {
      const stored = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === 1) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors, return empty storage
    }
    return { version: 1, scores: {} };
  }

  /**
   * Save all scores to localStorage.
   */
  private saveToStorage(storage: HighScoreStorage): void {
    try {
      localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(storage));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
      console.warn('Failed to save high scores to localStorage');
    }
  }

  /**
   * Ensure legacy data is migrated on first access.
   */
  private ensureMigration(): void {
    if (this.migrationCompleted) return;
    this.migrationCompleted = true;

    // Check if we already have data (migration already done)
    const existing = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
    if (existing) return;

    const storage = this.loadFromStorage();
    let migrated = false;

    // Migrate legacy survival scores
    try {
      const legacySurvival = localStorage.getItem(LEGACY_SURVIVAL_KEY);
      if (legacySurvival) {
        const survivalScores: Record<string, LegacySurvivalHighScore> = JSON.parse(legacySurvival);
        for (const [key, entry] of Object.entries(survivalScores)) {
          // Key format is "{itemType}:{difficulty}"
          const [itemType, difficulty] = key.split(':');
          if (itemType && difficulty) {
            const category = `survival-${itemType}` as HighScoreCategory;
            const storageKey = this.getStorageKey(category, difficulty as HighScoreDifficulty);
            storage.scores[storageKey] = {
              category,
              difficulty: difficulty as HighScoreDifficulty,
              score: entry.score,
              achievedAt: typeof entry.achievedAt === 'string'
                ? entry.achievedAt
                : new Date(entry.achievedAt).toISOString(),
            };
            migrated = true;
          }
        }
      }
    } catch {
      // Ignore migration errors for survival
    }

    // Migrate legacy endless character scores
    try {
      const legacyEndless = localStorage.getItem(LEGACY_ENDLESS_KEY);
      if (legacyEndless) {
        const endlessScores: Record<string, number> = JSON.parse(legacyEndless);
        for (const [difficulty, score] of Object.entries(endlessScores)) {
          if (score > 0) {
            const storageKey = this.getStorageKey('endless-characters', difficulty as HighScoreDifficulty);
            storage.scores[storageKey] = {
              category: 'endless-characters',
              difficulty: difficulty as HighScoreDifficulty,
              score,
              achievedAt: new Date().toISOString(), // No timestamp in legacy format
            };
            migrated = true;
          }
        }
      }
    } catch {
      // Ignore migration errors for endless
    }

    // Save migrated data if any migration occurred
    if (migrated) {
      this.saveToStorage(storage);
      // Note: We don't delete legacy keys to allow rollback if needed
    }
  }

  getHighScore(category: HighScoreCategory, difficulty: HighScoreDifficulty): number {
    const entry = this.getHighScoreEntry(category, difficulty);
    return entry?.score ?? 0;
  }

  setHighScore(category: HighScoreCategory, difficulty: HighScoreDifficulty, score: number): boolean {
    const currentBest = this.getHighScore(category, difficulty);
    if (score <= currentBest) {
      return false;
    }

    const entry: HighScoreEntry = {
      category,
      difficulty,
      score,
      achievedAt: new Date().toISOString(),
    };

    const storage = this.loadFromStorage();
    const key = this.getStorageKey(category, difficulty);
    storage.scores[key] = entry;
    this.saveToStorage(storage);

    return true;
  }

  getHighScoreEntry(category: HighScoreCategory, difficulty: HighScoreDifficulty): HighScoreEntry | null {
    const storage = this.loadFromStorage();
    const key = this.getStorageKey(category, difficulty);
    return storage.scores[key] ?? null;
  }

  getAllHighScores(): Map<string, HighScoreEntry> {
    const storage = this.loadFromStorage();
    return new Map(Object.entries(storage.scores));
  }

  clearAllHighScores(): void {
    this.saveToStorage({ version: 1, scores: {} });
  }

  clearCategoryHighScores(category: HighScoreCategory): void {
    const storage = this.loadFromStorage();
    const keysToRemove = Object.keys(storage.scores).filter(key => key.startsWith(`${category}:`));
    for (const key of keysToRemove) {
      delete storage.scores[key];
    }
    this.saveToStorage(storage);
  }
}

// Singleton instance
let highScoreServiceInstance: HighScoreService | null = null;

/**
 * Get the singleton HighScoreService instance.
 */
export function getHighScoreService(): HighScoreService {
  if (!highScoreServiceInstance) {
    highScoreServiceInstance = new HighScoreService();
  }
  return highScoreServiceInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetHighScoreService(): void {
  highScoreServiceInstance = null;
}

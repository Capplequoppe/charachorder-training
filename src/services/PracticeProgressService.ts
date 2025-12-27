/**
 * Practice Progress Service
 *
 * Manages progress for the Practice component's word learning mode.
 * Handles localStorage persistence for learned words, current session,
 * and mastery tracking.
 *
 * @module services/PracticeProgressService
 */

// ==================== Types ====================

/**
 * Progress state for word learning practice.
 */
export interface PracticeProgress {
  /** Words that have been introduced to the user */
  learnedWords: string[];
  /** Words in the current practice session */
  currentSession: string[];
  /** Map of word -> times practiced correctly (mastery count) */
  masteredWords: Record<string, number>;
}

/**
 * Service interface for dependency injection and testing.
 */
export interface IPracticeProgressService {
  /** Load progress from storage */
  loadProgress(): PracticeProgress;
  /** Save progress to storage */
  saveProgress(progress: PracticeProgress): void;
  /** Reset all progress */
  resetProgress(): void;
  /** Mark a word as learned (introduced) */
  markWordLearned(word: string): void;
  /** Increment mastery count for a word */
  incrementMastery(word: string): void;
  /** Get mastery count for a word */
  getMasteryCount(word: string): number;
  /** Check if a word has been learned */
  isWordLearned(word: string): boolean;
  /** Get all learned words */
  getLearnedWords(): string[];
  /** Get total words learned count */
  getTotalLearnedCount(): number;
  /** Get total words mastered (practiced at least once) count */
  getTotalMasteredCount(): number;
}

// ==================== Implementation ====================

const STORAGE_KEY = 'charachorder-progress';

/**
 * Default empty progress state.
 */
function createEmptyProgress(): PracticeProgress {
  return {
    learnedWords: [],
    currentSession: [],
    masteredWords: {},
  };
}

/**
 * Practice Progress Service implementation.
 *
 * @example
 * ```typescript
 * const service = getPracticeProgressService();
 *
 * // Load current progress
 * const progress = service.loadProgress();
 *
 * // Mark word as learned
 * service.markWordLearned('hello');
 *
 * // Track successful practice
 * service.incrementMastery('hello');
 *
 * // Check mastery level
 * const count = service.getMasteryCount('hello'); // 1
 * ```
 */
export class PracticeProgressService implements IPracticeProgressService {
  private cachedProgress: PracticeProgress | null = null;

  /**
   * Load progress from localStorage.
   * Returns empty progress if none exists or on error.
   */
  loadProgress(): PracticeProgress {
    if (this.cachedProgress) {
      return this.cachedProgress;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PracticeProgress;
        // Validate structure
        if (
          Array.isArray(parsed.learnedWords) &&
          Array.isArray(parsed.currentSession) &&
          typeof parsed.masteredWords === 'object'
        ) {
          this.cachedProgress = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors, return default
    }

    const empty = createEmptyProgress();
    this.cachedProgress = empty;
    return empty;
  }

  /**
   * Save progress to localStorage.
   */
  saveProgress(progress: PracticeProgress): void {
    this.cachedProgress = progress;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }

  /**
   * Reset all progress to empty state.
   */
  resetProgress(): void {
    const empty = createEmptyProgress();
    this.saveProgress(empty);
  }

  /**
   * Mark a word as learned (introduced to user).
   */
  markWordLearned(word: string): void {
    const progress = this.loadProgress();
    if (!progress.learnedWords.includes(word)) {
      progress.learnedWords.push(word);
      this.saveProgress(progress);
    }
  }

  /**
   * Increment mastery count for a word.
   * Called when user successfully practices the word.
   */
  incrementMastery(word: string): void {
    const progress = this.loadProgress();
    const currentCount = progress.masteredWords[word] ?? 0;
    progress.masteredWords[word] = currentCount + 1;
    this.saveProgress(progress);
  }

  /**
   * Get mastery count for a word.
   */
  getMasteryCount(word: string): number {
    const progress = this.loadProgress();
    return progress.masteredWords[word] ?? 0;
  }

  /**
   * Check if a word has been learned (introduced).
   */
  isWordLearned(word: string): boolean {
    const progress = this.loadProgress();
    return progress.learnedWords.includes(word);
  }

  /**
   * Get all learned words.
   */
  getLearnedWords(): string[] {
    const progress = this.loadProgress();
    return [...progress.learnedWords];
  }

  /**
   * Get total count of learned words.
   */
  getTotalLearnedCount(): number {
    const progress = this.loadProgress();
    return progress.learnedWords.length;
  }

  /**
   * Get total count of mastered words (practiced at least once).
   */
  getTotalMasteredCount(): number {
    const progress = this.loadProgress();
    return Object.keys(progress.masteredWords).length;
  }

  /**
   * Clear cached progress (for testing).
   */
  clearCache(): void {
    this.cachedProgress = null;
  }
}

// ==================== Singleton ====================

let practiceProgressServiceInstance: PracticeProgressService | null = null;

/**
 * Get the singleton PracticeProgressService instance.
 */
export function getPracticeProgressService(): PracticeProgressService {
  if (!practiceProgressServiceInstance) {
    practiceProgressServiceInstance = new PracticeProgressService();
  }
  return practiceProgressServiceInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetPracticeProgressService(): void {
  practiceProgressServiceInstance = null;
}

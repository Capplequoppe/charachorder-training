/**
 * Quiz Progress Service
 *
 * Manages progress for the Quiz mode including word statistics,
 * scores, and high scores. Handles localStorage persistence.
 *
 * @module services/QuizProgressService
 */

import { getPracticeProgressService } from './PracticeProgressService';

// ==================== Types ====================

/**
 * Statistics for a single word in quiz mode.
 */
export interface WordStats {
  /** Number of correct answers */
  correct: number;
  /** Number of failed answers */
  failed: number;
  /** Total number of attempts */
  totalAttempts: number;
  /** Average response time in milliseconds */
  averageTime: number;
  /** Timestamp of last attempt */
  lastAttempt: number;
}

/**
 * Overall quiz progress state.
 */
export interface QuizProgress {
  /** Statistics per word */
  wordStats: Record<string, WordStats>;
  /** Total accumulated score across all quizzes */
  totalScore: number;
  /** Highest score achieved in a single quiz */
  highScore: number;
  /** Number of quizzes completed */
  quizzesCompleted: number;
}

/**
 * Result of a single quiz question.
 */
export interface QuizQuestionResult {
  word: string;
  correct: boolean;
  timeMs: number;
  attempts: number;
  score: number;
}

/**
 * Service interface for dependency injection and testing.
 */
export interface IQuizProgressService {
  /** Load progress from storage */
  loadProgress(): QuizProgress;
  /** Save progress to storage */
  saveProgress(progress: QuizProgress): void;
  /** Reset all progress */
  resetProgress(): void;
  /** Get word statistics */
  getWordStats(word: string): WordStats | undefined;
  /** Update word statistics after a quiz question */
  updateWordStats(result: QuizQuestionResult): void;
  /** Record quiz completion and update scores */
  recordQuizCompletion(sessionScore: number): void;
  /** Get high score */
  getHighScore(): number;
  /** Check if new high score */
  isNewHighScore(score: number): boolean;
  /** Get learned words from Practice mode */
  getLearnedWords(): string[];
  /** Get total words practiced count */
  getTotalWordsPracticedCount(): number;
}

// ==================== Implementation ====================

const QUIZ_STORAGE_KEY = 'charachorder-quiz-progress';

/**
 * Default empty quiz progress state.
 */
function createEmptyProgress(): QuizProgress {
  return {
    wordStats: {},
    totalScore: 0,
    highScore: 0,
    quizzesCompleted: 0,
  };
}

/**
 * Quiz Progress Service implementation.
 *
 * @example
 * ```typescript
 * const service = getQuizProgressService();
 *
 * // Load current progress
 * const progress = service.loadProgress();
 *
 * // Update after quiz question
 * service.updateWordStats({
 *   word: 'hello',
 *   correct: true,
 *   timeMs: 2500,
 *   attempts: 1,
 *   score: 130,
 * });
 *
 * // Record quiz completion
 * service.recordQuizCompletion(850);
 * ```
 */
export class QuizProgressService implements IQuizProgressService {
  private cachedProgress: QuizProgress | null = null;

  /**
   * Load progress from localStorage.
   * Returns empty progress if none exists or on error.
   */
  loadProgress(): QuizProgress {
    if (this.cachedProgress) {
      return this.cachedProgress;
    }

    try {
      const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QuizProgress;
        // Validate structure
        if (
          typeof parsed.wordStats === 'object' &&
          typeof parsed.totalScore === 'number' &&
          typeof parsed.highScore === 'number' &&
          typeof parsed.quizzesCompleted === 'number'
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
  saveProgress(progress: QuizProgress): void {
    this.cachedProgress = progress;
    try {
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(progress));
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
   * Get statistics for a specific word.
   */
  getWordStats(word: string): WordStats | undefined {
    const progress = this.loadProgress();
    return progress.wordStats[word];
  }

  /**
   * Update word statistics after a quiz question.
   */
  updateWordStats(result: QuizQuestionResult): void {
    const progress = this.loadProgress();
    const existing = progress.wordStats[result.word] || {
      correct: 0,
      failed: 0,
      totalAttempts: 0,
      averageTime: 0,
      lastAttempt: 0,
    };

    const newStats: WordStats = {
      correct: existing.correct + (result.correct ? 1 : 0),
      failed: existing.failed + (result.correct ? 0 : 1),
      totalAttempts: existing.totalAttempts + 1,
      averageTime:
        (existing.averageTime * existing.totalAttempts + result.timeMs) /
        (existing.totalAttempts + 1),
      lastAttempt: Date.now(),
    };

    progress.wordStats[result.word] = newStats;
    this.saveProgress(progress);
  }

  /**
   * Record quiz completion and update scores.
   */
  recordQuizCompletion(sessionScore: number): void {
    const progress = this.loadProgress();
    progress.totalScore += sessionScore;
    progress.highScore = Math.max(progress.highScore, sessionScore);
    progress.quizzesCompleted += 1;
    this.saveProgress(progress);
  }

  /**
   * Get high score.
   */
  getHighScore(): number {
    const progress = this.loadProgress();
    return progress.highScore;
  }

  /**
   * Check if score would be a new high score.
   */
  isNewHighScore(score: number): boolean {
    return score > this.getHighScore();
  }

  /**
   * Get learned words from Practice mode.
   * Uses PracticeProgressService to get the list.
   */
  getLearnedWords(): string[] {
    const practiceService = getPracticeProgressService();
    return practiceService.getLearnedWords();
  }

  /**
   * Get total count of words practiced in quiz mode.
   */
  getTotalWordsPracticedCount(): number {
    const progress = this.loadProgress();
    return Object.keys(progress.wordStats).length;
  }

  /**
   * Clear cached progress (for testing).
   */
  clearCache(): void {
    this.cachedProgress = null;
  }
}

// ==================== Singleton ====================

let quizProgressServiceInstance: QuizProgressService | null = null;

/**
 * Get the singleton QuizProgressService instance.
 */
export function getQuizProgressService(): QuizProgressService {
  if (!quizProgressServiceInstance) {
    quizProgressServiceInstance = new QuizProgressService();
  }
  return quizProgressServiceInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetQuizProgressService(): void {
  quizProgressServiceInstance = null;
}

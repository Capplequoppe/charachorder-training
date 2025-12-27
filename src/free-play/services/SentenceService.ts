/**
 * Sentence Service
 *
 * Handles sentence selection, analysis, and practice session management
 * for contextual typing practice.
 */

import {
  type PracticeSentence,
  type SentenceCategory,
  type SentenceDifficulty,
  PRACTICE_SENTENCES,
  getSentencesByDifficulty,
  getSentencesByCategory,
  getSentenceById,
} from '../data/static/sentences';
import { type IWordRepository, type IProgressRepository } from '../data/repositories';
import { type LearningProgress, MasteryLevel } from '../domain';

/**
 * Status of a word within a sentence.
 */
export interface WordStatus {
  /** The word text */
  word: string;
  /** Normalized word (lowercase, no punctuation) */
  normalized: string;
  /** Whether a chord exists for this word */
  hasChord: boolean;
  /** Whether user has mastered this word */
  isMastered: boolean;
  /** Whether user is currently learning this word */
  isLearning: boolean;
  /** Whether this is a new word for the user */
  isNew: boolean;
  /** Word's frequency rank (lower = more common) */
  rank: number | null;
}

/**
 * Analysis of a sentence for practice.
 */
export interface SentenceSelection {
  /** The selected sentence */
  sentence: PracticeSentence;
  /** Status of each word */
  wordStatuses: WordStatus[];
  /** Estimated difficulty (0-1) */
  estimatedDifficulty: number;
  /** Count of new words */
  newWordsCount: number;
  /** Count of learning words */
  learningWordsCount: number;
  /** Count of mastered words */
  masteredWordsCount: number;
  /** Percentage of words with chords */
  chordCoverage: number;
}

/**
 * Result of a word attempt.
 */
export interface WordResult {
  /** The target word */
  word: string;
  /** What the user typed */
  typed: string;
  /** Whether it was correct */
  isCorrect: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Whether a chord was detected */
  usedChord: boolean;
  /** Typing pattern */
  typingPattern: 'chord' | 'sequential' | 'unknown';
}

/**
 * Results of a sentence practice session.
 */
export interface SentenceResults {
  /** The practiced sentence */
  sentence: PracticeSentence;
  /** Results for each word */
  wordResults: WordResult[];
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Words per minute */
  wpm: number;
  /** Accuracy percentage (0-1) */
  accuracy: number;
  /** Chord usage percentage (0-1) */
  chordUsage: number;
  /** Average response time per word */
  avgResponseTimeMs: number;
  /** Timestamp */
  completedAt: Date;
}

/**
 * Sentence practice session state.
 */
export interface SentenceSession {
  /** Session ID */
  id: string;
  /** Selected sentences for this session */
  sentences: SentenceSelection[];
  /** Current sentence index */
  currentIndex: number;
  /** Completed sentence results */
  results: SentenceResults[];
  /** Session start time */
  startedAt: Date;
  /** Difficulty filter */
  difficulty: SentenceDifficulty | null;
  /** Category filter */
  category: SentenceCategory | null;
}

/**
 * Options for sentence selection.
 */
export interface SentenceSelectionOptions {
  /** Minimum mastered word percentage */
  minMasteredRatio?: number;
  /** Maximum new words allowed */
  maxNewWords?: number;
  /** Minimum chord coverage */
  minChordCoverage?: number;
  /** Exclude completed sentence IDs */
  excludeIds?: string[];
  /** Difficulty filter */
  difficulty?: SentenceDifficulty;
  /** Category filter */
  category?: SentenceCategory;
}

/**
 * Interface for sentence service operations.
 */
export interface ISentenceService {
  // Sentence retrieval
  getAllSentences(): PracticeSentence[];
  getSentencesByDifficulty(difficulty: SentenceDifficulty): PracticeSentence[];
  getSentencesByCategory(category: SentenceCategory): PracticeSentence[];
  getSentenceById(id: string): PracticeSentence | undefined;

  // Analysis
  analyzeSentence(sentence: PracticeSentence): SentenceSelection;
  analyzeWordStatus(word: string): WordStatus;

  // Selection
  selectAdaptiveSentence(options?: SentenceSelectionOptions): SentenceSelection | null;
  selectRandomSentence(options?: SentenceSelectionOptions): SentenceSelection | null;
  getNextSentence(completedIds: string[], options?: SentenceSelectionOptions): SentenceSelection | null;

  // Session management
  createSession(count: number, options?: SentenceSelectionOptions): SentenceSession;
  recordSentenceResult(sessionId: string, result: SentenceResults): void;
  getSessionProgress(sessionId: string): { completed: number; total: number };

  // Statistics
  calculateWpm(wordCount: number, timeMs: number): number;
  calculateAccuracy(wordResults: WordResult[]): number;
  calculateChordUsage(wordResults: WordResult[]): number;
}

/**
 * Normalize a word for comparison.
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[.,!?;:'"]/g, '');
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `sentence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sentence service implementation.
 */
export class SentenceService implements ISentenceService {
  private wordRepo: IWordRepository;
  private progressRepo: IProgressRepository;
  private sessions: Map<string, SentenceSession>;

  constructor(wordRepo: IWordRepository, progressRepo: IProgressRepository) {
    this.wordRepo = wordRepo;
    this.progressRepo = progressRepo;
    this.sessions = new Map();
  }

  // ============================================================
  // Sentence Retrieval
  // ============================================================

  getAllSentences(): PracticeSentence[] {
    return [...PRACTICE_SENTENCES];
  }

  getSentencesByDifficulty(difficulty: SentenceDifficulty): PracticeSentence[] {
    return getSentencesByDifficulty(difficulty);
  }

  getSentencesByCategory(category: SentenceCategory): PracticeSentence[] {
    return getSentencesByCategory(category);
  }

  getSentenceById(id: string): PracticeSentence | undefined {
    return getSentenceById(id);
  }

  // ============================================================
  // Analysis
  // ============================================================

  analyzeSentence(sentence: PracticeSentence): SentenceSelection {
    const wordStatuses = sentence.words.map(word => this.analyzeWordStatus(word));

    const masteredCount = wordStatuses.filter(w => w.isMastered).length;
    const learningCount = wordStatuses.filter(w => w.isLearning).length;
    const newCount = wordStatuses.filter(w => w.isNew).length;
    const withChordCount = wordStatuses.filter(w => w.hasChord).length;

    // Calculate difficulty based on word statuses
    // Lower = easier (more mastered words, fewer new words)
    const masteryFactor = masteredCount / sentence.words.length;
    const newWordPenalty = newCount / sentence.words.length;
    const estimatedDifficulty = 1 - masteryFactor + (newWordPenalty * 0.5);

    return {
      sentence,
      wordStatuses,
      estimatedDifficulty: Math.max(0, Math.min(1, estimatedDifficulty)),
      newWordsCount: newCount,
      learningWordsCount: learningCount,
      masteredWordsCount: masteredCount,
      chordCoverage: withChordCount / sentence.words.length,
    };
  }

  analyzeWordStatus(word: string): WordStatus {
    const normalized = normalizeWord(word);
    const wordData = this.wordRepo.getByWord(normalized);
    const hasChord = !!wordData?.chord;

    // Get progress for this word
    const progress = this.progressRepo.getProgress(normalized, 'word');

    let isMastered = false;
    let isLearning = false;
    let isNew = true;

    if (progress) {
      isNew = false;
      isMastered = progress.masteryLevel === MasteryLevel.MASTERED;
      isLearning = progress.masteryLevel === MasteryLevel.LEARNING ||
                   progress.masteryLevel === MasteryLevel.FAMILIAR;
    }

    return {
      word,
      normalized,
      hasChord,
      isMastered,
      isLearning,
      isNew,
      rank: wordData?.rank ?? null,
    };
  }

  // ============================================================
  // Selection
  // ============================================================

  selectAdaptiveSentence(options: SentenceSelectionOptions = {}): SentenceSelection | null {
    const {
      minMasteredRatio = 0.5,
      maxNewWords = 3,
      minChordCoverage = 0.5,
      excludeIds = [],
      difficulty,
      category,
    } = options;

    // Get candidate sentences
    let candidates = [...PRACTICE_SENTENCES];

    if (difficulty) {
      candidates = candidates.filter(s => s.difficulty === difficulty);
    }
    if (category) {
      candidates = candidates.filter(s => s.category === category);
    }
    if (excludeIds.length > 0) {
      candidates = candidates.filter(s => !excludeIds.includes(s.id));
    }

    // Analyze and filter candidates
    const analyses = candidates
      .map(s => this.analyzeSentence(s))
      .filter(analysis => {
        const masteredRatio = analysis.masteredWordsCount / analysis.sentence.words.length;
        return (
          masteredRatio >= minMasteredRatio &&
          analysis.newWordsCount <= maxNewWords &&
          analysis.chordCoverage >= minChordCoverage
        );
      });

    if (analyses.length === 0) {
      // Fallback: return any sentence if no candidates match
      if (candidates.length > 0) {
        return this.analyzeSentence(candidates[0]);
      }
      return null;
    }

    // Sort by optimal challenge level (prefer 1-2 learning words)
    analyses.sort((a, b) => {
      const aIdeal = Math.abs(a.learningWordsCount - 1.5);
      const bIdeal = Math.abs(b.learningWordsCount - 1.5);
      return aIdeal - bIdeal;
    });

    return analyses[0];
  }

  selectRandomSentence(options: SentenceSelectionOptions = {}): SentenceSelection | null {
    const { difficulty, category, excludeIds = [] } = options;

    let candidates = [...PRACTICE_SENTENCES];

    if (difficulty) {
      candidates = candidates.filter(s => s.difficulty === difficulty);
    }
    if (category) {
      candidates = candidates.filter(s => s.category === category);
    }
    if (excludeIds.length > 0) {
      candidates = candidates.filter(s => !excludeIds.includes(s.id));
    }

    if (candidates.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return this.analyzeSentence(candidates[randomIndex]);
  }

  getNextSentence(completedIds: string[], options: SentenceSelectionOptions = {}): SentenceSelection | null {
    return this.selectAdaptiveSentence({
      ...options,
      excludeIds: completedIds,
    });
  }

  // ============================================================
  // Session Management
  // ============================================================

  createSession(count: number, options: SentenceSelectionOptions = {}): SentenceSession {
    const sessionId = generateSessionId();
    const sentences: SentenceSelection[] = [];
    const usedIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const selection = this.selectAdaptiveSentence({
        ...options,
        excludeIds: usedIds,
      });

      if (selection) {
        sentences.push(selection);
        usedIds.push(selection.sentence.id);
      }
    }

    const session: SentenceSession = {
      id: sessionId,
      sentences,
      currentIndex: 0,
      results: [],
      startedAt: new Date(),
      difficulty: options.difficulty ?? null,
      category: options.category ?? null,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  recordSentenceResult(sessionId: string, result: SentenceResults): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.results.push(result);
    session.currentIndex = Math.min(
      session.currentIndex + 1,
      session.sentences.length
    );

    // Update word progress based on results
    for (const wordResult of result.wordResults) {
      if (wordResult.isCorrect) {
        // Record successful attempt
        const normalized = normalizeWord(wordResult.word);
        const existing = this.progressRepo.getProgress(normalized, 'word');

        if (existing) {
          // Update existing progress using clone and mutation
          const updated = existing.clone();
          updated.correctAttempts = existing.correctAttempts + 1;
          updated.totalAttempts = existing.totalAttempts + 1;
          updated.lastAttemptDate = new Date();
          updated.updateMasteryLevel();
          this.progressRepo.updateProgress(updated);
        }
      }
    }
  }

  getSessionProgress(sessionId: string): { completed: number; total: number } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { completed: 0, total: 0 };
    }

    return {
      completed: session.results.length,
      total: session.sentences.length,
    };
  }

  // ============================================================
  // Statistics
  // ============================================================

  calculateWpm(wordCount: number, timeMs: number): number {
    if (timeMs === 0) return 0;
    const minutes = timeMs / 60000;
    return Math.round(wordCount / minutes);
  }

  calculateAccuracy(wordResults: WordResult[]): number {
    if (wordResults.length === 0) return 0;
    const correct = wordResults.filter(r => r.isCorrect).length;
    return correct / wordResults.length;
  }

  calculateChordUsage(wordResults: WordResult[]): number {
    if (wordResults.length === 0) return 0;
    const chords = wordResults.filter(r => r.usedChord).length;
    return chords / wordResults.length;
  }
}

// ============================================================
// Singleton instance
// ============================================================

let sentenceServiceInstance: SentenceService | null = null;

/**
 * Get the sentence service singleton.
 */
export function getSentenceService(): SentenceService {
  if (!sentenceServiceInstance) {
    throw new Error('SentenceService not initialized. Call initSentenceService first.');
  }
  return sentenceServiceInstance;
}

/**
 * Initialize the sentence service with dependencies.
 */
export function initSentenceService(
  wordRepo: IWordRepository,
  progressRepo: IProgressRepository
): SentenceService {
  sentenceServiceInstance = new SentenceService(wordRepo, progressRepo);
  return sentenceServiceInstance;
}

/**
 * Reset the sentence service (for testing).
 */
export function resetSentenceService(): void {
  sentenceServiceInstance = null;
}

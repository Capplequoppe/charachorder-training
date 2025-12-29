/**
 * useQuizMode Hook
 *
 * Manages state and business logic for the Quiz Mode feature.
 * Extracted from QuizMode.tsx to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Quiz progress persistence (via QuizProgressService)
 * - Word selection with weighted algorithms
 * - Quiz lifecycle management (start, complete, reset)
 * - Score tracking and calculation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getWordsByRank } from '../data/chords';
import type { WordEntry } from '../data/types';
import { getQuizProgressService, type QuizProgress, type WordStats } from '../services';

// ============================================================================
// Types
// ============================================================================

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface DifficultySettings {
  timeLimit: number; // seconds, 0 = no limit
  maxAttempts: number;
  showFingerHints: boolean;
  label: string;
  description: string;
}

export interface QuizResult {
  word: string;
  correct: boolean;
  timeMs: number;
  attempts: number;
  score: number;
}

export interface UseQuizModeResult {
  // State
  progress: QuizProgress;
  difficulty: Difficulty;
  quizSize: number;
  quizWords: WordEntry[];
  currentIndex: number;
  quizStarted: boolean;
  quizResults: QuizResult[];
  sessionScore: number;
  learnedWordsCount: number;
  isQuizComplete: boolean;

  // Current quiz data
  currentWord: WordEntry | undefined;
  upcomingWords: WordEntry[];
  settings: DifficultySettings;

  // Actions
  setDifficulty: (d: Difficulty) => void;
  setQuizSize: (s: number) => void;
  startQuiz: () => void;
  handleWordComplete: (result: QuizResult) => void;
  handleResetStats: () => void;
  endQuiz: () => void;
}

// ============================================================================
// Constants
// ============================================================================

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    timeLimit: 0,
    maxAttempts: 5,
    showFingerHints: true,
    label: 'Easy',
    description: 'No time limit, 5 attempts, finger hints shown',
  },
  medium: {
    timeLimit: 30,
    maxAttempts: 3,
    showFingerHints: true,
    label: 'Medium',
    description: '30 seconds, 3 attempts, finger hints shown',
  },
  hard: {
    timeLimit: 15,
    maxAttempts: 2,
    showFingerHints: false,
    label: 'Hard',
    description: '15 seconds, 2 attempts, no hints',
  },
  expert: {
    timeLimit: 8,
    maxAttempts: 1,
    showFingerHints: false,
    label: 'Expert',
    description: '8 seconds, 1 attempt, no hints',
  },
};

// ============================================================================
// Pure Utility Functions
// ============================================================================

/**
 * Calculate score based on time and attempts.
 * Pure function - no side effects.
 */
export function calculateScore(
  timeMs: number,
  attempts: number,
  maxAttempts: number,
  timeLimit: number,
  correct: boolean
): number {
  if (!correct) return 0;

  // Base score
  let score = 100;

  // Attempt penalty (scaled by max attempts)
  const attemptPenalty = (attempts - 1) * Math.floor(60 / maxAttempts);
  score -= attemptPenalty;

  // Time bonus (if time limit is set)
  if (timeLimit > 0) {
    const timeLimitMs = timeLimit * 1000;
    const timeRatio = 1 - timeMs / timeLimitMs;
    const timeBonus = Math.floor(timeRatio * 50);
    score += Math.max(0, timeBonus);
  } else {
    // Small time bonus for quick answers even without limit
    if (timeMs < 2000) score += 30;
    else if (timeMs < 5000) score += 15;
    else if (timeMs < 10000) score += 5;
  }

  return Math.max(0, Math.min(150, score));
}

/**
 * Weighted random selection - failed words appear more often.
 * Pure function - no side effects.
 */
export function selectWeightedWords(
  allWords: WordEntry[],
  wordStats: Record<string, WordStats>,
  count: number
): WordEntry[] {
  // Calculate weights for each word
  const weights: { word: WordEntry; weight: number }[] = allWords.map((entry) => {
    const stats = wordStats[entry.word];
    let weight = 1;

    if (stats) {
      // Failed words get higher weight
      const failRatio = stats.failed / Math.max(1, stats.correct + stats.failed);
      weight += failRatio * 4;

      // Words not seen recently get higher weight
      const hoursSinceLastAttempt = (Date.now() - stats.lastAttempt) / (1000 * 60 * 60);
      if (hoursSinceLastAttempt > 24) weight += 1;
      if (hoursSinceLastAttempt > 72) weight += 1;

      // Words with fewer attempts get slightly higher weight
      if (stats.totalAttempts < 3) weight += 0.5;
    } else {
      // Never seen words get moderate weight
      weight = 2;
    }

    // Higher ranked (more common) words get slightly higher weight
    if (entry.rank && entry.rank <= 50) weight += 0.5;
    else if (entry.rank && entry.rank <= 100) weight += 0.25;

    return { word: entry, weight };
  });

  // Weighted random selection
  const selected: WordEntry[] = [];
  const remaining = [...weights];

  while (selected.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < remaining.length; i++) {
      random -= remaining[i].weight;
      if (random <= 0) {
        selected.push(remaining[i].word);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

/**
 * Get color for difficulty level.
 * Pure function - no side effects.
 */
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '#2ecc71';
    case 'medium':
      return '#f1c40f';
    case 'hard':
      return '#e67e22';
    case 'expert':
      return '#e74c3c';
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useQuizMode(): UseQuizModeResult {
  const quizProgressService = getQuizProgressService();

  // Core state
  const [progress, setProgress] = useState<QuizProgress>(() =>
    quizProgressService.loadProgress()
  );
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [quizSize, setQuizSize] = useState(10);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  // Quiz session state
  const [quizWords, setQuizWords] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [sessionScore, setSessionScore] = useState(0);

  // Derived data
  const allWords = useMemo(() => getWordsByRank(), []);
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // Load learned words from Practice mode
  useEffect(() => {
    setLearnedWords(quizProgressService.getLearnedWords());
  }, [quizStarted, quizProgressService]);

  // Filter to only learned words
  const availableWords = useMemo(
    () => allWords.filter((w) => learnedWords.includes(w.word)),
    [allWords, learnedWords]
  );

  // Current quiz state
  const currentWord = quizWords[currentIndex];
  const upcomingWords = quizWords.slice(currentIndex + 1, currentIndex + 6);
  const isQuizComplete =
    quizStarted &&
    currentIndex >= quizWords.length - 1 &&
    quizResults.length === quizWords.length;

  // Start a new quiz
  const startQuiz = useCallback(() => {
    // Refresh learned words before starting
    const currentLearnedWords = quizProgressService.getLearnedWords();
    setLearnedWords(currentLearnedWords);

    const learnedWordEntries = allWords.filter((w) =>
      currentLearnedWords.includes(w.word)
    );
    const words = selectWeightedWords(
      learnedWordEntries,
      progress.wordStats,
      Math.min(quizSize, learnedWordEntries.length)
    );

    setQuizWords(words);
    setCurrentIndex(0);
    setQuizStarted(true);
    setQuizResults([]);
    setSessionScore(0);
  }, [allWords, progress.wordStats, quizSize, quizProgressService]);

  // Handle word completion
  const handleWordComplete = useCallback(
    (result: QuizResult) => {
      // Update results
      setQuizResults((prev) => [...prev, result]);
      setSessionScore((prev) => prev + result.score);

      // Update progress via service
      quizProgressService.updateWordStats({
        word: result.word,
        correct: result.correct,
        timeMs: result.timeMs,
        attempts: result.attempts,
        score: result.score,
      });

      // Refresh progress state from service
      setProgress(quizProgressService.loadProgress());

      // Move to next word or end quiz
      if (currentIndex < quizWords.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Quiz complete
        const finalScore = sessionScore + result.score;
        quizProgressService.recordQuizCompletion(finalScore);
        setProgress(quizProgressService.loadProgress());
      }
    },
    [currentIndex, quizWords.length, sessionScore, quizProgressService]
  );

  // Reset all stats
  const handleResetStats = useCallback(() => {
    quizProgressService.resetProgress();
    setProgress(quizProgressService.loadProgress());
  }, [quizProgressService]);

  // End quiz (go back to setup)
  const endQuiz = useCallback(() => {
    setQuizStarted(false);
  }, []);

  return {
    // State
    progress,
    difficulty,
    quizSize,
    quizWords,
    currentIndex,
    quizStarted,
    quizResults,
    sessionScore,
    learnedWordsCount: availableWords.length,
    isQuizComplete,

    // Current quiz data
    currentWord,
    upcomingWords,
    settings,

    // Actions
    setDifficulty,
    setQuizSize,
    startQuiz,
    handleWordComplete,
    handleResetStats,
    endQuiz,
  };
}

/**
 * useQuizSession Hook
 *
 * Unified quiz session state management for all quiz-style components.
 * Consolidates duplicated state management from:
 * - Practice.tsx
 * - QuizMode.tsx
 * - SurvivalGame.tsx
 * - CharacterQuiz.tsx
 *
 * Features:
 * - Generic item type support
 * - Multiple quiz modes (standard, endless, survival, boss)
 * - Automatic score calculation via ScoringService
 * - Streak tracking
 * - Results aggregation
 *
 * @module hooks/useQuizSession
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getScoringService } from '@/services';
import { getDifficultyConfig, FEEDBACK_DISPLAY_MS, type DifficultyId } from '@/domain';

// ==================== Types ====================

/**
 * Quiz session modes with different behaviors.
 */
export type QuizMode = 'standard' | 'endless' | 'survival' | 'boss';

/**
 * Options for the quiz session hook.
 */
export interface UseQuizSessionOptions<T> {
  /** Items to quiz */
  items: T[];
  /** Get unique ID for an item */
  getItemId: (item: T) => string;
  /** Scoring mode */
  mode: QuizMode;
  /** Difficulty configuration */
  difficulty: DifficultyId;
  /** Whether to shuffle items (default: true) */
  shuffle?: boolean;
  /** Maximum items for the session (useful for boss mode) */
  maxItems?: number;
  /** Callback on correct answer */
  onCorrect?: (item: T, responseTimeMs: number, score: number) => void;
  /** Callback on incorrect answer */
  onIncorrect?: (item: T, responseTimeMs: number) => void;
  /** Callback on timeout */
  onTimeout?: (item: T) => void;
  /** Callback when session completes */
  onComplete?: (results: QuizSessionResults<T>) => void;
  /** Feedback display time in ms (default: FEEDBACK_DISPLAY_MS) */
  feedbackDelayMs?: number;
}

/**
 * Result for a single quiz item.
 */
export interface QuizItemResult<T> {
  item: T;
  itemId: string;
  correct: boolean;
  responseTimeMs: number;
  attempts: number;
  score: number;
}

/**
 * Aggregated results for a completed quiz session.
 */
export interface QuizSessionResults<T> {
  totalItems: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  totalScore: number;
  averageResponseTimeMs: number;
  maxStreak: number;
  itemResults: QuizItemResult<T>[];
}

/**
 * Feedback state after answering.
 */
export type QuizFeedback = 'correct' | 'incorrect' | 'timeout' | null;

/**
 * Result returned by the quiz session hook.
 */
export interface UseQuizSessionResult<T> {
  // Current state
  /** Current item being quizzed (null if complete) */
  currentItem: T | null;
  /** Current item index (0-based) */
  currentIndex: number;
  /** Total number of items in the session */
  totalItems: number;

  // Progress
  /** Current total score */
  score: number;
  /** Current streak of consecutive correct answers */
  streak: number;
  /** Number of correct answers */
  correctCount: number;
  /** Number of incorrect answers */
  incorrectCount: number;

  // Feedback
  /** Current feedback state */
  feedback: QuizFeedback;

  // Actions
  /** Call when answer is correct */
  handleCorrect: (responseTimeMs: number) => void;
  /** Call when answer is incorrect */
  handleIncorrect: (responseTimeMs: number) => void;
  /** Call when time runs out */
  handleTimeout: () => void;
  /** Skip current item (for boss mode or practice) */
  skipItem: () => void;
  /** Restart the session */
  restart: () => void;

  // State
  /** Whether the session is complete */
  isComplete: boolean;
  /** Results (available when isComplete is true) */
  results: QuizSessionResults<T> | null;

  // Timing
  /** Timestamp when current attempt started */
  attemptStartTime: number;
  /** Reset the attempt timer (call when showing new item) */
  resetAttemptTimer: () => void;
  /** Current attempt count for this item */
  currentAttempts: number;
}

// ==================== Helper Functions ====================

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ==================== Hook Implementation ====================

/**
 * A unified hook for managing quiz session state.
 *
 * @example
 * ```tsx
 * const quiz = useQuizSession({
 *   items: characters,
 *   getItemId: (char) => char.id,
 *   mode: 'endless',
 *   difficulty: 'medium',
 *   onComplete: (results) => saveHighScore(results.maxStreak),
 * });
 *
 * if (quiz.isComplete) {
 *   return <Results data={quiz.results} />;
 * }
 *
 * return (
 *   <div>
 *     <span>Score: {quiz.score}</span>
 *     <Character data={quiz.currentItem} />
 *   </div>
 * );
 * ```
 */
export function useQuizSession<T>(
  options: UseQuizSessionOptions<T>
): UseQuizSessionResult<T> {
  const {
    items: rawItems,
    getItemId,
    mode,
    difficulty,
    shuffle = true,
    maxItems,
    onCorrect,
    onIncorrect,
    onTimeout,
    onComplete,
    feedbackDelayMs = FEEDBACK_DISPLAY_MS,
  } = options;

  const scoringService = getScoringService();
  const difficultyConfig = getDifficultyConfig(difficulty);

  // Determine mode-specific behavior
  const isFirstTryOnly = mode === 'endless' || mode === 'survival';
  const endOnMiss = mode === 'endless' || mode === 'survival';

  // Prepare items (shuffle, limit)
  const items = useMemo(() => {
    let processed = shuffle ? shuffleArray(rawItems) : [...rawItems];
    if (maxItems && maxItems < processed.length) {
      processed = processed.slice(0, maxItems);
    }
    return processed;
  }, [rawItems, shuffle, maxItems]);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<QuizFeedback>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [itemResults, setItemResults] = useState<QuizItemResult<T>[]>([]);
  // State for values that need to be returned (can't access refs during render)
  const [attemptStartTime, setAttemptStartTime] = useState(() => Date.now());
  const [currentAttempts, setCurrentAttempts] = useState(1);

  // Refs (only for internal use, not returned)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep callback refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Current item
  const currentItem = !isComplete && currentIndex < items.length ? items[currentIndex] : null;

  // Clean up feedback timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Calculate results when complete
  const results = useMemo((): QuizSessionResults<T> | null => {
    if (!isComplete) return null;

    const totalCorrectTime = itemResults
      .filter(r => r.correct)
      .reduce((sum, r) => sum + r.responseTimeMs, 0);

    return {
      totalItems: itemResults.length,
      correctCount,
      incorrectCount,
      accuracy: itemResults.length > 0 ? correctCount / itemResults.length : 0,
      totalScore: score,
      averageResponseTimeMs: correctCount > 0 ? totalCorrectTime / correctCount : 0,
      maxStreak,
      itemResults,
    };
  }, [isComplete, itemResults, correctCount, incorrectCount, score, maxStreak]);

  // Move to next item or complete session
  const moveToNextItem = useCallback(() => {
    setFeedback(null);
    setCurrentAttempts(1);
    setAttemptStartTime(Date.now());

    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, items.length]);

  // End session (for survival/endless modes)
  const endSession = useCallback(() => {
    setFeedback(null);
    setIsComplete(true);
  }, []);

  // Handle correct answer
  const handleCorrect = useCallback((responseTimeMs: number) => {
    if (!currentItem || feedback || isComplete) return;

    // Calculate score
    const itemScore = scoringService.calculateQuizScore({
      timeMs: responseTimeMs,
      attempts: currentAttempts,
      maxAttempts: difficultyConfig.maxAttempts,
      timeLimitMs: difficultyConfig.timeLimitMs,
      correct: true,
    });

    // Update state
    setScore(s => s + itemScore);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setMaxStreak(prev => Math.max(prev, newStreak));
    setCorrectCount(c => c + 1);
    setFeedback('correct');

    // Record result
    const result: QuizItemResult<T> = {
      item: currentItem,
      itemId: getItemId(currentItem),
      correct: true,
      responseTimeMs,
      attempts: currentAttempts,
      score: itemScore,
    };
    setItemResults(prev => [...prev, result]);

    // Callback
    onCorrect?.(currentItem, responseTimeMs, itemScore);

    // Move to next item after delay
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      moveToNextItem();
    }, feedbackDelayMs);
  }, [
    currentItem,
    feedback,
    isComplete,
    scoringService,
    difficultyConfig,
    currentAttempts,
    streak,
    getItemId,
    onCorrect,
    feedbackDelayMs,
    moveToNextItem,
  ]);

  // Handle incorrect answer
  const handleIncorrect = useCallback((responseTimeMs: number) => {
    if (!currentItem || feedback || isComplete) return;

    const nextAttempts = currentAttempts + 1;

    // Check if we should end or allow retry
    if (isFirstTryOnly || nextAttempts > difficultyConfig.maxAttempts) {
      // Record failed result (with the attempt count that just failed)
      const result: QuizItemResult<T> = {
        item: currentItem,
        itemId: getItemId(currentItem),
        correct: false,
        responseTimeMs,
        attempts: currentAttempts,
        score: 0,
      };
      setItemResults(prev => [...prev, result]);

      setStreak(0);
      setIncorrectCount(c => c + 1);
      setFeedback('incorrect');

      // Callback
      onIncorrect?.(currentItem, responseTimeMs);

      // Clear feedback timeout
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      if (endOnMiss) {
        // End session after feedback
        feedbackTimeoutRef.current = setTimeout(() => {
          endSession();
        }, feedbackDelayMs);
      } else {
        // Move to next item after feedback
        feedbackTimeoutRef.current = setTimeout(() => {
          moveToNextItem();
        }, feedbackDelayMs);
      }
    } else {
      // Allow retry - increment attempts and show feedback briefly
      setCurrentAttempts(nextAttempts);
      setFeedback('incorrect');
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, feedbackDelayMs / 2); // Shorter feedback for retry
    }
  }, [
    currentItem,
    feedback,
    isComplete,
    currentAttempts,
    isFirstTryOnly,
    difficultyConfig.maxAttempts,
    endOnMiss,
    getItemId,
    onIncorrect,
    feedbackDelayMs,
    moveToNextItem,
    endSession,
  ]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (!currentItem || feedback || isComplete) return;

    // Record timeout as incorrect
    const result: QuizItemResult<T> = {
      item: currentItem,
      itemId: getItemId(currentItem),
      correct: false,
      responseTimeMs: difficultyConfig.timeLimitMs,
      attempts: currentAttempts,
      score: 0,
    };
    setItemResults(prev => [...prev, result]);

    setStreak(0);
    setIncorrectCount(c => c + 1);
    setFeedback('timeout');

    // Callback
    onTimeout?.(currentItem);

    // Clear feedback timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    if (endOnMiss) {
      feedbackTimeoutRef.current = setTimeout(() => {
        endSession();
      }, feedbackDelayMs);
    } else {
      feedbackTimeoutRef.current = setTimeout(() => {
        moveToNextItem();
      }, feedbackDelayMs);
    }
  }, [
    currentItem,
    feedback,
    isComplete,
    currentAttempts,
    difficultyConfig.timeLimitMs,
    endOnMiss,
    getItemId,
    onTimeout,
    feedbackDelayMs,
    moveToNextItem,
    endSession,
  ]);

  // Skip current item
  const skipItem = useCallback(() => {
    if (isComplete || feedback) return;
    moveToNextItem();
  }, [isComplete, feedback, moveToNextItem]);

  // Restart session
  const restart = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setFeedback(null);
    setIsComplete(false);
    setItemResults([]);
    setCurrentAttempts(1);
    setAttemptStartTime(Date.now());
  }, []);

  // Reset attempt timer
  const resetAttemptTimer = useCallback(() => {
    setAttemptStartTime(Date.now());
    setCurrentAttempts(1);
  }, []);

  // Call onComplete when session ends
  useEffect(() => {
    if (isComplete && results && onCompleteRef.current) {
      onCompleteRef.current(results);
    }
  }, [isComplete, results]);

  return {
    currentItem,
    currentIndex,
    totalItems: items.length,
    score,
    streak,
    correctCount,
    incorrectCount,
    feedback,
    handleCorrect,
    handleIncorrect,
    handleTimeout,
    skipItem,
    restart,
    isComplete,
    results,
    attemptStartTime,
    resetAttemptTimer,
    currentAttempts,
  };
}

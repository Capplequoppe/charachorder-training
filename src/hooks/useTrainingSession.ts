/**
 * useTrainingSession Hook
 *
 * Consolidated session state management for training components.
 * Handles item progression, result tracking, mode selection, and
 * completion detection.
 *
 * This hook consolidates ~15 state variables and ~10 callbacks that
 * were duplicated across IntraHandTraining, CrossHandTraining, and
 * WordChordTraining.
 *
 * @module hooks
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { getServices } from '../services';
import { useProgress } from './useServices';
import { useSettings } from './useSettings';
import type { TrainableItem, TrainableItemType, TrainingMode, CompletionCriteria } from '../domain';
import {
  FEEDBACK_DISPLAY_MS,
  ITEM_COMPLETION_DELAY_MS,
} from '../domain';

/**
 * Maximum number of response times to keep per item.
 * This prevents unbounded memory growth during long sessions.
 */
const MAX_RESPONSE_TIMES_PER_ITEM = 20;

/**
 * Options for useTrainingSession hook.
 */
export interface UseTrainingSessionOptions {
  /** Type of items to train */
  itemType: TrainableItemType;
  /** Optional filter (e.g., hand for power chords) */
  filter?: { hand?: 'left' | 'right' | 'cross' };
  /** Callback when session completes */
  onComplete?: (results: TrainingResults) => void;
  /** Callback when an item is completed */
  onItemComplete?: (item: TrainableItem, itemProgress: ItemProgress) => void;
}

/**
 * Progress tracking for a single item within a session.
 */
export interface ItemProgress {
  attempts: number;
  successes: number;
  completed: boolean;
  responseTimes: number[];
}

/**
 * Progress tracking for the entire session.
 */
export interface SessionProgress {
  totalItems: number;
  completedItems: number;
  totalAttempts: number;
  correctAttempts: number;
}

/**
 * Result for a single quiz item.
 */
export interface QuizResult {
  itemId: string;
  correct: boolean;
  responseTimeMs: number;
}

/**
 * Final results from a training session.
 */
export interface TrainingResults {
  itemsCompleted: number;
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;
  accuracy: number;
  quizResults?: QuizResult[];
}

/**
 * Feedback state type.
 */
export type FeedbackState = 'correct' | 'incorrect' | null;

/**
 * Result returned by useTrainingSession hook.
 */
export interface UseTrainingSessionResult {
  // Items
  items: TrainableItem[];
  currentItem: TrainableItem | null;
  currentIndex: number;
  totalItems: number;

  // Mode
  currentMode: TrainingMode;
  isQuizMode: boolean;
  isLearnMode: boolean;
  selectMode: (mode: TrainingMode) => void;

  // Progress
  itemProgress: ItemProgress;
  sessionProgress: SessionProgress;
  quizResults: QuizResult[];

  // Feedback
  feedback: FeedbackState;
  setFeedback: (feedback: FeedbackState) => void;

  // Actions
  handleCorrect: (responseTimeMs: number) => void;
  handleIncorrect: (responseTimeMs: number) => void;
  moveToNextItem: () => void;
  restart: () => void;
  refreshItems: () => void;

  // Completion
  isComplete: boolean;
  results: TrainingResults | null;

  // Completion criteria from strategy
  completionCriteria: CompletionCriteria;
  shouldUpdateMastery: boolean;

  // Display order helpers (for shuffled quiz)
  getActualIndex: (displayIndex: number) => number;
  itemOrder: number[];
}

/**
 * Shuffle array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Hook for managing training session state.
 *
 * @example
 * ```tsx
 * const {
 *   currentItem,
 *   currentMode,
 *   selectMode,
 *   handleCorrect,
 *   handleIncorrect,
 *   isComplete,
 *   results,
 * } = useTrainingSession({
 *   itemType: 'powerChord',
 *   filter: { hand: 'left' },
 *   onComplete: (results) => console.log('Done!', results),
 * });
 * ```
 */
export function useTrainingSession(options: UseTrainingSessionOptions): UseTrainingSessionResult {
  const { itemType, filter, onComplete, onItemComplete } = options;

  const progressService = useProgress();
  const trainingSessionService = getServices().trainingSession;
  const { settings } = useSettings();

  // Mode state
  const [currentMode, setCurrentMode] = useState<TrainingMode>('learn');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Capture items per learn session at mode selection time to avoid mid-session changes
  const itemsPerLearnSessionRef = useRef<number>(settings.training?.itemsPerLearnSession ?? 5);

  // Determine if in quiz/learn mode (needed for item order calculation)
  const isQuizMode = currentMode === 'review-due' || currentMode === 'review-all' || currentMode === 'survival' || currentMode === 'boss';
  const isLearnMode = currentMode === 'learn';

  // Session items state - only updated when session changes (not during active quiz)
  const [sessionItems, setSessionItems] = useState<TrainableItem[]>([]);
  const [sessionItemOrder, setSessionItemOrder] = useState<number[]>([]);

  // Track the session key to know when to refresh items
  const sessionKeyRef = useRef<string>('');

  // Stable reference to total items count - prevents issues with stale closures
  const totalItemsRef = useRef<number>(0);

  // Stable reference to current index - prevents stale closure issues in setTimeout callbacks
  const currentIndexRef = useRef<number>(0);

  // Update session items only when session key changes
  // This prevents items from changing during an active quiz session
  // Use ref value to avoid mid-session changes when settings load
  const currentSessionKey = `${itemType}:${currentMode}:${filter?.hand ?? ''}:${refreshCounter}:${itemsPerLearnSessionRef.current}`;

  if (sessionKeyRef.current !== currentSessionKey) {
    sessionKeyRef.current = currentSessionKey;

    let newItems = trainingSessionService.getItemsForMode(itemType, currentMode, filter);

    // Apply limit for learn mode based on user setting
    if (isLearnMode && newItems.length > itemsPerLearnSessionRef.current) {
      newItems = newItems.slice(0, itemsPerLearnSessionRef.current);
    }

    const newOrder = isQuizMode
      ? shuffleArray(newItems.map((_, i) => i))
      : newItems.map((_, i) => i);

    setSessionItems(newItems);
    setSessionItemOrder(newOrder);
    totalItemsRef.current = newOrder.length;
  }

  // Use stable references for items and itemOrder
  const items = sessionItems;
  const itemOrder = sessionItemOrder;

  // Get session config from strategy
  const sessionConfig = useMemo(() => {
    return trainingSessionService.getSessionConfig(currentMode);
  }, [trainingSessionService, currentMode]);

  const { completionCriteria, shouldUpdateMastery } = sessionConfig;

  // Current index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Keep ref in sync with state (for use in setTimeout callbacks)
  currentIndexRef.current = currentIndex;

  // Progress tracking per item
  const [itemProgressMap, setItemProgressMap] = useState<Map<string, ItemProgress>>(new Map());

  // Quiz results
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Completion state
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<TrainingResults | null>(null);

  // Processing guard
  const isProcessingRef = useRef(false);

  /**
   * Get the actual item index for a display index (handles shuffled order).
   */
  const getActualIndex = useCallback(
    (displayIndex: number): number => {
      return itemOrder[displayIndex] ?? displayIndex;
    },
    [itemOrder]
  );

  /**
   * Get current item based on index and order.
   */
  const currentItem = useMemo(() => {
    if (items.length === 0 || currentIndex >= itemOrder.length) return null;
    const actualIndex = getActualIndex(currentIndex);
    return items[actualIndex] ?? null;
  }, [items, currentIndex, itemOrder, getActualIndex]);

  /**
   * Get progress for current item.
   */
  const itemProgress = useMemo((): ItemProgress => {
    if (!currentItem) {
      return { attempts: 0, successes: 0, completed: false, responseTimes: [] };
    }
    return itemProgressMap.get(currentItem.id) ?? {
      attempts: 0,
      successes: 0,
      completed: false,
      responseTimes: [],
    };
  }, [currentItem, itemProgressMap]);

  /**
   * Calculate session progress.
   */
  const sessionProgress = useMemo((): SessionProgress => {
    let completedItems = 0;
    let totalAttempts = 0;
    let correctAttempts = 0;

    itemProgressMap.forEach((progress) => {
      totalAttempts += progress.attempts;
      correctAttempts += progress.successes;
      if (progress.completed) {
        completedItems++;
      }
    });

    return {
      totalItems: itemOrder.length,
      completedItems,
      totalAttempts,
      correctAttempts,
    };
  }, [itemProgressMap, itemOrder.length]);

  /**
   * Calculate final results.
   */
  const calculateResults = useCallback((): TrainingResults => {
    const allResponseTimes: number[] = [];
    let totalAttempts = 0;
    let correctAttempts = 0;

    itemProgressMap.forEach((progress) => {
      totalAttempts += progress.attempts;
      correctAttempts += progress.successes;
      allResponseTimes.push(...progress.responseTimes);
    });

    const averageResponseTimeMs =
      allResponseTimes.length > 0
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
        : 0;

    return {
      itemsCompleted: itemProgressMap.size,
      totalAttempts,
      correctAttempts,
      averageResponseTimeMs,
      accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      quizResults: quizResults.length > 0 ? quizResults : undefined,
    };
  }, [itemProgressMap, quizResults]);

  /**
   * Handle session completion.
   */
  const handleSessionComplete = useCallback(() => {
    setIsComplete(true);
    const finalResults = calculateResults();
    setResults(finalResults);
    onComplete?.(finalResults);
  }, [calculateResults, onComplete]);

  /**
   * Move to next item.
   * Uses refs to ensure stable values even when called from stale setTimeout closures.
   */
  const moveToNextItem = useCallback(() => {
    const totalItems = totalItemsRef.current;
    const currentIdx = currentIndexRef.current;
    if (currentIdx < totalItems - 1) {
      setCurrentIndex(currentIdx + 1);
    } else {
      handleSessionComplete();
    }
  }, [handleSessionComplete]);

  /**
   * Handle correct response.
   */
  const handleCorrect = useCallback(
    (responseTimeMs: number) => {
      if (!currentItem) return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setFeedback('correct');

      // Calculate success count and shouldAdvance BEFORE state updates
      // to avoid stale closure issues when reading itemProgressMap
      const previousProgress = itemProgressMap.get(currentItem.id);
      const previousSuccesses = previousProgress?.successes ?? 0;
      const newSuccessCount = previousSuccesses + 1;
      const successesRequired = completionCriteria.isQuizMode
        ? 1
        : completionCriteria.successesRequired;
      const shouldAdvance = newSuccessCount >= successesRequired;

      // Play audio feedback
      if (itemType === 'powerChord') {
        // Audio service needs the PowerChord, but we have TrainableItem
        // For now, just play a success sound or skip
        // This would be improved when we have a unified audio method
      }

      // Record to progress service
      if (itemType === 'powerChord') {
        progressService.recordPowerChordAttempt(currentItem.id, true, responseTimeMs, !shouldUpdateMastery);
      } else {
        const currentAttempts = previousProgress?.attempts ?? 0;
        progressService.recordWordAttempt(currentItem.id, true, responseTimeMs, currentAttempts + 1, !shouldUpdateMastery);
      }

      // Update item progress
      setItemProgressMap((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(currentItem.id) ?? {
          attempts: 0,
          successes: 0,
          completed: false,
          responseTimes: [],
        };

        const newSuccesses = current.successes + 1;
        const isItemComplete = newSuccesses >= successesRequired;

        // Cap responseTimes to prevent unbounded memory growth
        const newResponseTimes = [...current.responseTimes, responseTimeMs];
        if (newResponseTimes.length > MAX_RESPONSE_TIMES_PER_ITEM) {
          newResponseTimes.shift();
        }

        const updated: ItemProgress = {
          attempts: current.attempts + 1,
          successes: newSuccesses,
          completed: isItemComplete,
          responseTimes: newResponseTimes,
        };

        newMap.set(currentItem.id, updated);

        // Call onItemComplete if item just completed
        if (isItemComplete && onItemComplete) {
          onItemComplete(currentItem, updated);
        }

        // When item completes in learn mode (shouldUpdateMastery=false),
        // transition from NEW to LEARNING so it appears in Review modes
        if (isItemComplete && !shouldUpdateMastery) {
          progressService.transitionFromNewToLearning(currentItem.id, itemType);
        }

        return newMap;
      });

      // Quiz mode: add to results
      if (isQuizMode) {
        setQuizResults((prev) => [
          ...prev,
          { itemId: currentItem.id, correct: true, responseTimeMs },
        ]);
      }

      // Use shouldAdvance calculated at the start of function (before state updates)
      if (shouldAdvance) {
        setTimeout(() => {
          moveToNextItem();
          setFeedback(null);
          isProcessingRef.current = false;
        }, ITEM_COMPLETION_DELAY_MS);
      } else {
        setTimeout(() => {
          setFeedback(null);
          isProcessingRef.current = false;
        }, FEEDBACK_DISPLAY_MS);
      }
    },
    [
      currentItem,
      itemType,
      shouldUpdateMastery,
      progressService,
      isQuizMode,
      completionCriteria,
      itemProgressMap,
      moveToNextItem,
      onItemComplete,
    ]
  );

  /**
   * Handle incorrect response.
   */
  const handleIncorrect = useCallback(
    (responseTimeMs: number) => {
      if (!currentItem) return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setFeedback('incorrect');

      // Record to progress service
      if (itemType === 'powerChord') {
        progressService.recordPowerChordAttempt(currentItem.id, false, responseTimeMs, !shouldUpdateMastery);
      } else {
        const currentAttempts = itemProgressMap.get(currentItem.id)?.attempts ?? 0;
        progressService.recordWordAttempt(currentItem.id, false, responseTimeMs, currentAttempts + 1, !shouldUpdateMastery);
      }

      // Update item progress (increment attempts only)
      setItemProgressMap((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(currentItem.id) ?? {
          attempts: 0,
          successes: 0,
          completed: false,
          responseTimes: [],
        };

        // Cap responseTimes to prevent unbounded memory growth
        const newResponseTimes = [...current.responseTimes, responseTimeMs];
        if (newResponseTimes.length > MAX_RESPONSE_TIMES_PER_ITEM) {
          newResponseTimes.shift();
        }

        newMap.set(currentItem.id, {
          ...current,
          attempts: current.attempts + 1,
          responseTimes: newResponseTimes,
        });

        return newMap;
      });

      // Quiz mode: add to results and advance
      if (isQuizMode) {
        setQuizResults((prev) => [
          ...prev,
          { itemId: currentItem.id, correct: false, responseTimeMs },
        ]);

        setTimeout(() => {
          moveToNextItem();
          setFeedback(null);
          isProcessingRef.current = false;
        }, ITEM_COMPLETION_DELAY_MS);
      } else {
        setTimeout(() => {
          setFeedback(null);
          isProcessingRef.current = false;
        }, FEEDBACK_DISPLAY_MS);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemProgressMap intentionally excluded to avoid recreating callback on every progress update
    [currentItem, itemType, shouldUpdateMastery, progressService, isQuizMode, moveToNextItem]
  );

  /**
   * Select a new training mode.
   */
  const selectMode = useCallback((mode: TrainingMode) => {
    // Capture current settings value for new session
    itemsPerLearnSessionRef.current = settings.training?.itemsPerLearnSession ?? 5;

    setCurrentMode(mode);
    setCurrentIndex(0);
    setItemProgressMap(new Map());
    setQuizResults([]);
    setFeedback(null);
    setIsComplete(false);
    setResults(null);
    isProcessingRef.current = false;

    // Always refresh items to pick up mastery level changes
    // This ensures that items transitioned from NEW to LEARNING
    // are excluded when selecting learn mode again
    setRefreshCounter((c) => c + 1);
  }, [settings.training?.itemsPerLearnSession]);

  /**
   * Restart the current session.
   */
  const restart = useCallback(() => {
    setCurrentIndex(0);
    setItemProgressMap(new Map());
    setQuizResults([]);
    setFeedback(null);
    setIsComplete(false);
    setResults(null);
    isProcessingRef.current = false;

    // Re-shuffle for quiz modes by triggering refresh
    if (isQuizMode) {
      setRefreshCounter((c) => c + 1);
    }
  }, [isQuizMode]);

  /**
   * Refresh items (re-fetch from service).
   */
  const refreshItems = useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  return {
    // Items
    items,
    currentItem,
    currentIndex,
    totalItems: itemOrder.length,

    // Mode
    currentMode,
    isQuizMode,
    isLearnMode,
    selectMode,

    // Progress
    itemProgress,
    sessionProgress,
    quizResults,

    // Feedback
    feedback,
    setFeedback,

    // Actions
    handleCorrect,
    handleIncorrect,
    moveToNextItem,
    restart,
    refreshItems,

    // Completion
    isComplete,
    results,

    // Config
    completionCriteria,
    shouldUpdateMastery,

    // Order helpers
    getActualIndex,
    itemOrder,
  };
}

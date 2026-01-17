/**
 * Character Quiz Component
 *
 * A quiz mode that tests character knowledge with spaced repetition.
 * Supports two modes:
 * - Standard: Fixed number of questions, multiple attempts allowed
 * - Endless: Continue until mistake or timeout, first-try only
 *
 * Uses the LearningService/ProgressService for SRS-based item selection
 * and progress tracking.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Direction, FingerId } from '../../../domain';
import {
  getFingerName,
  getDirectionSymbol,
  FINGER_COLORS,
} from '../../../config/fingerMapping';
import { getMnemonic } from '../../../config/fingerMnemonics';
import { getFingerColor } from '../../../data/static/colorConfig';
import { useProgress, useAudio, useKeyboardNavigation } from '../../../hooks';
import { useLayoutContext } from '../../../hooks/LayoutContext';
import { getHighScoreService } from '../../../services';
import './CharacterQuiz.css';

/**
 * Difficulty levels for endless mode with time limits in ms.
 */
export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; timeMs: number; description: string }> = {
  beginner: { label: 'Beginner', timeMs: 10000, description: '10 seconds per character' },
  easy: { label: 'Easy', timeMs: 5000, description: '5 seconds per character' },
  medium: { label: 'Medium', timeMs: 2000, description: '2 seconds per character' },
  hard: { label: 'Hard', timeMs: 1000, description: '1 second per character' },
  expert: { label: 'Expert', timeMs: 500, description: '500ms per character' },
};

export type QuizMode = 'standard' | 'endless';

interface CharacterQuizProps {
  /** Callback when quiz is complete */
  onComplete: () => void;
  /** Optional back button handler */
  onBack?: () => void;
  /** Number of questions to complete (standard mode) */
  questionCount?: number;
  /** Quiz mode: standard (fixed questions) or endless (until mistake) */
  mode?: QuizMode;
  /** Difficulty level (endless mode) */
  difficulty?: DifficultyLevel;
  /** Whether to show mode/difficulty selector */
  showModeSelector?: boolean;
  /** Limit quiz to specific fingers (optional) */
  fingers?: FingerId[];
  /** Limit quiz to specific characters (optional) - takes precedence over fingers */
  characters?: string[];
  /** Custom title for the quiz */
  title?: string;
  /** Custom subtitle for the quiz */
  subtitle?: string;
  /** Skip mastery updates - use for practice quizzes after Learn More (default: false) */
  skipMasteryUpdate?: boolean;
}

interface QuizItem {
  char: string;
  fingerId: FingerId;
  direction: Direction;
  color: string;
}

const QUIZ_LENGTH = 20;
const PASS_THRESHOLD = 0.8; // 80% correct to pass

export function CharacterQuiz({
  onComplete,
  onBack,
  questionCount = QUIZ_LENGTH,
  mode: initialMode,
  difficulty: initialDifficulty = 'medium',
  showModeSelector = false,
  fingers,
  characters,
  title,
  subtitle,
  skipMasteryUpdate = false,
}: CharacterQuizProps) {
  const progressService = useProgress();
  const highScoreService = getHighScoreService();
  const { playFingerNote, playErrorSound } = useAudio();
  const { getAllCharacters, getConfigForChar } = useLayoutContext();

  // Mode selection state
  const [showSelector, setShowSelector] = useState(showModeSelector && !initialMode);
  const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode ?? 'standard');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(initialDifficulty);

  // Keyboard navigation for mode selector
  const modeItems = useMemo(() => [
    { id: 'standard', onActivate: () => setSelectedMode('standard') },
    { id: 'endless', onActivate: () => setSelectedMode('endless') },
  ], []);

  const difficultyItems = useMemo(() => {
    return (Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((level) => ({
      id: level,
      onActivate: () => setSelectedDifficulty(level),
    }));
  }, []);

  const { getItemProps: getModeItemProps } = useKeyboardNavigation({
    areaId: 'quiz-mode-selector',
    layout: 'horizontal',
    items: modeItems,
    enabled: showSelector,
    onEscape: onBack,
  });

  const { getItemProps: getDifficultyItemProps } = useKeyboardNavigation({
    areaId: 'quiz-difficulty-selector',
    layout: 'horizontal',
    items: difficultyItems,
    enabled: showSelector && selectedMode === 'endless',
  });

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | 'showing-answer' | null>(null);
  const [attemptStartTime, setAttemptStartTime] = useState<number>(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [incorrectChars, setIncorrectChars] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Timer ref for endless mode
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Abort handler for ESC during quiz
  const handleQuizEscape = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (onBack) {
      onBack();
    } else {
      onComplete();
    }
  }, [onBack, onComplete]);

  // Keyboard navigation for quiz phase (handles ESC to abort)
  useKeyboardNavigation({
    areaId: 'quiz-active',
    layout: 'vertical',
    items: [], // No focusable items, just ESC handling
    enabled: !showSelector && !showResults,
    onEscape: handleQuizEscape,
  });

  // All available characters (filtered by characters or fingers if provided)
  const allChars = useMemo<QuizItem[]>(() => {
    const chars: QuizItem[] = [];

    // If specific characters are provided, use only those
    if (characters && characters.length > 0) {
      for (const char of characters) {
        const config = getConfigForChar(char);
        if (config) {
          chars.push({
            char,
            fingerId: config.fingerId,
            direction: config.direction,
            color: getFingerColor(config.fingerId, config.direction),
          });
        }
      }
      return chars;
    }

    // Otherwise, use all characters (filtered by fingers if provided)
    for (const char of getAllCharacters()) {
      const config = getConfigForChar(char);
      if (config) {
        // Filter by fingers if provided
        if (fingers && !fingers.includes(config.fingerId)) {
          continue;
        }
        chars.push({
          char,
          fingerId: config.fingerId,
          direction: config.direction,
          color: getFingerColor(config.fingerId, config.direction),
        });
      }
    }
    return chars;
  }, [fingers, characters, getAllCharacters, getConfigForChar]);

  // Generate quiz items for standard mode
  const quizItems = useMemo<QuizItem[]>(() => {
    if (selectedMode === 'endless') return []; // Endless generates dynamically

    const items: QuizItem[] = [];
    const usedChars = new Set<string>();

    // If specific characters were provided, preserve their order (for priority-based review)
    // Otherwise shuffle for random quiz order
    const sourceChars = (characters && characters.length > 0)
      ? allChars  // Already in priority order from characters prop
      : [...allChars].sort(() => Math.random() - 0.5);  // Shuffle for random order

    for (const item of sourceChars) {
      if (items.length >= questionCount) break;
      if (!usedChars.has(item.char)) {
        items.push(item);
        usedChars.add(item.char);
      }
    }

    // Only pad with repeated items if specific characters weren't provided
    // (When characters prop is used for review-due/review-all, don't add extra items)
    if (!characters || characters.length === 0) {
      while (items.length < questionCount && allChars.length > 0) {
        const randomItem = allChars[Math.floor(Math.random() * allChars.length)];
        items.push({ ...randomItem });
      }
    }

    return items;
  }, [questionCount, allChars, selectedMode, characters]);

  // Current item for endless mode (random each time)
  const [endlessItem, setEndlessItem] = useState<QuizItem | null>(null);

  // Get current item based on mode
  const currentItem = selectedMode === 'endless'
    ? endlessItem
    : quizItems[currentIndex];

  const totalQuestions = quizItems.length;

  // Generate next endless item
  const generateNextEndlessItem = useCallback(() => {
    const randomItem = allChars[Math.floor(Math.random() * allChars.length)];
    setEndlessItem(randomItem);
    setAttemptStartTime(Date.now());

    // Set up timer for endless mode
    const timeLimit = DIFFICULTY_CONFIG[selectedDifficulty].timeMs;
    setTimeRemaining(timeLimit);

    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Countdown timer (update every 100ms)
    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        const newTime = prev - 100;
        return newTime > 0 ? newTime : 0;
      });
    }, 100);

    // Timeout timer
    timerRef.current = setTimeout(() => {
      handleTimeout();
    }, timeLimit);
  }, [allChars, selectedDifficulty]);

  // Handle timeout in endless mode
  const handleTimeout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    playErrorSound?.();
    setFeedback('timeout');

    // Record the timeout as incorrect
    if (endlessItem) {
      progressService.recordCharacterAttempt(
        endlessItem.char,
        false,
        DIFFICULTY_CONFIG[selectedDifficulty].timeMs,
        endlessItem.direction,
        skipMasteryUpdate
      );
      setIncorrectChars((chars) => {
        if (!chars.includes(endlessItem.char)) {
          return [...chars, endlessItem.char];
        }
        return chars;
      });
    }

    // Check and save high score
    const newHighScore = highScoreService.setHighScore('endless-characters', selectedDifficulty, streak);
    setIsNewHighScore(newHighScore);

    setTimeout(() => {
      setShowResults(true);
    }, 1000);
  }, [endlessItem, streak, selectedDifficulty, playErrorSound, progressService]);

  // Start endless mode
  const startEndlessMode = useCallback(() => {
    setShowSelector(false);
    setStreak(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
    setFeedback(null);
    setIncorrectChars([]);
    setIsNewHighScore(false);
    generateNextEndlessItem();
  }, [generateNextEndlessItem]);

  // Start standard mode
  const startStandardMode = useCallback(() => {
    setShowSelector(false);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
    setFeedback(null);
    setIncorrectChars([]);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Reset attempt timer when question changes (standard mode)
  useEffect(() => {
    if (selectedMode === 'standard') {
      setAttemptStartTime(Date.now());
    }
  }, [currentIndex, selectedMode]);

  // Window-level Enter key handler for mode selector
  // This allows pressing Enter to start the quiz from the mode selector
  useEffect(() => {
    if (!showSelector) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedMode === 'endless') {
          startEndlessMode();
        } else {
          startStandardMode();
        }
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [showSelector, selectedMode, startEndlessMode, startStandardMode]);

  // Ref to track pending timeout for skipping
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Allow Enter to continue from results screen
      if (showResults && event.key === 'Enter') {
        event.preventDefault();
        onComplete();
        return;
      }

      if (showResults || showSelector || !currentItem) return;

      // Allow Enter to skip feedback and advance immediately
      if (event.key === 'Enter' && feedback) {
        event.preventDefault();
        // Clear pending timeout
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = null;
        }

        if (selectedMode === 'endless') {
          setFeedback(null);
          // In endless mode, Enter after error goes to results
          if (feedback === 'incorrect' || feedback === 'timeout') {
            setShowResults(true);
          } else {
            generateNextEndlessItem();
          }
        } else {
          // Standard mode
          if (feedback === 'showing-answer' || feedback === 'incorrect') {
            // Continue from showing answer to next question
            setFeedback(null);
            if (currentIndex < totalQuestions - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              setShowResults(true);
            }
          } else if (feedback === 'correct') {
            // Skip correct feedback
            setFeedback(null);
            if (currentIndex < totalQuestions - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              setShowResults(true);
            }
          }
        }
        return;
      }

      if (feedback) return; // Wait for feedback to clear

      // Only handle single character keys (ignore modifiers, arrows, etc.)
      if (event.key.length !== 1) return;

      const key = event.key.toLowerCase();
      const expectedChar = currentItem.char.toLowerCase();
      const isCorrect = key === expectedChar;

      const responseTime = Date.now() - attemptStartTime;

      // Record attempt
      progressService.recordCharacterAttempt(
        currentItem.char,
        isCorrect,
        responseTime,
        currentItem.direction,
        skipMasteryUpdate
      );

      if (selectedMode === 'endless') {
        // Endless mode: first try only, with timer
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        if (isCorrect) {
          playFingerNote(currentItem.fingerId);
          setFeedback('correct');
          setCorrectCount((c) => c + 1);
          setStreak((s) => s + 1);

          feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback(null);
            generateNextEndlessItem();
          }, 200);
        } else {
          // Wrong answer - game over
          playErrorSound?.();
          setFeedback('incorrect');
          setIncorrectCount((c) => c + 1);
          setIncorrectChars((chars) => {
            if (!chars.includes(currentItem.char)) {
              return [...chars, currentItem.char];
            }
            return chars;
          });

          // Check and save high score
          const newHighScore = highScoreService.setHighScore('endless-characters', selectedDifficulty, streak);
          setIsNewHighScore(newHighScore);

          feedbackTimeoutRef.current = setTimeout(() => {
            setShowResults(true);
          }, 800);
        }
      } else {
        // Standard mode: multiple tries allowed
        if (isCorrect) {
          playFingerNote(currentItem.fingerId);
          setFeedback('correct');
          setCorrectCount((c) => c + 1);

          feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback(null);
            if (currentIndex < totalQuestions - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              setShowResults(true);
            }
          }, 300);
        } else {
          playErrorSound?.();
          setFeedback('incorrect');
          setIncorrectCount((c) => c + 1);
          setIncorrectChars((chars) => {
            if (!chars.includes(currentItem.char)) {
              return [...chars, currentItem.char];
            }
            return chars;
          });

          // Show detailed answer after brief incorrect feedback
          feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback('showing-answer');
            // Don't auto-advance - wait for user to press Enter or click Continue
          }, 500);
        }
      }
    },
    [
      showResults,
      showSelector,
      currentItem,
      feedback,
      attemptStartTime,
      currentIndex,
      totalQuestions,
      selectedMode,
      selectedDifficulty,
      streak,
      playFingerNote,
      playErrorSound,
      progressService,
      generateNextEndlessItem,
      onComplete,
      skipMasteryUpdate,
    ]
  );

  // Set up keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate results
  const accuracy = totalQuestions > 0
    ? correctCount / (correctCount + incorrectCount)
    : 0;
  const passed = accuracy >= PASS_THRESHOLD;

  // Retry quiz
  const handleRetry = useCallback(() => {
    if (selectedMode === 'endless') {
      startEndlessMode();
    } else {
      startStandardMode();
    }
  }, [selectedMode, startEndlessMode, startStandardMode]);

  // Back to mode selector
  const backToSelector = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowSelector(true);
    setShowResults(false);
    setFeedback(null);
  }, []);

  // Abort quiz and go back
  const handleAbort = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (onBack) {
      onBack();
    } else {
      onComplete();
    }
  }, [onBack, onComplete]);

  // Get high scores
  const highScores = useMemo(() => {
    const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const scores: Record<DifficultyLevel, number> = {} as Record<DifficultyLevel, number>;
    for (const level of levels) {
      scores[level] = highScoreService.getHighScore('endless-characters', level);
    }
    return scores;
  }, [showResults, highScoreService]);

  // Render mode selector
  const renderModeSelector = () => (
    <div className="character-quiz__selector">
      <h2 className="character-quiz__selector-title">Choose Quiz Mode</h2>

      <div className="character-quiz__mode-cards" role="listbox" aria-label="Quiz mode">
        {/* Standard Mode */}
        <div
          className={`character-quiz__mode-card ${selectedMode === 'standard' ? 'selected' : ''} ${getModeItemProps('standard', 'keyboard-focus--card').className}`}
          onClick={getModeItemProps('standard').onClick}
          data-keyboard-focus={getModeItemProps('standard')['data-keyboard-focus']}
          role="option"
          aria-selected={selectedMode === 'standard'}
        >
          <span className="character-quiz__mode-icon">📝</span>
          <h3 className="character-quiz__mode-name">Standard Quiz</h3>
          <p className="character-quiz__mode-desc">
            {questionCount} questions, take your time
          </p>
        </div>

        {/* Endless Mode */}
        <div
          className={`character-quiz__mode-card ${selectedMode === 'endless' ? 'selected' : ''} ${getModeItemProps('endless', 'keyboard-focus--card').className}`}
          onClick={getModeItemProps('endless').onClick}
          data-keyboard-focus={getModeItemProps('endless')['data-keyboard-focus']}
          role="option"
          aria-selected={selectedMode === 'endless'}
        >
          <span className="character-quiz__mode-icon">⚡</span>
          <h3 className="character-quiz__mode-name">Endless Mode</h3>
          <p className="character-quiz__mode-desc">
            First try only, beat the clock!
          </p>
        </div>
      </div>

      {/* Difficulty selector for endless mode */}
      {selectedMode === 'endless' && (
        <div className="character-quiz__difficulty">
          <h3 className="character-quiz__difficulty-title">Select Difficulty</h3>
          <div className="character-quiz__difficulty-options" role="listbox" aria-label="Difficulty level">
            {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((level) => {
              const config = DIFFICULTY_CONFIG[level];
              const highScore = highScores[level];
              const difficultyProps = getDifficultyItemProps(level, 'keyboard-focus--button');
              return (
                <button
                  key={level}
                  className={`character-quiz__difficulty-btn ${selectedDifficulty === level ? 'selected' : ''} ${difficultyProps.className}`}
                  onClick={difficultyProps.onClick}
                  data-keyboard-focus={difficultyProps['data-keyboard-focus']}
                  aria-selected={selectedDifficulty === level}
                >
                  <span className="character-quiz__difficulty-label">{config.label}</span>
                  <span className="character-quiz__difficulty-time">{config.description}</span>
                  {highScore > 0 && (
                    <span className="character-quiz__difficulty-score">Best: {highScore}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="character-quiz__selector-actions">
        <button
          className="character-quiz__start-btn"
          onClick={selectedMode === 'endless' ? startEndlessMode : startStandardMode}
        >
          Start {selectedMode === 'endless' ? 'Endless' : 'Quiz'}
        </button>
        {onBack && (
          <button className="character-quiz__back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );

  // Render quiz question
  const renderQuestion = () => {
    if (!currentItem) return null;

    const timeLimit = selectedMode === 'endless' ? DIFFICULTY_CONFIG[selectedDifficulty].timeMs : null;
    const timePercent = timeLimit && timeRemaining !== null
      ? (timeRemaining / timeLimit) * 100
      : 100;

    return (
      <div className={`character-quiz__question ${feedback ?? ''}`}>
        {/* Progress/Timer bar */}
        <div className="character-quiz__progress-bar">
          {selectedMode === 'endless' ? (
            <div
              className={`character-quiz__timer-fill ${timePercent < 30 ? 'low' : ''}`}
              style={{ width: `${timePercent}%` }}
            />
          ) : (
            <div
              className="character-quiz__progress-fill"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          )}
        </div>

        {/* Title if provided */}
        {title && <h2 className="character-quiz__title">{title}</h2>}

        <div className="character-quiz__header">
          {selectedMode === 'endless' ? (
            <>
              <span className="character-quiz__streak">
                🔥 Streak: {streak}
              </span>
              <span className="character-quiz__timer-text">
                {timeRemaining !== null ? (timeRemaining / 1000).toFixed(1) : '0.0'}s
              </span>
            </>
          ) : (
            <>
              <span className="character-quiz__counter">
                {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="character-quiz__score">
                {correctCount} correct
              </span>
            </>
          )}
        </div>

        <div className="character-quiz__prompt">
          <span className="character-quiz__instruction">Type this character:</span>
          <span
            className="character-quiz__target"
            style={{ color: currentItem.color }}
          >
            {currentItem.char.toUpperCase()}
          </span>
        </div>

        {/* Show detailed answer after incorrect (standard mode only) */}
        {feedback === 'showing-answer' && selectedMode === 'standard' && (() => {
          const mnemonic = getMnemonic(currentItem.fingerId);
          const fingerColor = FINGER_COLORS[currentItem.fingerId];
          return (
            <div className="character-quiz__answer-reveal">
              <button
                className="character-quiz__continue-btn"
                onClick={() => {
                  setFeedback(null);
                  if (currentIndex < totalQuestions - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    setShowResults(true);
                  }
                }}
              >
                Continue (Enter)
              </button>

              <div className="character-quiz__answer-header">
                <span className="character-quiz__answer-label">The answer was:</span>
              </div>

              <div className="character-quiz__answer-char" style={{ color: currentItem.color }}>
                {currentItem.char.toUpperCase()}
              </div>

              <div className="character-quiz__answer-details">
                <div className="character-quiz__answer-finger" style={{ color: fingerColor }}>
                  <span className="character-quiz__answer-finger-name">{getFingerName(currentItem.fingerId)}</span>
                  <span className="character-quiz__answer-direction">{getDirectionSymbol(currentItem.direction)} {currentItem.direction.toLowerCase()}</span>
                </div>

                {mnemonic.phrase && (
                  <div className="character-quiz__answer-mnemonic">
                    <span className="character-quiz__mnemonic-phrase">"{mnemonic.phrase}"</span>
                    <span className="character-quiz__mnemonic-explanation">{mnemonic.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Timeout feedback (endless mode) */}
        {feedback === 'timeout' && (
          <div className="character-quiz__hint character-quiz__hint--timeout">
            <span className="character-quiz__hint-text">
              Time's up! The answer was: {getFingerName(currentItem.fingerId)} {getDirectionSymbol(currentItem.direction)}
            </span>
          </div>
        )}

        {/* Feedback overlay */}
        {feedback === 'correct' && (
          <div className="character-quiz__feedback character-quiz__feedback--correct">
            ✓
          </div>
        )}
        {feedback === 'incorrect' && (
          <div className="character-quiz__feedback character-quiz__feedback--incorrect">
            ✗
          </div>
        )}
        {feedback === 'timeout' && (
          <div className="character-quiz__feedback character-quiz__feedback--timeout">
            ⏱
          </div>
        )}
      </div>
    );
  };

  // Render results
  const renderResults = () => {
    if (selectedMode === 'endless') {
      // Endless mode results
      const currentHighScore = highScores[selectedDifficulty];

      return (
        <div className="character-quiz__results character-quiz__results--endless">
          <div className={`character-quiz__result-icon ${isNewHighScore ? 'new-record' : ''}`}>
            {isNewHighScore ? '🏆' : streak >= 10 ? '🔥' : '💪'}
          </div>

          {isNewHighScore && (
            <div className="character-quiz__new-record">NEW HIGH SCORE!</div>
          )}

          <h2 className="character-quiz__result-title">
            {feedback === 'timeout' ? "Time's Up!" : 'Game Over!'}
          </h2>

          <div className="character-quiz__stats">
            <div className="character-quiz__stat character-quiz__stat--large">
              <span className="character-quiz__stat-value">{streak}</span>
              <span className="character-quiz__stat-label">Final Streak</span>
            </div>
          </div>

          <div className="character-quiz__high-score">
            <span className="character-quiz__high-score-label">
              {DIFFICULTY_CONFIG[selectedDifficulty].label} High Score:
            </span>
            <span className="character-quiz__high-score-value">
              {Math.max(currentHighScore, streak)}
            </span>
          </div>

          {incorrectChars.length > 0 && (
            <div className="character-quiz__review">
              <h3 className="character-quiz__review-title">Missed Character:</h3>
              <div className="character-quiz__review-chars">
                {incorrectChars.slice(-1).map((char) => {
                  const config = getConfigForChar(char);
                  const color = config
                    ? getFingerColor(config.fingerId, config.direction)
                    : '#888';
                  return (
                    <div key={char} className="character-quiz__missed-char">
                      <span
                        className="character-quiz__review-char"
                        style={{ color }}
                      >
                        {char.toUpperCase()}
                      </span>
                      {config && (
                        <span className="character-quiz__missed-hint">
                          {getFingerName(config.fingerId)} {getDirectionSymbol(config.direction)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="character-quiz__actions">
            <button
              className="character-quiz__retry-btn"
              onClick={handleRetry}
            >
              Try Again
            </button>
            {showModeSelector && (
              <button
                className="character-quiz__skip-btn"
                onClick={backToSelector}
              >
                Change Mode
              </button>
            )}
            <button
              className="character-quiz__skip-btn"
              onClick={onComplete}
            >
              Exit
            </button>
          </div>
        </div>
      );
    }

    // Standard mode results
    return (
      <div className="character-quiz__results">
        <div className={`character-quiz__result-icon ${passed ? 'passed' : 'failed'}`}>
          {passed ? '🎉' : '📚'}
        </div>

        <h2 className="character-quiz__result-title">
          {passed ? 'Quiz Complete!' : 'Keep Practicing!'}
        </h2>

        <div className="character-quiz__stats">
          <div className="character-quiz__stat">
            <span className="character-quiz__stat-value">{correctCount}</span>
            <span className="character-quiz__stat-label">Correct</span>
          </div>
          <div className="character-quiz__stat">
            <span className="character-quiz__stat-value">{incorrectCount}</span>
            <span className="character-quiz__stat-label">Incorrect</span>
          </div>
          <div className="character-quiz__stat">
            <span className="character-quiz__stat-value">
              {Math.round(accuracy * 100)}%
            </span>
            <span className="character-quiz__stat-label">Accuracy</span>
          </div>
        </div>

        {incorrectChars.length > 0 && (
          <div className="character-quiz__review">
            <h3 className="character-quiz__review-title">Characters to Review:</h3>
            <div className="character-quiz__review-chars">
              {incorrectChars.map((char) => {
                const config = getConfigForChar(char);
                const color = config
                  ? getFingerColor(config.fingerId, config.direction)
                  : '#888';
                return (
                  <span
                    key={char}
                    className="character-quiz__review-char"
                    style={{ color }}
                  >
                    {char.toUpperCase()}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="character-quiz__actions">
          {passed ? (
            <button
              className="character-quiz__continue-btn"
              onClick={onComplete}
            >
              Continue
            </button>
          ) : (
            <>
              <button
                className="character-quiz__retry-btn"
                onClick={handleRetry}
              >
                Try Again
              </button>
              <button
                className="character-quiz__skip-btn"
                onClick={onComplete}
              >
                Continue Anyway
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="character-quiz">
      {/* Back button - shown during quiz (not on selector or results) */}
      {!showSelector && !showResults && (
        <button className="character-quiz__back-btn" onClick={handleAbort}>
          ← Back
        </button>
      )}

      <div className="character-quiz__content">
        {showSelector && renderModeSelector()}
        {!showSelector && !showResults && renderQuestion()}
        {!showSelector && showResults && renderResults()}
      </div>
    </div>
  );
}

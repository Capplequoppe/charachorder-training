/**
 * Finger Lesson Component
 *
 * Teaches one finger at a time through three phases:
 * 1. Introduction - Show finger, its color, and all characters
 * 2. Guided Practice - Show character, user presses it (with visual hints)
 * 3. Quiz - Show character, user must recall and press correct key (timed)
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FingerId, Direction } from '../../domain';
import {
  getCharsForFinger,
  getConfigForChar,
  getFingerName,
  getDirectionSymbol,
  FINGER_COLORS,
} from '../../config/fingerMapping';
import { getFingerColor } from '../../data/static/colorConfig';
import { getMnemonic } from '../../config/fingerMnemonics';
import { useProgress, useAudio } from '../../hooks';
import './FingerLesson.css';

type LessonPhase = 'intro' | 'guided' | 'quiz' | 'complete';

// Debug flag - set to true to see console logs
const DEBUG = false;

interface CharacterInfo {
  char: string;
  direction: Direction;
  color: string;
}

interface FingerLessonProps {
  /** The finger to teach */
  fingerId: FingerId;
  /** Callback when lesson is complete */
  onComplete: () => void;
  /** Optional callback for back button */
  onBack?: () => void;
}

const REQUIRED_CORRECT_GUIDED = 2; // Correct per character in guided mode
const REQUIRED_CORRECT_QUIZ = 3; // Correct per character in quiz mode

export function FingerLesson({
  fingerId,
  onComplete,
  onBack,
}: FingerLessonProps) {
  const progressService = useProgress();
  const { playFingerNote, playErrorSound } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<LessonPhase>('intro');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [attemptStartTime, setAttemptStartTime] = useState<number>(Date.now());

  // Get characters for this finger
  const characters = useMemo<CharacterInfo[]>(() => {
    const chars = getCharsForFinger(fingerId);
    return chars.map((char) => {
      const config = getConfigForChar(char);
      return {
        char,
        direction: config?.direction ?? Direction.DOWN,
        color: config ? getFingerColor(config.fingerId, config.direction) : '#888',
      };
    });
  }, [fingerId]);

  const currentChar = characters[currentCharIndex];
  const fingerColor = FINGER_COLORS[fingerId];
  const fingerName = getFingerName(fingerId);

  // Reset state when finger changes
  useEffect(() => {
    setPhase('intro');
    setCurrentCharIndex(0);
    setCorrectCount(0);
    setShowHint(true);
    setFeedback(null);
  }, [fingerId]);

  // Reset attempt timer when character changes
  useEffect(() => {
    setAttemptStartTime(Date.now());
  }, [currentCharIndex, phase]);

  // Focus container when phase changes (for keyboard navigation)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
      if (DEBUG) console.log('[FingerLesson] Focused container for phase:', phase);
    }
  }, [phase]);

  // Window-level Enter key handler for intro phase
  // This ensures Enter works even when container isn't focused
  useEffect(() => {
    if (phase !== 'intro') return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setPhase('guided');
        setTimeout(() => containerRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [phase]);

  // Window-level Enter key handler for complete phase
  // This ensures Enter works to continue after completing a finger
  useEffect(() => {
    if (phase !== 'complete') return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onComplete();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [phase, onComplete]);

  // Handle key press (React event handler)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (DEBUG) console.log('[FingerLesson] Key pressed:', event.key, 'phase:', phase);

      // Allow Enter to start practice on intro phase
      if (phase === 'intro' && event.key === 'Enter') {
        event.preventDefault();
        setPhase('guided');
        setTimeout(() => containerRef.current?.focus(), 0);
        return;
      }

      // Skip handling for intro/complete phases (handled by window-level Enter handlers)
      if (phase === 'intro' || phase === 'complete') return;
      if (feedback) return; // Wait for feedback to clear

      // Only handle single character keys (ignore modifiers, arrows, etc.)
      if (event.key.length !== 1) return;

      // Prevent default to avoid scrolling or other browser behavior
      event.preventDefault();

      const key = event.key.toLowerCase();
      const expectedChar = currentChar.char.toLowerCase();
      const isCorrect = key === expectedChar;

      if (DEBUG) console.log('[FingerLesson] Expected:', expectedChar, 'Got:', key, 'Correct:', isCorrect);

      const responseTime = Date.now() - attemptStartTime;

      if (isCorrect) {
        // Play success sound
        playFingerNote(fingerId);
        setFeedback('correct');

        // Record attempt (skip mastery updates during learning phase)
        progressService.recordCharacterAttempt(
          currentChar.char,
          true,
          responseTime,
          currentChar.direction,
          true
        );

        const newCorrectCount = correctCount + 1;
        setCorrectCount(newCorrectCount);

        // Check if we've completed this character
        const requiredCorrect = phase === 'guided' ? REQUIRED_CORRECT_GUIDED : REQUIRED_CORRECT_QUIZ;

        setTimeout(() => {
          setFeedback(null);

          if (newCorrectCount >= requiredCorrect) {
            // Move to next character
            if (currentCharIndex < characters.length - 1) {
              setCurrentCharIndex(currentCharIndex + 1);
              setCorrectCount(0);
              if (phase === 'guided') {
                setShowHint(true);
              }
            } else {
              // All characters done for this phase
              if (phase === 'guided') {
                // Move to quiz phase
                setPhase('quiz');
                setCurrentCharIndex(0);
                setCorrectCount(0);
                setShowHint(false);
              } else {
                // Lesson complete
                setPhase('complete');
              }
            }
          }
        }, 400);
      } else {
        // Incorrect
        playErrorSound?.();
        setFeedback('incorrect');

        // Record attempt (skip mastery updates during learning phase)
        progressService.recordCharacterAttempt(
          currentChar.char,
          false,
          responseTime,
          currentChar.direction,
          true
        );

        // Show hint if in guided mode
        if (phase === 'guided') {
          setShowHint(true);
        }

        setTimeout(() => {
          setFeedback(null);
        }, 400);
      }
    },
    [
      phase,
      feedback,
      currentChar,
      attemptStartTime,
      correctCount,
      currentCharIndex,
      characters.length,
      fingerId,
      playFingerNote,
      playErrorSound,
      progressService,
    ]
  );

  // Get mnemonic for this finger
  const mnemonic = useMemo(() => getMnemonic(fingerId), [fingerId]);

  // Render introduction phase
  const renderIntro = () => (
    <div className="finger-lesson__intro">
      <div className="finger-lesson__finger-display">
        <div
          className="finger-lesson__finger-circle"
          style={{ backgroundColor: fingerColor }}
        >
          <span className="finger-lesson__finger-icon">
            {fingerId.startsWith('l_') ? '🤚' : '✋'}
          </span>
        </div>
        <h2 className="finger-lesson__finger-name">{fingerName}</h2>
      </div>

      {/* Mnemonic */}
      {mnemonic.highlightedChars.length > 0 && (
        <div className="finger-lesson__mnemonic">
          <span className="finger-lesson__mnemonic-phrase">
            "{mnemonic.phrase}"
          </span>
          <span className="finger-lesson__mnemonic-explanation">
            {mnemonic.explanation}
          </span>
        </div>
      )}

      <p className="finger-lesson__description">
        This finger produces {characters.length} character{characters.length !== 1 ? 's' : ''}:
      </p>

      <div className="finger-lesson__char-grid">
        {characters.map((charInfo) => (
          <div key={charInfo.char} className="finger-lesson__char-card">
            <span
              className="finger-lesson__char"
              style={{ color: charInfo.color }}
            >
              {charInfo.char.toUpperCase()}
            </span>
            <span className="finger-lesson__direction">
              {getDirectionSymbol(charInfo.direction)}
            </span>
          </div>
        ))}
      </div>

      <button
        className="finger-lesson__start-btn"
        onClick={() => {
          setPhase('guided');
          // Focus will happen via useEffect when phase changes
          setTimeout(() => containerRef.current?.focus(), 0);
        }}
      >
        Start Practice
      </button>
    </div>
  );

  // Render practice/quiz phase
  const renderPractice = () => {
    const isQuiz = phase === 'quiz';
    const requiredCorrect = isQuiz ? REQUIRED_CORRECT_QUIZ : REQUIRED_CORRECT_GUIDED;

    return (
      <div className={`finger-lesson__practice ${feedback ?? ''}`}>
        <div className="finger-lesson__phase-header">
          <span className="finger-lesson__phase-label">
            {isQuiz ? 'Quiz' : 'Guided Practice'}
          </span>
          <span className="finger-lesson__progress-text">
            Character {currentCharIndex + 1} of {characters.length}
          </span>
        </div>

        <div className="finger-lesson__prompt">
          <span className="finger-lesson__prompt-label">Press:</span>
          <span
            className="finger-lesson__target-char"
            style={{ color: currentChar.color }}
          >
            {currentChar.char.toUpperCase()}
          </span>
        </div>

        {/* Hint (shown in guided mode or after error) */}
        {showHint && !isQuiz && (
          <div className="finger-lesson__hint">
            <span className="finger-lesson__hint-direction">
              {getDirectionSymbol(currentChar.direction)}
            </span>
            <span className="finger-lesson__hint-text">
              Move {fingerName} {currentChar.direction.toLowerCase()}
            </span>
          </div>
        )}

        {/* Progress dots */}
        <div className="finger-lesson__progress-dots">
          {Array.from({ length: requiredCorrect }).map((_, i) => (
            <div
              key={i}
              className={`finger-lesson__dot ${i < correctCount ? 'filled' : ''}`}
              style={{
                backgroundColor: i < correctCount ? currentChar.color : undefined,
              }}
            />
          ))}
        </div>

        {/* Feedback */}
        {feedback === 'correct' && (
          <div className="finger-lesson__feedback finger-lesson__feedback--correct">
            Correct!
          </div>
        )}
        {feedback === 'incorrect' && (
          <div className="finger-lesson__feedback finger-lesson__feedback--incorrect">
            Try again
          </div>
        )}
      </div>
    );
  };

  // Render complete phase
  const renderComplete = () => (
    <div className="finger-lesson__complete">
      <div className="finger-lesson__success-icon">
        <span
          className="finger-lesson__check"
          style={{ color: fingerColor }}
        >
          ✓
        </span>
      </div>
      <h2 className="finger-lesson__complete-title">
        {fingerName} Learned!
      </h2>
      <p className="finger-lesson__complete-text">
        You've practiced all {characters.length} characters for this finger.
      </p>
      <div className="finger-lesson__learned-chars">
        {characters.map((charInfo) => (
          <span
            key={charInfo.char}
            className="finger-lesson__learned-char"
            style={{ color: charInfo.color }}
          >
            {charInfo.char.toUpperCase()}
          </span>
        ))}
      </div>
      <button
        className="finger-lesson__continue-btn"
        onClick={onComplete}
      >
        Continue
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="finger-lesson"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none' }}
    >
      {/* Header */}
      <div className="finger-lesson__header">
        {onBack && (
          <button className="finger-lesson__back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <div
          className="finger-lesson__finger-badge"
          style={{ backgroundColor: fingerColor }}
        >
          {fingerName}
        </div>
      </div>

      {/* Content */}
      <div className="finger-lesson__content">
        {phase === 'intro' && renderIntro()}
        {(phase === 'guided' || phase === 'quiz') && renderPractice()}
        {phase === 'complete' && renderComplete()}
      </div>
    </div>
  );
}

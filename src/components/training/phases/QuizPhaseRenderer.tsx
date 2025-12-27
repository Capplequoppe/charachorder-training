/**
 * QuizPhaseRenderer Component
 *
 * Shared quiz phase display for all training types.
 * Shows score, the item to identify, and feedback.
 *
 * @module components/training/phases
 */

import React from 'react';
import type { TrainableItem } from '../../../domain';
import { Finger } from '../../../domain';
import type { FeedbackState } from '../../../hooks';

/**
 * Layout variant for the quiz phase.
 */
export type QuizLayout = 'single-hand' | 'two-hands' | 'word';

/**
 * Props for QuizPhaseRenderer component.
 */
export interface QuizPhaseRendererProps {
  /** The trainable item being quizzed */
  item: TrainableItem;
  /** Title to display */
  title?: string;
  /** Layout variant */
  layout: QuizLayout;
  /** Number of correct answers so far */
  correctCount: number;
  /** Total number of items answered so far */
  totalAnswered: number;
  /** Current feedback state */
  feedback: FeedbackState;
  /** Ref for the hidden input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Current text input value */
  textInput: string;
  /** Handler for text input changes */
  onTextInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether to reverse display order (for randomization) */
  reverseDisplayOrder?: boolean;
  /** Callback to focus the input (called on container click) */
  onFocusInput?: () => void;
  /** Hide letters/hint until incorrect answer (for word quiz mode) */
  hideLettersUntilIncorrect?: boolean;
  /** Force showing letters (overrides hideLettersUntilIncorrect) */
  forceShowLetters?: boolean;
}

/**
 * QuizPhaseRenderer displays the quiz UI for a trainable item.
 */
export function QuizPhaseRenderer({
  item,
  title = 'Quick Quiz',
  layout,
  correctCount,
  totalAnswered,
  feedback,
  inputRef,
  textInput,
  onTextInputChange,
  reverseDisplayOrder = false,
  onFocusInput,
  hideLettersUntilIncorrect = false,
  forceShowLetters = false,
}: QuizPhaseRendererProps): React.ReactElement {
  // Determine if letters should be shown
  // When hideLettersUntilIncorrect is true, only show after incorrect feedback or when forced
  const showLetters = !hideLettersUntilIncorrect || feedback === 'incorrect' || forceShowLetters;
  // For two-hands layout, separate left and right characters
  const leftChar = layout === 'two-hands'
    ? item.displayChars.find(c => Finger.isLeftHandId(c.fingerId))
    : null;
  const rightChar = layout === 'two-hands'
    ? item.displayChars.find(c => !Finger.isLeftHandId(c.fingerId))
    : null;

  // Handle display order reversal for randomization
  const displayChars = reverseDisplayOrder
    ? [...item.displayChars].reverse()
    : item.displayChars;

  // For two-hands with reversed order
  const displayLeftChar = reverseDisplayOrder ? rightChar : leftChar;
  const displayRightChar = reverseDisplayOrder ? leftChar : rightChar;

  // Handle container click to re-focus input
  const handleContainerClick = () => {
    onFocusInput?.();
  };

  return (
    <div
      className={`training-phase quiz-phase ${layout} ${feedback ?? ''}`}
      onClick={handleContainerClick}
    >
      <h2>{title}</h2>

      {/* Score display */}
      <div className="quiz-progress">
        <span className="quiz-score">
          {correctCount} / {totalAnswered} correct
        </span>
      </div>

      {/* Word display for word layout */}
      {layout === 'word' && item.displayName && (
        <h1 className="word-display" style={{ color: item.blendedColor }}>
          {item.displayName}
        </h1>
      )}

      {/* Character display - hidden for word quiz until incorrect */}
      {showLetters && (
        <>
          {layout === 'two-hands' && displayLeftChar && displayRightChar ? (
            <div className="power-chord-display">
              <div className="hand-side left">
                <span className="hand-label">Left Hand</span>
                <span
                  className="character large"
                  style={{ color: displayLeftChar.color }}
                >
                  {displayLeftChar.displayChar}
                </span>
              </div>

              <span className="plus">+</span>

              <div className="hand-side right">
                <span className="hand-label">Right Hand</span>
                <span
                  className="character large"
                  style={{ color: displayRightChar.color }}
                >
                  {displayRightChar.displayChar}
                </span>
              </div>
            </div>
          ) : (
            <div className="power-chord-display">
              {displayChars.map((char, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="plus">+</span>}
                  <span className="character large" style={{ color: char.color }}>
                    {char.displayChar}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </>
      )}

      {/* Hidden text input for CharaChorder chord detection */}
      <input
        ref={inputRef}
        type="text"
        value={textInput}
        onChange={onTextInputChange}
        className="chord-input chord-input--hidden"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-hidden="true"
      />

      {/* Feedback display */}
      {feedback === 'correct' && (
        <div className="feedback correct">Correct!</div>
      )}
      {feedback === 'incorrect' && (
        <div className="feedback incorrect">Wrong</div>
      )}

      {/* Hint - hidden for word quiz until incorrect */}
      {showLetters && (
        <p className="hint">
          Press{' '}
          {displayChars.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && ' and '}
              <strong>{c.displayChar}</strong>
            </React.Fragment>
          ))}{' '}
          together
        </p>
      )}
    </div>
  );
}

export default QuizPhaseRenderer;

/**
 * PracticePhaseRenderer Component
 *
 * Shared practice phase display for all training types.
 * Shows progress dots, feedback, and the hidden input for CharaChorder.
 *
 * @module components/training/phases
 */

import React from 'react';
import type { TrainableItem, FingerId } from '../../../../domain';
import { Finger, SUCCESSES_REQUIRED_FOR_COMPLETION } from '../../../../domain';
import { ColoredFinger } from '../../../ui/atoms/ColoredFinger';
import type { FeedbackState } from '../../../../hooks';

/**
 * Layout variant for the practice phase.
 */
export type PracticeLayout = 'single-hand' | 'two-hands' | 'word';

/**
 * Props for PracticePhaseRenderer component.
 */
export interface PracticePhaseRendererProps {
  /** The trainable item being practiced */
  item: TrainableItem;
  /** Title to display */
  title: string;
  /** Layout variant */
  layout: PracticeLayout;
  /** Number of successful attempts so far */
  successCount: number;
  /** Number of successes required for completion */
  successesRequired?: number;
  /** Current feedback state */
  feedback: FeedbackState;
  /** Ref for the hidden input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Current text input value */
  textInput: string;
  /** Handler for text input changes */
  onTextInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether to show finger indicators */
  showFingerIndicators?: boolean;
  /** Whether to show CharaChorder hint */
  showChordHint?: boolean;
  /** First word this chord produces (for hint) */
  firstProducesWord?: string;
  /** Callback to focus the input (called on container click) */
  onFocusInput?: () => void;
}

/**
 * PracticePhaseRenderer displays the practice UI for a trainable item.
 */
export function PracticePhaseRenderer({
  item,
  title,
  layout,
  successCount,
  successesRequired = SUCCESSES_REQUIRED_FOR_COMPLETION,
  feedback,
  inputRef,
  textInput,
  onTextInputChange,
  showFingerIndicators = false,
  showChordHint = false,
  firstProducesWord,
  onFocusInput,
}: PracticePhaseRendererProps): React.ReactElement {
  // For two-hands layout, separate left and right characters
  const leftChar = layout === 'two-hands'
    ? item.displayChars.find(c => Finger.isLeftHandId(c.fingerId))
    : null;
  const rightChar = layout === 'two-hands'
    ? item.displayChars.find(c => !Finger.isLeftHandId(c.fingerId))
    : null;

  // Handle container click to re-focus input
  const handleContainerClick = () => {
    onFocusInput?.();
  };

  return (
    <div
      className={`training-phase practice-phase ${layout} ${feedback ?? ''}`}
      onClick={handleContainerClick}
    >
      <h2>{title}</h2>

      {/* Word display for word layout */}
      {layout === 'word' && item.displayName && (
        <h1 className="word-display" style={{ color: item.blendedColor }}>
          {item.displayName}
        </h1>
      )}

      {/* Character display */}
      {layout === 'two-hands' && leftChar && rightChar ? (
        <div className="power-chord-display">
          <span className="character large" style={{ color: leftChar.color }}>
            {leftChar.displayChar}
          </span>
          <span className="plus">+</span>
          <span className="character large" style={{ color: rightChar.color }}>
            {rightChar.displayChar}
          </span>
        </div>
      ) : (
        <div className="power-chord-display">
          {item.displayChars.map((char, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="plus">+</span>}
              <span className="character large" style={{ color: char.color }}>
                {char.displayChar}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Finger indicators (optional) */}
      {showFingerIndicators && (
        <div className="finger-indicators">
          {item.fingerIds.map((fingerId, idx) => (
            <ColoredFinger
              key={idx}
              fingerId={fingerId}
              isActive
              size="medium"
              showLabel
            />
          ))}
        </div>
      )}

      {/* Progress indicator */}
      <div className="progress-indicator">
        <div className="progress-dots">
          {Array.from({ length: successesRequired }).map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i < successCount ? 'filled' : ''}`}
              style={{
                backgroundColor: i < successCount ? item.blendedColor : undefined,
              }}
            />
          ))}
        </div>
        <p className="progress-text">
          {successCount} / {successesRequired} successful
        </p>
      </div>

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
        <div className="feedback incorrect">Try again</div>
      )}

      {/* Hint */}
      <p className="hint">
        Press{' '}
        {item.displayChars.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && ' and '}
            <strong>{c.displayChar}</strong>
          </React.Fragment>
        ))}{' '}
        at the same time
      </p>

      {/* CharaChorder hint */}
      {showChordHint && firstProducesWord && (
        <p className="hint secondary">
          CharaChorder users: chord outputs like "{firstProducesWord}" also count!
        </p>
      )}
    </div>
  );
}

export default PracticePhaseRenderer;

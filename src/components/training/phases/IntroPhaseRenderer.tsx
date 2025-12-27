/**
 * IntroPhaseRenderer Component
 *
 * Shared intro phase display for all training types.
 * Shows the item being introduced with characters, fingers, and actions.
 *
 * @module components/training/phases
 */

import React, { useEffect } from 'react';
import type { TrainableItem, FingerId } from '../../../domain';
import { Finger } from '../../../domain';
import { ColoredFinger } from '../../common/ColoredFinger';

/**
 * Layout variant for the intro phase.
 */
export type IntroLayout = 'single-hand' | 'two-hands' | 'word';

/**
 * Props for IntroPhaseRenderer component.
 */
export interface IntroPhaseRendererProps {
  /** The trainable item to introduce */
  item: TrainableItem;
  /** Title to display (e.g., "New Power Chord", "Cross-Hand Power Chord") */
  title: string;
  /** Layout variant */
  layout: IntroLayout;
  /** Words this chord produces (for power chords) */
  producesWords?: readonly string[];
  /** Word rank (for word chords) */
  wordRank?: number;
  /** Word category info */
  categoryInfo?: {
    displayName: string;
    color: string;
    icon: string;
  };
  /** Callback to play the chord/word sound */
  onPlaySound: () => void;
  /** Callback to continue to practice/sync */
  onContinue: () => void;
  /** Label for the continue button */
  continueButtonLabel?: string;
  /** Callback to go back (optional) */
  onBack?: () => void;
  /** Custom content to render (e.g., LegoVisualization for words) */
  customContent?: React.ReactNode;
}

/**
 * IntroPhaseRenderer displays the introduction UI for a trainable item.
 */
export function IntroPhaseRenderer({
  item,
  title,
  layout,
  producesWords,
  wordRank,
  categoryInfo,
  onPlaySound,
  onContinue,
  continueButtonLabel = 'Practice',
  onBack,
  customContent,
}: IntroPhaseRendererProps): React.ReactElement {
  // For two-hands layout, separate left and right characters
  const leftChar = layout === 'two-hands'
    ? item.displayChars.find(c => Finger.isLeftHandId(c.fingerId))
    : null;
  const rightChar = layout === 'two-hands'
    ? item.displayChars.find(c => !Finger.isLeftHandId(c.fingerId))
    : null;

  // Find corresponding finger IDs
  const leftFingerId = layout === 'two-hands'
    ? item.fingerIds.find(f => Finger.isLeftHandId(f))
    : null;
  const rightFingerId = layout === 'two-hands'
    ? item.fingerIds.find(f => !Finger.isLeftHandId(f))
    : null;

  // Handle Enter key to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  return (
    <div className={`training-phase intro-phase ${layout}`}>
      {onBack && (
        <button className="back-to-select" onClick={onBack}>
          ← Back to Mode Selection
        </button>
      )}

      <h2>{title}</h2>

      {/* Word display for word layout */}
      {layout === 'word' && item.displayName && (
        <h1 className="word-display" style={{ color: item.blendedColor }}>
          {item.displayName}
        </h1>
      )}

      {/* Word rank badge */}
      {wordRank && (
        <div className="rank-badge">#{wordRank} most common word</div>
      )}

      {/* Category badge for words */}
      {categoryInfo && (
        <div
          className="word-category-badge"
          style={{ backgroundColor: categoryInfo.color }}
        >
          {categoryInfo.icon} {categoryInfo.displayName}
        </div>
      )}

      {/* Character display */}
      {layout === 'two-hands' && leftChar && rightChar ? (
        <div className="power-chord-display">
          <div className="hand-side left">
            <span className="hand-label">Left Hand</span>
            <span
              className="character large"
              style={{ color: leftChar.color }}
            >
              {leftChar.displayChar}
            </span>
            {leftFingerId && (
              <ColoredFinger fingerId={leftFingerId} isActive size="large" showLabel />
            )}
          </div>

          <span className="plus">+</span>

          <div className="hand-side right">
            <span className="hand-label">Right Hand</span>
            <span
              className="character large"
              style={{ color: rightChar.color }}
            >
              {rightChar.displayChar}
            </span>
            {rightFingerId && (
              <ColoredFinger fingerId={rightFingerId} isActive size="large" showLabel />
            )}
          </div>
        </div>
      ) : (
        <div className="power-chord-display">
          {item.displayChars.map((char, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="plus">+</span>}
              <div className="character-display">
                <span className="character large" style={{ color: char.color }}>
                  {char.displayChar}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Blended color preview */}
      <div
        className="blended-preview"
        style={{ backgroundColor: item.blendedColor }}
      />

      {/* Finger indicators (for non-two-hands layouts) */}
      {layout !== 'two-hands' && (
        <div className="finger-indicators">
          {item.fingerIds.map((fingerId, idx) => (
            <ColoredFinger
              key={idx}
              fingerId={fingerId}
              isActive
              size="large"
              showLabel
            />
          ))}
        </div>
      )}

      {/* Produces words list */}
      {producesWords && producesWords.length > 0 && (
        <div className="produces-words">
          <p>Appears in words:</p>
          <ul>
            {producesWords.slice(0, 5).map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom content (e.g., LegoVisualization) */}
      {customContent}

      {/* Action buttons */}
      <div className="action-buttons">
        <button className="btn secondary" onClick={onPlaySound}>
          Play Sound
        </button>
        <button className="btn primary" onClick={onContinue}>
          {continueButtonLabel}
        </button>
      </div>
    </div>
  );
}

export default IntroPhaseRenderer;

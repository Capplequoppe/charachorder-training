/**
 * Continue Button Component
 *
 * A prominent call-to-action button allowing users to manually advance
 * to the next chapter when they feel ready.
 */

import React, { useEffect } from 'react';
import './ContinueButton.css';

interface ContinueButtonProps {
  /** Callback when button is clicked */
  onContinue: () => void;
  /** Optional message shown above the button */
  message?: string;
  /** Button text */
  buttonText?: string;
  /** Whether this is the final chapter */
  isFinalChapter?: boolean;
  /** Features that will unlock (for display) */
  unlocksFeatures?: string[];
}

export function ContinueButton({
  onContinue,
  message = 'Ready to continue?',
  buttonText = 'Continue to Next Chapter',
  isFinalChapter = false,
  unlocksFeatures,
}: ContinueButtonProps) {
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
    <div className="continue-button-container">
      <p className="continue-button-message">{message}</p>

      <button
        className={`continue-button ${isFinalChapter ? 'continue-button--final' : ''}`}
        onClick={onContinue}
      >
        <span className="continue-button-text">
          {isFinalChapter ? '🎉 ' : ''}
          {buttonText}
          {!isFinalChapter && ' →'}
        </span>
      </button>

      {unlocksFeatures && unlocksFeatures.length > 0 && (
        <p className="continue-button-unlocks">
          Unlocks: {unlocksFeatures.join(', ')}
        </p>
      )}
    </div>
  );
}

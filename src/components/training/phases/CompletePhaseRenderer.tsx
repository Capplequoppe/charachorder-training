/**
 * CompletePhaseRenderer Component
 *
 * Shared completion phase display for all training types.
 * Shows results summary and action buttons.
 *
 * @module components/training/phases
 */

import React, { useEffect, useCallback } from 'react';
import { ContinueButton } from '../../campaign/ContinueButton';

/**
 * Result item for display.
 */
export interface ResultItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

/**
 * Action button configuration.
 */
export interface ActionButton {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}

/**
 * Props for CompletePhaseRenderer component.
 */
export interface CompletePhaseRendererProps {
  /** Title to display (e.g., "Training Complete!", "Quiz Complete!") */
  title: string;
  /** Whether this was a quiz mode completion */
  isQuizMode: boolean;
  /** Result items to display */
  results: ResultItem[];
  /** Action buttons to show */
  actions: ActionButton[];
  /** Words/items mastered (optional, for practice mode) */
  itemsMastered?: string[];
  /** Campaign continue button config (optional) */
  campaignContinue?: {
    message: string;
    buttonText: string;
    onContinue: () => void;
  };
  /** Continue learning more config (optional, for learn mode with remaining items) */
  continueLearnMore?: {
    itemsRemaining: number;
    onContinue: () => void;
  };
  /** Custom content to render (e.g., chapter progress) */
  customContent?: React.ReactNode;
}

/**
 * CompletePhaseRenderer displays the completion UI with results and actions.
 */
export function CompletePhaseRenderer({
  title,
  isQuizMode,
  results,
  actions,
  itemsMastered,
  campaignContinue,
  continueLearnMore,
  customContent,
}: CompletePhaseRendererProps): React.ReactElement {
  // Handle Enter key press to continue learning more
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && continueLearnMore) {
        e.preventDefault();
        continueLearnMore.onContinue();
      }
    },
    [continueLearnMore]
  );

  useEffect(() => {
    if (continueLearnMore) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [continueLearnMore, handleKeyDown]);

  return (
    <div className="training-phase complete-phase">
      <h2>{title}</h2>

      {/* Results summary */}
      <div className="results-summary">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`result-item ${result.highlight ? 'highlight' : ''}`}
          >
            <span className="label">{result.label}</span>
            <span className="value">{result.value}</span>
          </div>
        ))}
      </div>

      {/* Items mastered list (practice mode) */}
      {!isQuizMode && itemsMastered && itemsMastered.length > 0 && (
        <div className="words-learned">
          <p>You mastered:</p>
          <div className="word-list">
            {itemsMastered.map((item) => (
              <span key={item} className="learned-word">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom content (e.g., chapter progress) */}
      {customContent}

      {/* Action buttons */}
      <div className="complete-actions">
        {actions.map((action, idx) => (
          <button
            key={idx}
            className={`btn ${action.variant}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Continue learning more button */}
      {continueLearnMore && (
        <div className="continue-learn-more">
          <p className="continue-learn-more-message">
            {continueLearnMore.itemsRemaining} more item{continueLearnMore.itemsRemaining !== 1 ? 's' : ''} available to learn
          </p>
          <button
            className="btn primary continue-learn-more-btn"
            onClick={continueLearnMore.onContinue}
          >
            Continue Learning More
          </button>
          <p className="continue-learn-more-hint">Press Enter to continue</p>
        </div>
      )}

      {/* Campaign continue button */}
      {campaignContinue && (
        <ContinueButton
          onContinue={campaignContinue.onContinue}
          message={campaignContinue.message}
          buttonText={campaignContinue.buttonText}
        />
      )}
    </div>
  );
}

/**
 * Helper to create quiz mode results.
 */
export function createQuizResults(
  correctCount: number,
  totalCount: number
): ResultItem[] {
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  return [
    {
      label: 'Correct',
      value: `${correctCount} / ${totalCount}`,
    },
    {
      label: 'Accuracy',
      value: `${Math.round(accuracy * 100)}%`,
    },
  ];
}

/**
 * Helper to create practice mode results.
 */
export function createPracticeResults(
  itemsCompleted: number,
  accuracy: number,
  additionalStats?: { label: string; value: string | number; highlight?: boolean }[]
): ResultItem[] {
  const results: ResultItem[] = [
    {
      label: 'Items Mastered',
      value: itemsCompleted,
    },
    {
      label: 'Accuracy',
      value: `${Math.round(accuracy * 100)}%`,
    },
  ];

  if (additionalStats) {
    results.push(...additionalStats);
  }

  return results;
}

export default CompletePhaseRenderer;

/**
 * Training Mode Selector Component
 *
 * Shared component for selecting training modes across all chapter types.
 * Displays mastery progress and available training options.
 */

import React from 'react';
import { ChapterMasteryProgress } from '../../campaign';
import './training.css';

/**
 * Formats a future date as a relative time string (e.g., "5 minutes", "2 hours", "3 days")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return 'now';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour' : `${diffHours} hours`;
  }
  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
  }
  return 'less than a minute';
}

export type TrainingMode =
  | 'learn'      // Learn new items (unmastered)
  | 'review-due' // Review items due for spaced repetition
  | 'review-all' // Review all learned items
  | 'boss'       // Boss challenge
  | 'survival'   // Survival mode (mastered items only)
  | 'journey';   // View learning progress journey

export interface TrainingModeSelectorProps {
  /** Title for the training section */
  title: string;
  /** Mastery progress data */
  progress: ChapterMasteryProgress;
  /** Whether boss has been defeated */
  bossDefeated: boolean;
  /** Best boss score (percentage) */
  bossBestScore: number;
  /** Target score for boss (percentage) */
  bossTargetScore: number;
  /** Callback when a mode is selected */
  onSelectMode: (mode: TrainingMode) => void;
  /** Optional back button callback */
  onBack?: () => void;
  /** Whether this is in campaign mode (shows completion requirements) */
  inCampaignMode?: boolean;
}

export function TrainingModeSelector({
  title,
  progress,
  bossDefeated,
  bossBestScore,
  bossTargetScore,
  onSelectMode,
  onBack,
  inCampaignMode = false,
}: TrainingModeSelectorProps): React.ReactElement {
  const { itemsMastered, itemsFamiliar, totalItems, itemsLearned, itemsDueForReview, nextReviewDate, itemsReadyForBoss } = progress;
  const masteryPercent = totalItems > 0 ? Math.round((itemsMastered / totalItems) * 100) : 0;
  const bossReadyPercent = totalItems > 0 ? Math.round((itemsReadyForBoss / totalItems) * 100) : 0;
  const allMastered = itemsMastered === totalItems;
  const hasUnlearned = itemsLearned < totalItems;
  const hasDueItems = itemsDueForReview > 0;
  const hasScheduledReview = nextReviewDate !== null;

  // Boss unlock criteria: 80% of items have >=80% accuracy AND <=4000ms avg response time
  const canChallengeBoss = totalItems > 0 && (itemsReadyForBoss / totalItems) >= 0.80;

  // Determine if chapter is ready for completion (boss defeated is enough)
  const readyForCompletion = bossDefeated;

  return (
    <div className="training-mode-selector">
      <h2>{title}</h2>

      {/* Mastery Progress */}
      <div className="mastery-progress-section">
        <div className="mastery-progress-header">
          <span className="mastery-label">Mastery Progress</span>
          <span className="mastery-value">{itemsMastered} / {totalItems}</span>
        </div>
        <div className="mastery-progress-bar">
          <div
            className="mastery-progress-fill"
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
        <div className="mastery-stats">
          <span className="mastery-stat">
            <span className="stat-num">{itemsLearned}</span> practiced
          </span>
          <span className="mastery-stat">
            <span className="stat-num">{itemsDueForReview}</span> due for review
          </span>
        </div>
      </div>

      {/* Campaign Completion Status */}
      {inCampaignMode && (
        <div className={`completion-status ${readyForCompletion ? 'complete' : ''}`}>
          <div className="completion-req">
            <span className={`req-check ${bossDefeated ? 'done' : ''}`}>
              {bossDefeated ? '✓' : '○'}
            </span>
            <span className="req-text">Boss defeated (required to progress)</span>
            {bossBestScore > 0 && (
              <span className="req-score">(Best: {bossBestScore}%)</span>
            )}
          </div>
          <div className="completion-req optional">
            <span className={`req-check ${allMastered ? 'done' : ''}`}>
              {allMastered ? '✓' : '○'}
            </span>
            <span className="req-text">All items mastered (optional)</span>
          </div>
        </div>
      )}

      {/* Training Mode Options */}
      <div className="training-mode-options">
        {/* Learn More - only if there are unmastered items */}
        {hasUnlearned && (
          <button
            className="mode-option learn"
            onClick={() => onSelectMode('learn')}
          >
            <span className="mode-icon">📚</span>
            <span className="mode-title">Learn More</span>
            <span className="mode-desc">
              {totalItems - itemsMastered} items to learn
            </span>
          </button>
        )}

        {/* Review Due - show items due, or next review time if none due */}
        {(hasDueItems || hasScheduledReview) && (
          <button
            className={`mode-option review-due ${!hasDueItems ? 'scheduled' : ''}`}
            onClick={() => hasDueItems && onSelectMode('review-due')}
            disabled={!hasDueItems}
          >
            <span className="mode-icon">🔄</span>
            <span className="mode-title">Review (Due)</span>
            <span className="mode-desc">
              {hasDueItems
                ? `${itemsDueForReview} items due for review`
                : `Next review in ${formatRelativeTime(nextReviewDate!)}`
              }
            </span>
          </button>
        )}

        {/* Review All - only if there are learned items */}
        {itemsLearned > 0 && (
          <button
            className="mode-option review-all"
            onClick={() => onSelectMode('review-all')}
          >
            <span className="mode-icon">📝</span>
            <span className="mode-title">Review All</span>
            <span className="mode-desc">
              Practice all {itemsLearned} learned items
            </span>
          </button>
        )}

        {/* Boss Challenge - requires 75% mastered + rest familiar */}
        <button
          className={`mode-option boss ${!canChallengeBoss ? 'locked' : ''} ${bossDefeated ? 'defeated' : ''}`}
          onClick={() => canChallengeBoss && onSelectMode('boss')}
          disabled={!canChallengeBoss}
        >
          <span className="mode-icon">{bossDefeated ? '🏆' : '👑'}</span>
          <span className="mode-title">Challenge Boss</span>
          <span className="mode-desc">
            {!canChallengeBoss
              ? `Need 80% ready (${bossReadyPercent}% ready)`
              : bossDefeated
                ? `Defeated! (${bossBestScore}%)`
                : `Score ${bossTargetScore}% to pass`
            }
          </span>
        </button>

        {/* Survival Mode - only if there are mastered items */}
        {itemsMastered > 0 && (
          <button
            className="mode-option survival"
            onClick={() => onSelectMode('survival')}
          >
            <span className="mode-icon">⚔️</span>
            <span className="mode-title">Survival Mode</span>
            <span className="mode-desc">
              Endless challenge with {itemsMastered} mastered items
            </span>
          </button>
        )}

        {/* Journey - View learning progress */}
        {itemsLearned > 0 && (
          <button
            className="mode-option journey"
            onClick={() => onSelectMode('journey')}
          >
            <span className="mode-icon">🗺️</span>
            <span className="mode-title">Your Journey</span>
            <span className="mode-desc">
              View progress for all {itemsLearned} learned items
            </span>
          </button>
        )}
      </div>

      {/* Back button */}
      {onBack && (
        <button className="btn secondary back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      {/* Completion message */}
      {inCampaignMode && readyForCompletion && (
        <div className="completion-message">
          Chapter complete! You can move to the next chapter.
        </div>
      )}
    </div>
  );
}

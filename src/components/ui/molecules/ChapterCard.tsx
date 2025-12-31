/**
 * Chapter Card Component
 *
 * Visual representation of a single chapter in the campaign roadmap.
 * Shows chapter metadata and current state (locked, available, active, completed).
 */

import React from 'react';
import type { ChapterDefinition, ChapterStatus } from '../../../campaign';
import './ChapterCard.css';

interface ChapterCardProps {
  /** Chapter definition with metadata */
  chapter: ChapterDefinition;
  /** Current status of the chapter */
  status: ChapterStatus;
  /** Whether this chapter is currently active/selected */
  isActive: boolean;
  /** Callback when chapter is clicked */
  onClick: () => void;
  /** Optional progress info */
  progress?: {
    current: number;
    total: number;
  };
}

/**
 * Determines the visual state of the chapter card.
 */
type ChapterState = 'locked' | 'available' | 'active' | 'completed';

function getChapterState(
  status: ChapterStatus,
  isActive: boolean
): ChapterState {
  if (!status.isUnlocked) return 'locked';
  if (status.isCompleted) return 'completed';
  if (isActive) return 'active';
  return 'available';
}

export function ChapterCard({
  chapter,
  status,
  isActive,
  onClick,
  progress,
}: ChapterCardProps) {
  const state = getChapterState(status, isActive);
  const isClickable = status.isUnlocked;

  return (
    <button
      className={`chapter-card chapter-card--${state}`}
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      aria-label={`${chapter.title} - ${state}`}
      aria-current={isActive ? 'step' : undefined}
    >
      <div className="chapter-card__header">
        <span className="chapter-card__number">{chapter.number}</span>
        <span className="chapter-card__icon">
          {state === 'locked' ? '🔒' : chapter.icon}
        </span>
      </div>

      <h3 className="chapter-card__title">{chapter.title}</h3>
      <p className="chapter-card__subtitle">{chapter.subtitle}</p>

      {/* Progress indicator for unlocked chapters */}
      {status.isUnlocked && progress && (
        <div className="chapter-card__progress">
          <div className="chapter-card__progress-bar">
            <div
              className="chapter-card__progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <span className="chapter-card__progress-text">
            {progress.current}/{progress.total}
          </span>
        </div>
      )}

      {/* Completion badge */}
      {status.isCompleted && (
        <div className="chapter-card__badge chapter-card__badge--complete">
          ✓
        </div>
      )}

      {/* Active indicator */}
      {isActive && !status.isCompleted && (
        <div className="chapter-card__badge chapter-card__badge--active">
          ▶
        </div>
      )}
    </button>
  );
}

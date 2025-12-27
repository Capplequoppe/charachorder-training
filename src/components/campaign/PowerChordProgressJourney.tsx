/**
 * Power Chord Progress Journey Component
 *
 * Displays all learned power chords in a visual grid with mastery progress.
 * Similar to ProgressJourney but for power chords (left-hand, right-hand, cross-hand).
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  PowerChordHand,
  MasteryLevel,
  MASTERY_WINDOW_SIZE,
  RESPONSE_TIME_WINDOW_SIZE,
  FAMILIAR_ACCURACY_THRESHOLD,
  MASTERED_ACCURACY_THRESHOLD,
  MASTERED_RESPONSE_TIME_THRESHOLD,
  AttemptRecord,
} from '../../domain';
import { getRepositories } from '../../data';
import { getServiceRepositories } from '../../services';
import './ProgressJourney.css';

interface PowerChordProgressItem {
  id: string;
  displayChars: string;
  char1: string;
  char2: string;
  char1Color: string;
  char2Color: string;
  blendedColor: string;
  producesWords: readonly string[];
  masteryLevel: MasteryLevel;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  recentAccuracy: number;
  recentResponseTime: number;
  isLearned: boolean;
  progressToNext: number;
  progressToNextLabel: string;
  // Next review date for SRS
  nextReviewDate: Date | null;
  isDue: boolean;
}

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
    return diffMinutes === 1 ? '1 min' : `${diffMinutes} min`;
  }
  return '< 1 min';
}

export interface PowerChordProgressJourneyProps {
  /** Which hand type to show (left, right, cross) */
  hand: PowerChordHand;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Title for the journey view */
  title?: string;
}

export function PowerChordProgressJourney({
  hand,
  onBack,
  title,
}: PowerChordProgressJourneyProps): React.ReactElement {
  const { progress } = getServiceRepositories();
  const { powerChords: powerChordRepo } = getRepositories();

  // Refresh counter to force re-render after demoting
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Handle demoting a mastered item
  const handleDemote = useCallback((chordId: string) => {
    const chordProgress = progress.getProgress(chordId, 'powerChord');
    if (chordProgress && chordProgress.masteryLevel === MasteryLevel.MASTERED) {
      chordProgress.demote();
      progress.updateProgress(chordProgress);
      setRefreshCounter((c) => c + 1);
    }
  }, [progress]);

  // Helper to calculate recent stats from attempt records
  const calculateRecentStats = (recentAttempts: AttemptRecord[] | undefined) => {
    if (!recentAttempts || recentAttempts.length === 0) {
      return { recentAccuracy: 0, recentResponseTime: 0 };
    }

    // Accuracy from full window
    const correctCount = recentAttempts.filter(a => a.correct).length;
    const recentAccuracy = correctCount / recentAttempts.length;

    // Response time from last RESPONSE_TIME_WINDOW_SIZE attempts
    const responseTimeAttempts = recentAttempts.slice(-RESPONSE_TIME_WINDOW_SIZE);
    const recentResponseTime = responseTimeAttempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / responseTimeAttempts.length;

    return { recentAccuracy, recentResponseTime };
  };

  // Calculate progress towards next mastery level
  const calculateProgressToNext = (
    masteryLevel: MasteryLevel,
    recentAccuracy: number,
    recentResponseTime: number,
    attemptCount: number
  ): { progress: number; label: string } => {
    switch (masteryLevel) {
      case MasteryLevel.NEW:
        return { progress: 0, label: 'Not started' };

      case MasteryLevel.LEARNING: {
        const accuracyProgress = Math.min(100, (recentAccuracy / FAMILIAR_ACCURACY_THRESHOLD) * 100);
        const attemptsProgress = Math.min(100, (attemptCount / MASTERY_WINDOW_SIZE) * 100);
        const combinedProgress = Math.min(accuracyProgress, attemptsProgress);

        if (attemptCount < MASTERY_WINDOW_SIZE) {
          return {
            progress: combinedProgress,
            label: `${attemptCount}/${MASTERY_WINDOW_SIZE} attempts`,
          };
        }
        return {
          progress: combinedProgress,
          label: `${Math.round(recentAccuracy * 100)}% acc (need ${Math.round(FAMILIAR_ACCURACY_THRESHOLD * 100)}%)`,
        };
      }

      case MasteryLevel.FAMILIAR: {
        const needsMoreAttempts = attemptCount < MASTERY_WINDOW_SIZE;
        const needsAccuracy = recentAccuracy < MASTERED_ACCURACY_THRESHOLD;
        const needsSpeed = recentResponseTime > MASTERED_RESPONSE_TIME_THRESHOLD;

        const accuracyProgress = Math.min(100, (recentAccuracy / MASTERED_ACCURACY_THRESHOLD) * 100);
        const attemptsProgress = Math.min(100, (attemptCount / MASTERY_WINDOW_SIZE) * 100);
        const responseTimeProgress = recentResponseTime <= 0
          ? 0
          : recentResponseTime <= MASTERED_RESPONSE_TIME_THRESHOLD
            ? 100
            : Math.max(0, 100 - ((recentResponseTime - MASTERED_RESPONSE_TIME_THRESHOLD) / MASTERED_RESPONSE_TIME_THRESHOLD) * 100);

        const combinedProgress = Math.min(accuracyProgress, attemptsProgress, responseTimeProgress > 0 ? responseTimeProgress : 100);

        let label = '';
        if (needsMoreAttempts) {
          label = `${attemptCount}/${MASTERY_WINDOW_SIZE} recent attempts`;
        } else if (needsAccuracy && needsSpeed) {
          label = `${Math.round(recentAccuracy * 100)}% acc, ${Math.round(recentResponseTime)}ms`;
        } else if (needsAccuracy) {
          label = `${Math.round(recentAccuracy * 100)}% acc (need ${Math.round(MASTERED_ACCURACY_THRESHOLD * 100)}%)`;
        } else if (needsSpeed) {
          label = `${Math.round(recentResponseTime)}ms (need <${MASTERED_RESPONSE_TIME_THRESHOLD}ms)`;
        } else if (recentResponseTime <= 0) {
          label = `Need ${MASTERY_WINDOW_SIZE} recent attempts`;
        } else {
          label = `${Math.round(recentAccuracy * 100)}% · ${Math.round(recentResponseTime)}ms`;
        }
        return { progress: combinedProgress, label };
      }

      case MasteryLevel.MASTERED:
        return { progress: 100, label: 'Mastered!' };

      default:
        return { progress: 0, label: '' };
    }
  };

  // Get power chords and their progress
  const powerChordData = useMemo<PowerChordProgressItem[]>(() => {
    const chords = powerChordRepo.getByHand(hand);

    return chords.map((chord) => {
      const p = progress.getProgress(chord.id, 'powerChord');

      const masteryLevel = p?.masteryLevel ?? MasteryLevel.NEW;
      const totalAttempts = p?.totalAttempts ?? 0;
      const correctAttempts = p?.correctAttempts ?? 0;
      const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

      // Get recent stats from the rolling window
      const recentAttempts = p?.recentAttempts as AttemptRecord[] | undefined;
      const { recentAccuracy, recentResponseTime } = calculateRecentStats(recentAttempts);

      // Calculate progress towards next level
      const { progress: progressToNext, label: progressToNextLabel } = calculateProgressToNext(
        masteryLevel,
        recentAttempts && recentAttempts.length > 0 ? recentAccuracy : accuracy,
        recentResponseTime,
        recentAttempts?.length ?? totalAttempts
      );

      // Get next review date and determine if due
      const nextReviewDate = p?.nextReviewDate ?? null;
      const now = new Date();
      const isDue = totalAttempts > 0 && nextReviewDate !== null && now >= nextReviewDate;

      return {
        id: chord.id,
        displayChars: `${chord.characters[0].displayChar}+${chord.characters[1].displayChar}`,
        char1: chord.characters[0].displayChar,
        char2: chord.characters[1].displayChar,
        char1Color: chord.characters[0].color,
        char2Color: chord.characters[1].color,
        blendedColor: chord.blendedColor,
        producesWords: chord.producesWords,
        masteryLevel,
        totalAttempts,
        correctAttempts,
        accuracy,
        recentAccuracy: recentAttempts && recentAttempts.length > 0 ? recentAccuracy : accuracy,
        recentResponseTime,
        isLearned: totalAttempts > 0,
        progressToNext,
        progressToNextLabel,
        nextReviewDate,
        isDue,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand, progress, powerChordRepo, refreshCounter]);

  // Overall stats
  const overallStats = useMemo(() => {
    return {
      total: powerChordData.length,
      learned: powerChordData.filter((c) => c.isLearned).length,
      mastered: powerChordData.filter((c) => c.masteryLevel === MasteryLevel.MASTERED).length,
      familiar: powerChordData.filter((c) => c.masteryLevel === MasteryLevel.FAMILIAR).length,
      learning: powerChordData.filter((c) => c.masteryLevel === MasteryLevel.LEARNING).length,
    };
  }, [powerChordData]);

  const getMasteryClass = (level: MasteryLevel): string => {
    switch (level) {
      case MasteryLevel.MASTERED:
        return 'mastered';
      case MasteryLevel.FAMILIAR:
        return 'familiar';
      case MasteryLevel.LEARNING:
        return 'learning';
      default:
        return 'new';
    }
  };

  const getMasteryLabel = (level: MasteryLevel): string => {
    switch (level) {
      case MasteryLevel.MASTERED:
        return 'Mastered';
      case MasteryLevel.FAMILIAR:
        return 'Familiar';
      case MasteryLevel.LEARNING:
        return 'Learning';
      default:
        return 'New';
    }
  };

  const getHandLabel = (h: PowerChordHand): string => {
    switch (h) {
      case 'left':
        return 'Left Hand';
      case 'right':
        return 'Right Hand';
      case 'cross':
        return 'Cross-Hand';
    }
  };

  const defaultTitle = `${getHandLabel(hand)} Power Chords Journey`;

  return (
    <div className="progress-journey">
      <div className="progress-journey__header">
        {onBack && (
          <button className="progress-journey__back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <h2 className="progress-journey__title">{title ?? defaultTitle}</h2>
      </div>

      {/* Overall Stats */}
      <div className="progress-journey__overall">
        <div className="progress-journey__stat-bar">
          <div
            className="progress-journey__stat-fill mastered"
            style={{ width: `${(overallStats.mastered / overallStats.total) * 100}%` }}
          />
          <div
            className="progress-journey__stat-fill familiar"
            style={{ width: `${(overallStats.familiar / overallStats.total) * 100}%` }}
          />
          <div
            className="progress-journey__stat-fill learning"
            style={{ width: `${(overallStats.learning / overallStats.total) * 100}%` }}
          />
        </div>
        <div className="progress-journey__stat-legend">
          <span className="legend-item mastered">
            <span className="legend-dot" /> Mastered ({overallStats.mastered})
          </span>
          <span className="legend-item familiar">
            <span className="legend-dot" /> Familiar ({overallStats.familiar})
          </span>
          <span className="legend-item learning">
            <span className="legend-dot" /> Learning ({overallStats.learning})
          </span>
          <span className="legend-item new">
            <span className="legend-dot" /> New ({overallStats.total - overallStats.learned})
          </span>
        </div>
      </div>

      {/* Power Chords Grid */}
      <div className="progress-journey__stages">
        <div className="progress-journey__stage">
          <div className="progress-journey__stage-header">
            <h3 className="progress-journey__stage-name">
              {getHandLabel(hand)} Power Chords
            </h3>
            <span className="progress-journey__stage-progress">
              {overallStats.mastered}/{overallStats.total} mastered
            </span>
          </div>

          <div className="progress-journey__char-grid">
            {powerChordData.map((chord) => (
              <div
                key={chord.id}
                className={`progress-journey__char-card ${getMasteryClass(chord.masteryLevel)}`}
              >
                <div className="progress-journey__char" style={{ display: 'flex', gap: '0.25rem' }}>
                  <span style={{ color: chord.char1Color }}>{chord.char1}</span>
                  <span style={{ color: 'var(--text-muted, #718096)' }}>+</span>
                  <span style={{ color: chord.char2Color }}>{chord.char2}</span>
                </div>
                {chord.producesWords.length > 0 && (
                  <span className="progress-journey__direction" style={{ fontSize: '0.7rem' }}>
                    {chord.producesWords[0]}
                  </span>
                )}
                <span className={`progress-journey__mastery ${getMasteryClass(chord.masteryLevel)}`}>
                  {getMasteryLabel(chord.masteryLevel)}
                </span>
                {chord.isLearned && (
                  <>
                    <span className="progress-journey__stats">
                      {Math.round(chord.recentAccuracy * 100)}% acc
                      {chord.recentResponseTime > 0 && (
                        <> · {Math.round(chord.recentResponseTime)}ms</>
                      )}
                    </span>
                    {/* Progress bar towards next level */}
                    {chord.masteryLevel !== MasteryLevel.MASTERED && (
                      <div className="progress-journey__level-progress">
                        <div
                          className={`progress-journey__level-bar ${getMasteryClass(chord.masteryLevel)}`}
                          style={{ width: `${chord.progressToNext}%` }}
                        />
                      </div>
                    )}
                    <span className="progress-journey__next-hint">
                      {chord.progressToNextLabel}
                    </span>
                    {/* Next review time */}
                    {chord.nextReviewDate && (
                      <span className={`progress-journey__review-time ${chord.isDue ? 'due' : ''}`}>
                        {chord.isDue ? 'Due now' : `Review in ${formatRelativeTime(chord.nextReviewDate)}`}
                      </span>
                    )}
                    {/* Demote button for mastered items */}
                    {chord.masteryLevel === MasteryLevel.MASTERED && (
                      <button
                        className="progress-journey__demote-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDemote(chord.id);
                        }}
                        title="Demote to Familiar for re-practice"
                      >
                        Re-practice
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

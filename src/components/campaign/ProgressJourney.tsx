/**
 * Progress Journey Component
 *
 * Displays all learned characters in a visual grid with mastery progress.
 * Creates a sense of accomplishment by showing the user's learning journey.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  FingerId,
  MasteryLevel,
  MASTERY_WINDOW_SIZE,
  RESPONSE_TIME_WINDOW_SIZE,
  FAMILIAR_ACCURACY_THRESHOLD,
  MASTERED_ACCURACY_THRESHOLD,
  MASTERED_RESPONSE_TIME_THRESHOLD,
  AttemptRecord,
} from '../../domain';
import { getServiceRepositories } from '../../services';
import {
  getCharsForFinger,
  getConfigForChar,
  getFingerName,
  getDirectionSymbol,
  FINGER_COLORS,
} from '../../config/fingerMapping';
import { getFingerColor } from '../../data/static/colorConfig';
import { LEARNING_STAGES } from '../../config/fingerMnemonics';
import { getMnemonic } from '../../config/fingerMnemonics';
import './ProgressJourney.css';

interface CharacterProgress {
  char: string;
  color: string;
  fingerId: FingerId;
  fingerName: string;
  fingerColor: string;
  direction: string;
  directionSymbol: string;
  masteryLevel: MasteryLevel;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  recentAccuracy: number;
  recentResponseTime: number;
  isLearned: boolean;
  // Progress towards next level (0-100)
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

interface StageProgress {
  stageName: string;
  stageIndex: number;
  fingers: {
    fingerId: FingerId;
    fingerName: string;
    fingerColor: string;
    mnemonic: string;
    characters: CharacterProgress[];
  }[];
  learnedCount: number;
  masteredCount: number;
  totalCount: number;
}

export interface ProgressJourneyProps {
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Title for the journey view */
  title?: string;
}

export function ProgressJourney({
  onBack,
  title = 'Your Learning Journey',
}: ProgressJourneyProps): React.ReactElement {
  const { progress } = getServiceRepositories();

  // Refresh counter to force re-render after demoting
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Handle demoting a mastered item
  const handleDemote = useCallback((char: string) => {
    const charProgress = progress.getProgress(char, 'character');
    if (charProgress && charProgress.masteryLevel === MasteryLevel.MASTERED) {
      charProgress.demote();
      progress.updateProgress(charProgress);
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
        // Progress towards FAMILIAR (70% accuracy, 5 attempts)
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
        // Progress towards MASTERED (90% accuracy AND <800ms AND 5 attempts)
        const needsMoreAttempts = attemptCount < MASTERY_WINDOW_SIZE;
        const needsAccuracy = recentAccuracy < MASTERED_ACCURACY_THRESHOLD;
        const needsSpeed = recentResponseTime > MASTERED_RESPONSE_TIME_THRESHOLD;

        // Calculate progress percentages
        const accuracyProgress = Math.min(100, (recentAccuracy / MASTERED_ACCURACY_THRESHOLD) * 100);
        const attemptsProgress = Math.min(100, (attemptCount / MASTERY_WINDOW_SIZE) * 100);
        // For response time, lower is better - invert the scale
        const responseTimeProgress = recentResponseTime <= 0
          ? 0 // No data yet
          : recentResponseTime <= MASTERED_RESPONSE_TIME_THRESHOLD
            ? 100
            : Math.max(0, 100 - ((recentResponseTime - MASTERED_RESPONSE_TIME_THRESHOLD) / MASTERED_RESPONSE_TIME_THRESHOLD) * 100);

        // Use the lowest as the limiting factor
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

  // Organize characters by stage
  const stageData = useMemo<StageProgress[]>(() => {
    return LEARNING_STAGES.map((stage, stageIndex) => {
      const fingers = stage.fingers.map((fingerId) => {
        const fid = fingerId as FingerId;
        const chars = getCharsForFinger(fid);
        const mnemonic = getMnemonic(fid);

        const characters: CharacterProgress[] = chars.map((char) => {
          const config = getConfigForChar(char);
          const p = progress.getProgress(char, 'character');

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
            char,
            color: config ? getFingerColor(config.fingerId, config.direction) : '#888',
            fingerId: fid,
            fingerName: getFingerName(fid),
            fingerColor: FINGER_COLORS[fid],
            direction: config?.direction ?? 'down',
            directionSymbol: config ? getDirectionSymbol(config.direction) : '↓',
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

        return {
          fingerId: fid,
          fingerName: getFingerName(fid),
          fingerColor: FINGER_COLORS[fid],
          mnemonic: mnemonic.phrase,
          characters,
        };
      });

      const allChars = fingers.flatMap((f) => f.characters);
      const learnedCount = allChars.filter((c) => c.isLearned).length;
      const masteredCount = allChars.filter((c) => c.masteryLevel === MasteryLevel.MASTERED).length;
      const totalCount = allChars.length;

      return {
        stageName: stage.name,
        stageIndex,
        fingers,
        learnedCount,
        masteredCount,
        totalCount,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, refreshCounter]);

  // Overall stats
  const overallStats = useMemo(() => {
    const allChars = stageData.flatMap((s) => s.fingers.flatMap((f) => f.characters));
    return {
      total: allChars.length,
      learned: allChars.filter((c) => c.isLearned).length,
      mastered: allChars.filter((c) => c.masteryLevel === MasteryLevel.MASTERED).length,
      familiar: allChars.filter((c) => c.masteryLevel === MasteryLevel.FAMILIAR).length,
      learning: allChars.filter((c) => c.masteryLevel === MasteryLevel.LEARNING).length,
    };
  }, [stageData]);

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

  return (
    <div className="progress-journey">
      <div className="progress-journey__header">
        {onBack && (
          <button className="progress-journey__back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <h2 className="progress-journey__title">{title}</h2>
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

      {/* Stages */}
      <div className="progress-journey__stages">
        {stageData.map((stage) => (
          <div key={stage.stageIndex} className="progress-journey__stage">
            <div className="progress-journey__stage-header">
              <h3 className="progress-journey__stage-name">
                Stage {stage.stageIndex + 1}: {stage.stageName}
              </h3>
              <span className="progress-journey__stage-progress">
                {stage.masteredCount}/{stage.totalCount} mastered
              </span>
            </div>

            {stage.fingers.map((finger) => (
              <div key={finger.fingerId} className="progress-journey__finger-section">
                <div className="progress-journey__finger-header">
                  <span
                    className="progress-journey__finger-name"
                    style={{ color: finger.fingerColor }}
                  >
                    {finger.fingerName}
                  </span>
                  {finger.mnemonic && (
                    <span className="progress-journey__finger-mnemonic">
                      "{finger.mnemonic}"
                    </span>
                  )}
                </div>

                <div className="progress-journey__char-grid">
                  {finger.characters.map((char) => (
                    <div
                      key={char.char}
                      className={`progress-journey__char-card ${getMasteryClass(char.masteryLevel)}`}
                    >
                      <span
                        className="progress-journey__char"
                        style={{ color: char.color }}
                      >
                        {char.char.toUpperCase()}
                      </span>
                      <span className="progress-journey__direction">
                        {char.directionSymbol}
                      </span>
                      <span className={`progress-journey__mastery ${getMasteryClass(char.masteryLevel)}`}>
                        {getMasteryLabel(char.masteryLevel)}
                      </span>
                      {char.isLearned && (
                        <>
                          <span className="progress-journey__stats">
                            {Math.round(char.recentAccuracy * 100)}% acc
                            {char.recentResponseTime > 0 && (
                              <> · {Math.round(char.recentResponseTime)}ms</>
                            )}
                          </span>
                          {/* Progress bar towards next level */}
                          {char.masteryLevel !== MasteryLevel.MASTERED && (
                            <div className="progress-journey__level-progress">
                              <div
                                className={`progress-journey__level-bar ${getMasteryClass(char.masteryLevel)}`}
                                style={{ width: `${char.progressToNext}%` }}
                              />
                            </div>
                          )}
                          <span className="progress-journey__next-hint">
                            {char.progressToNextLabel}
                          </span>
                          {/* Next review time */}
                          {char.nextReviewDate && (
                            <span className={`progress-journey__review-time ${char.isDue ? 'due' : ''}`}>
                              {char.isDue ? 'Due now' : `Review in ${formatRelativeTime(char.nextReviewDate)}`}
                            </span>
                          )}
                          {/* Demote button for mastered items */}
                          {char.masteryLevel === MasteryLevel.MASTERED && (
                            <button
                              className="progress-journey__demote-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDemote(char.char);
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
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

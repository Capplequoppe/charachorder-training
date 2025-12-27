/**
 * Combo Display Component
 *
 * Shows the current combo streak with visual feedback.
 */

import React from 'react';
import { type ComboState } from '@/free-play/services/ComboService';
import { getComboProgress, getStreaksToNextTier, getNextComboTier } from '@/data/static/comboConfig';
import './gamification.css';

export interface ComboDisplayProps {
  comboState: ComboState;
  position?: 'top-right' | 'top-left' | 'center' | 'bottom';
  showProgress?: boolean;
  compact?: boolean;
}

export function ComboDisplay({
  comboState,
  position = 'top-right',
  showProgress = true,
  compact = false,
}: ComboDisplayProps) {
  const {
    currentStreak,
    currentTier,
    justLeveledUp,
    justBrokeStreak,
    brokenStreak,
  } = comboState;

  // Don't show if no streak and didn't just break one
  if (currentStreak === 0 && !justBrokeStreak) {
    return null;
  }

  const progress = getComboProgress(currentStreak);
  const nextTier = getNextComboTier(currentStreak);
  const toNextTier = getStreaksToNextTier(currentStreak);

  return (
    <div className={`combo-display ${position} ${compact ? 'compact' : ''}`}>
      {/* Broken streak message */}
      {justBrokeStreak && brokenStreak >= 5 && (
        <div className="streak-broken">
          <span className="broken-count">{brokenStreak}</span>
          <span className="broken-label">streak broken</span>
        </div>
      )}

      {/* Active combo display */}
      {currentStreak > 0 && (
        <>
          {/* Streak counter */}
          <div
            className={`streak-counter ${justLeveledUp ? 'level-up' : ''}`}
            style={{
              color: currentTier.color,
              textShadow: currentTier.glowIntensity > 0
                ? `0 0 ${currentTier.glowIntensity * 20}px ${currentTier.color}`
                : 'none',
            }}
          >
            <span className="count">{currentStreak}</span>
            <span className="label">COMBO</span>
          </div>

          {/* Tier name */}
          {currentTier.name && (
            <div
              className={`tier-name ${justLeveledUp ? 'pop-in' : ''}`}
              style={{ color: currentTier.color }}
            >
              {currentTier.name}
            </div>
          )}

          {/* Progress to next tier */}
          {showProgress && nextTier && !compact && (
            <div className="combo-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: currentTier.color,
                  }}
                />
              </div>
              <div className="progress-label">
                {toNextTier} to {nextTier.name || 'next tier'}
              </div>
            </div>
          )}

          {/* Score multiplier indicator */}
          {currentTier.scoreMultiplier > 1 && !compact && (
            <div
              className="score-multiplier"
              style={{ color: currentTier.color }}
            >
              {currentTier.scoreMultiplier}x
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== Compact Inline Display ====================

export interface ComboInlineProps {
  streak: number;
  showZero?: boolean;
}

export function ComboInline({ streak, showZero = false }: ComboInlineProps) {
  if (streak === 0 && !showZero) return null;

  const tier = streak > 0 ? getNextComboTier(streak - 1) : null;
  const color = tier?.color ?? '#888';

  return (
    <span
      className="combo-inline"
      style={{ color }}
    >
      {streak}x
    </span>
  );
}

// ==================== Combo Meter (Progress Bar Style) ====================

export interface ComboMeterProps {
  comboState: ComboState;
  width?: number | string;
}

export function ComboMeter({ comboState, width = '100%' }: ComboMeterProps) {
  const { currentStreak, currentTier, bestStreak } = comboState;

  const progress = getComboProgress(currentStreak);
  const nextTier = getNextComboTier(currentStreak);

  return (
    <div className="combo-meter" style={{ width }}>
      <div className="meter-header">
        <span className="meter-label">COMBO</span>
        <span
          className="meter-value"
          style={{ color: currentTier.color }}
        >
          {currentStreak}
        </span>
        {bestStreak > 0 && (
          <span className="meter-best">
            Best: {bestStreak}
          </span>
        )}
      </div>

      <div className="meter-bar">
        <div
          className="meter-fill"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: currentTier.color,
            boxShadow: currentTier.glowIntensity > 0
              ? `0 0 ${currentTier.glowIntensity * 10}px ${currentTier.color}`
              : 'none',
          }}
        />

        {/* Tier markers */}
        {nextTier && (
          <div
            className="tier-marker next"
            style={{ left: '100%' }}
          >
            <span className="marker-label">{nextTier.minStreak}</span>
          </div>
        )}
      </div>

      {currentTier.name && (
        <div
          className="meter-tier-name"
          style={{ color: currentTier.color }}
        >
          {currentTier.name}
        </div>
      )}
    </div>
  );
}

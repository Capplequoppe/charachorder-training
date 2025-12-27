/**
 * Timer Display Component
 *
 * Displays countdown or count-up timer with visual state changes.
 */

import React, { useMemo } from 'react';
import './challenges.css';

export interface TimerDisplayProps {
  timeMs: number;
  mode: 'countdown' | 'countup';
  warningThreshold?: number;  // Seconds remaining for warning state
  dangerThreshold?: number;   // Seconds remaining for danger state
  showCentiseconds?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function TimerDisplay({
  timeMs,
  mode,
  warningThreshold = 10,
  dangerThreshold = 5,
  showCentiseconds = true,
  size = 'medium',
}: TimerDisplayProps) {
  const { seconds, centiseconds, state } = useMemo(() => {
    const totalSeconds = Math.max(0, timeMs) / 1000;
    const secs = Math.floor(totalSeconds);
    const cents = Math.floor((totalSeconds % 1) * 100);

    let timerState: 'normal' | 'warning' | 'danger' = 'normal';

    if (mode === 'countdown') {
      if (secs <= dangerThreshold) {
        timerState = 'danger';
      } else if (secs <= warningThreshold) {
        timerState = 'warning';
      }
    }

    return {
      seconds: secs,
      centiseconds: cents,
      state: timerState,
    };
  }, [timeMs, mode, warningThreshold, dangerThreshold]);

  const formatTime = (secs: number): string => {
    if (secs >= 60) {
      const mins = Math.floor(secs / 60);
      const remainingSecs = secs % 60;
      return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    }
    return secs.toString().padStart(2, '0');
  };

  return (
    <div className={`timer-display timer-${state} timer-${size}`}>
      <span className="timer-seconds">{formatTime(seconds)}</span>
      {showCentiseconds && (
        <>
          <span className="timer-separator">.</span>
          <span className="timer-centiseconds">
            {centiseconds.toString().padStart(2, '0')}
          </span>
        </>
      )}
    </div>
  );
}

// ==================== Additional Timer Components ====================

export interface TimeAddedIndicatorProps {
  time: number;  // Positive = added, negative = subtracted
  visible: boolean;
}

export function TimeAddedIndicator({ time, visible }: TimeAddedIndicatorProps) {
  if (!visible || time === 0) return null;

  const isPositive = time > 0;
  const displayTime = Math.abs(time / 1000).toFixed(1);

  return (
    <div className={`time-added-indicator ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? '+' : '-'}{displayTime}s
    </div>
  );
}

export interface ProgressTimerProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressTimer({ current, total, label }: ProgressTimerProps) {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="progress-timer">
      {label && <div className="progress-timer-label">{label}</div>}
      <div className="progress-timer-bar">
        <div
          className="progress-timer-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-timer-text">
        {current} / {total}
      </div>
    </div>
  );
}

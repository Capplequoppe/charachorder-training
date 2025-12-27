/**
 * Transcription Stats Component
 *
 * Real-time statistics display during transcription practice.
 * Shows WPM, accuracy, time elapsed, and error count.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { type TranscriptionSession } from '@/free-play/services/TranscriptionService';
import './practice.css';

export interface TranscriptionStatsProps {
  /** Active transcription session */
  session: TranscriptionSession;
  /** Target text being transcribed */
  targetText: string;
  /** User's current typed text */
  typedText: string;
}

/**
 * Format milliseconds to MM:SS display.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Count errors between target and typed text.
 */
function countErrors(target: string, typed: string): number {
  let errors = 0;
  const minLength = Math.min(target.length, typed.length);

  for (let i = 0; i < minLength; i++) {
    if (target[i] !== typed[i]) errors++;
  }

  // Extra characters beyond target also count as errors
  if (typed.length > target.length) {
    errors += typed.length - target.length;
  }

  return errors;
}

/**
 * Real-time transcription statistics display.
 */
export function TranscriptionStats({
  session,
  targetText,
  typedText,
}: TranscriptionStatsProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every 100ms
  useEffect(() => {
    const startTime = session.startTime.getTime();

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [session.startTime]);

  // Calculate statistics
  const stats = useMemo(() => {
    const wordsTyped = typedText.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = elapsedTime / 60000;
    const currentWpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;

    const errors = countErrors(targetText, typedText);
    const accuracy = typedText.length > 0
      ? Math.round(((typedText.length - errors) / typedText.length) * 100)
      : 100;

    // Characters per minute
    const cpm = minutes > 0 ? Math.round(typedText.length / minutes) : 0;

    return {
      wpm: currentWpm,
      accuracy: Math.max(0, accuracy),
      errors,
      cpm,
      wordsTyped,
      charsTyped: typedText.length,
    };
  }, [typedText, targetText, elapsedTime]);

  return (
    <div className="transcription-stats">
      <div className="stat-item wpm">
        <span className="stat-value">{stats.wpm}</span>
        <span className="stat-label">WPM</span>
      </div>

      <div className="stat-item accuracy">
        <span className={`stat-value ${stats.accuracy >= 90 ? 'good' : stats.accuracy >= 70 ? 'warning' : 'error'}`}>
          {stats.accuracy}%
        </span>
        <span className="stat-label">Accuracy</span>
      </div>

      <div className="stat-item time">
        <span className="stat-value">{formatTime(elapsedTime)}</span>
        <span className="stat-label">Time</span>
      </div>

      <div className="stat-item errors">
        <span className={`stat-value ${stats.errors === 0 ? 'good' : stats.errors <= 5 ? 'warning' : 'error'}`}>
          {stats.errors}
        </span>
        <span className="stat-label">Errors</span>
      </div>
    </div>
  );
}

/**
 * Compact stats bar for inline display.
 */
export interface CompactStatsProps {
  wpm: number;
  accuracy: number;
  timeMs: number;
}

export function CompactStats({ wpm, accuracy, timeMs }: CompactStatsProps) {
  return (
    <div className="compact-stats">
      <span>{wpm} WPM</span>
      <span className="divider">|</span>
      <span>{accuracy}%</span>
      <span className="divider">|</span>
      <span>{formatTime(timeMs)}</span>
    </div>
  );
}

/**
 * WPM gauge visualization.
 */
export interface WpmGaugeProps {
  wpm: number;
  maxWpm?: number;
}

export function WpmGauge({ wpm, maxWpm = 150 }: WpmGaugeProps) {
  const percentage = Math.min(100, (wpm / maxWpm) * 100);

  // Color based on WPM level
  const getColor = () => {
    if (wpm < 30) return 'var(--error-color, #FF6B6B)';
    if (wpm < 50) return 'var(--warning-color, #FFA500)';
    if (wpm < 80) return 'var(--accent-color, #4DA6FF)';
    return 'var(--success-color, #00FF7F)';
  };

  return (
    <div className="wpm-gauge">
      <div className="gauge-background">
        <div
          className="gauge-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      <div className="gauge-value">
        <span className="value">{wpm}</span>
        <span className="unit">WPM</span>
      </div>
    </div>
  );
}

export default TranscriptionStats;

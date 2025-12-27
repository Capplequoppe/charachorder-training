/**
 * Challenge Results Component
 *
 * Displays results after completing a challenge.
 */

import React from 'react';
import { type ChallengeResult } from '@/free-play/services/ChallengeService';
import { getMedalEmoji, getMedalColor } from '@/data/static/challengeConfig';
import './challenges.css';

export interface ChallengeResultsProps {
  result: ChallengeResult;
  onPlayAgain: () => void;
  onSelectDifferent: () => void;
  onClose?: () => void;
}

export function ChallengeResults({
  result,
  onPlayAgain,
  onSelectDifferent,
  onClose,
}: ChallengeResultsProps) {
  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = (seconds % 60).toFixed(2);
      return `${mins}:${secs.padStart(5, '0')}`;
    }
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div className="challenge-results">
      {/* Header with Personal Best indicator */}
      <div className="results-header">
        {result.isPersonalBest && (
          <div className="personal-best-banner">
            <span className="pb-star">⭐</span>
            <span>New Personal Best!</span>
            <span className="pb-star">⭐</span>
          </div>
        )}

        <h2 className="results-title">
          {result.type === 'timeAttack' ? 'Time Attack Complete!' : 'Sprint Complete!'}
        </h2>
      </div>

      {/* Medal Display (Sprint only) */}
      {result.type === 'sprint' && result.medal !== 'none' && (
        <div className="medal-display">
          <span
            className="medal-large"
            style={{ color: getMedalColor(result.medal) }}
          >
            {getMedalEmoji(result.medal)}
          </span>
          <span className="medal-label">
            {result.medal.charAt(0).toUpperCase() + result.medal.slice(1)} Medal
          </span>
        </div>
      )}

      {/* Main Score */}
      <div className="results-score">
        <span className="score-value">{result.finalScore.toLocaleString()}</span>
        <span className="score-label">Points</span>
      </div>

      {/* Stats Grid */}
      <div className="results-stats">
        <div className="stat-box">
          <span className="stat-icon">⏱️</span>
          <span className="stat-value">{formatTime(result.totalTimeMs)}</span>
          <span className="stat-label">Time</span>
        </div>

        <div className="stat-box">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">{Math.round(result.accuracy * 100)}%</span>
          <span className="stat-label">Accuracy</span>
        </div>

        <div className="stat-box">
          <span className="stat-icon">✅</span>
          <span className="stat-value">{result.correctCount}</span>
          <span className="stat-label">Correct</span>
        </div>

        <div className="stat-box">
          <span className="stat-icon">❌</span>
          <span className="stat-value">{result.wrongCount}</span>
          <span className="stat-label">Wrong</span>
        </div>

        <div className="stat-box">
          <span className="stat-icon">🔥</span>
          <span className="stat-value">{result.bestStreak}</span>
          <span className="stat-label">Best Streak</span>
        </div>

        <div className="stat-box">
          <span className="stat-icon">⚡</span>
          <span className="stat-value">
            {result.averageResponseTimeMs > 0
              ? `${Math.round(result.averageResponseTimeMs)}ms`
              : '-'}
          </span>
          <span className="stat-label">Avg Response</span>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        {result.accuracy >= 0.9 && result.bestStreak >= 10 && (
          <div className="achievement-badge">
            <span className="badge-icon">🌟</span>
            <span>Excellent Performance!</span>
          </div>
        )}
        {result.bestStreak >= 20 && (
          <div className="achievement-badge">
            <span className="badge-icon">🔥</span>
            <span>Streak Master!</span>
          </div>
        )}
        {result.accuracy === 1 && result.totalItems >= 10 && (
          <div className="achievement-badge">
            <span className="badge-icon">💎</span>
            <span>Perfect Accuracy!</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="btn primary large" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn secondary" onClick={onSelectDifferent}>
          Different Challenge
        </button>
        {onClose && (
          <button className="btn text" onClick={onClose}>
            Exit
          </button>
        )}
      </div>
    </div>
  );
}

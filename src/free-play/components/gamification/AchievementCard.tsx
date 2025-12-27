/**
 * Achievement Card Component
 *
 * Displays an individual achievement with progress.
 */

import React from 'react';
import {
  type AchievementDefinition,
  getTierColor,
  getTierXp,
} from '@/data/static/achievements';
import { type AchievementProgress } from '@/free-play/services/AchievementService';
import './gamification.css';

export interface AchievementCardProps {
  achievement: AchievementDefinition;
  progress?: AchievementProgress;
  onClick?: () => void;
  compact?: boolean;
}

export function AchievementCard({
  achievement,
  progress,
  onClick,
  compact = false,
}: AchievementCardProps) {
  const isUnlocked = progress?.isUnlocked ?? false;
  const isHidden = achievement.hidden && !isUnlocked;
  const tierColor = getTierColor(achievement.tier);
  const percentage = progress?.percentage ?? 0;

  return (
    <div
      className={`achievement-card tier-${achievement.tier} ${isUnlocked ? 'unlocked' : 'locked'} ${compact ? 'compact' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        '--tier-color': tierColor,
      } as React.CSSProperties}
    >
      {/* Icon */}
      <div className="card-icon-wrapper">
        <div className="card-icon">
          {isHidden ? '❓' : achievement.icon}
        </div>
        {isUnlocked && (
          <div className="unlocked-check">✓</div>
        )}
      </div>

      {/* Content */}
      <div className="card-content">
        <div className="card-name">
          {isHidden ? '???' : achievement.name}
        </div>

        {!compact && (
          <div className="card-description">
            {isHidden
              ? 'Complete hidden requirements to unlock'
              : achievement.description}
          </div>
        )}

        {/* Progress bar for locked achievements */}
        {!isUnlocked && !isHidden && progress && (
          <div className="card-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${percentage * 100}%`,
                  backgroundColor: tierColor,
                }}
              />
            </div>
            <div className="progress-text">
              {Math.round(percentage * 100)}%
            </div>
          </div>
        )}

        {/* Unlock date for completed */}
        {isUnlocked && progress?.unlockedAt && !compact && (
          <div className="card-unlock-date">
            Unlocked {formatDate(progress.unlockedAt)}
          </div>
        )}
      </div>

      {/* Tier indicator */}
      <div
        className="card-tier"
        style={{ backgroundColor: tierColor }}
      >
        {achievement.tier}
      </div>

      {/* Reward indicator */}
      {achievement.reward && (
        <div className="card-reward-indicator" title={`Reward: ${achievement.reward.name}`}>
          🎁
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return date.toLocaleDateString();
}

// ==================== Achievement Modal ====================

export interface AchievementModalProps {
  achievement: AchievementDefinition;
  progress?: AchievementProgress;
  onClose: () => void;
}

export function AchievementModal({
  achievement,
  progress,
  onClose,
}: AchievementModalProps) {
  const isUnlocked = progress?.isUnlocked ?? false;
  const tierColor = getTierColor(achievement.tier);
  const xp = achievement.xpReward ?? getTierXp(achievement.tier);

  return (
    <div className="achievement-modal-overlay" onClick={onClose}>
      <div
        className={`achievement-modal tier-${achievement.tier}`}
        onClick={e => e.stopPropagation()}
        style={{ '--tier-color': tierColor } as React.CSSProperties}
      >
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-header">
          <div className="modal-icon">{achievement.icon}</div>
          <div className="modal-tier" style={{ color: tierColor }}>
            {achievement.tier.toUpperCase()}
          </div>
        </div>

        <h2 className="modal-name" style={{ color: isUnlocked ? tierColor : undefined }}>
          {achievement.name}
        </h2>

        <p className="modal-description">{achievement.description}</p>

        {/* Progress */}
        {!isUnlocked && progress && (
          <div className="modal-progress">
            <div className="progress-bar large">
              <div
                className="progress-fill"
                style={{
                  width: `${progress.percentage * 100}%`,
                  backgroundColor: tierColor,
                }}
              />
            </div>
            <div className="progress-detail">
              {progress.currentValue} / {progress.targetValue}
            </div>
          </div>
        )}

        {/* Unlock status */}
        {isUnlocked && progress?.unlockedAt && (
          <div className="modal-unlock-info">
            <span className="unlock-check">✓</span>
            <span>Unlocked on {progress.unlockedAt.toLocaleDateString()}</span>
          </div>
        )}

        {/* Reward */}
        {achievement.reward && (
          <div className={`modal-reward ${isUnlocked ? 'unlocked' : 'locked'}`}>
            <div className="reward-header">
              <span className="reward-icon">🎁</span>
              <span>Reward</span>
            </div>
            <div className="reward-name">{achievement.reward.name}</div>
            <div className="reward-type">{achievement.reward.type}</div>
          </div>
        )}

        {/* XP */}
        <div className="modal-xp">
          <span className="xp-icon">⭐</span>
          <span className="xp-value">{xp} XP</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Achievement Notification Component
 *
 * Displays a toast notification when an achievement is unlocked.
 */

import React, { useEffect, useState } from 'react';
import {
  type AchievementDefinition,
  getTierColor,
  getTierXp,
} from '@/data/static/achievements';
import './gamification.css';

export interface AchievementNotificationProps {
  achievement: AchievementDefinition;
  xpEarned?: number;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function AchievementNotification({
  achievement,
  xpEarned,
  onDismiss,
  autoDismissMs = 5000,
}: AchievementNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  const xp = xpEarned ?? achievement.xpReward ?? getTierXp(achievement.tier);
  const tierColor = getTierColor(achievement.tier);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, autoDismissMs - 500);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`achievement-notification tier-${achievement.tier} ${isExiting ? 'exiting' : ''}`}
      style={{ borderColor: tierColor }}
    >
      <div className="notification-glow" style={{ backgroundColor: tierColor }} />

      <div className="notification-icon">{achievement.icon}</div>

      <div className="notification-content">
        <div className="notification-label">Achievement Unlocked!</div>
        <div className="notification-name" style={{ color: tierColor }}>
          {achievement.name}
        </div>
        <div className="notification-description">
          {achievement.description}
        </div>

        {achievement.reward && (
          <div className="notification-reward">
            <span className="reward-icon">🎁</span>
            <span>Reward: {achievement.reward.name}</span>
          </div>
        )}
      </div>

      <div className="notification-xp">
        <span className="xp-value">+{xp}</span>
        <span className="xp-label">XP</span>
      </div>

      <button
        className="notification-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

// ==================== Notification Queue Manager ====================

export interface AchievementQueueProps {
  notifications: Array<{
    id: string;
    achievement: AchievementDefinition;
    xpEarned?: number;
  }>;
  onDismiss: (id: string) => void;
}

export function AchievementQueue({ notifications, onDismiss }: AchievementQueueProps) {
  if (notifications.length === 0) return null;

  // Only show the first notification (queue)
  const current = notifications[0];

  return (
    <div className="achievement-queue">
      <AchievementNotification
        key={current.id}
        achievement={current.achievement}
        xpEarned={current.xpEarned}
        onDismiss={() => onDismiss(current.id)}
      />

      {notifications.length > 1 && (
        <div className="queue-indicator">
          +{notifications.length - 1} more
        </div>
      )}
    </div>
  );
}

// ==================== Mini Achievement Badge ====================

export interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export function AchievementBadge({
  achievement,
  size = 'medium',
  showName = false,
}: AchievementBadgeProps) {
  const tierColor = getTierColor(achievement.tier);

  return (
    <div
      className={`achievement-badge-display size-${size}`}
      style={{ borderColor: tierColor }}
      title={`${achievement.name}: ${achievement.description}`}
    >
      <span className="badge-icon">{achievement.icon}</span>
      {showName && (
        <span className="badge-name" style={{ color: tierColor }}>
          {achievement.name}
        </span>
      )}
    </div>
  );
}

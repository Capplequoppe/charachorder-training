/**
 * Unlock Notification Component
 *
 * Celebratory modal that appears when a feature is unlocked after
 * completing a chapter in campaign mode.
 */

import React, { useEffect, useRef } from 'react';
import { UnlockableFeature } from '../../../campaign/types';
import './UnlockNotification.css';

/**
 * Feature display info mapping.
 */
const FEATURE_INFO: Record<
  UnlockableFeature,
  { icon: string; name: string; description: string }
> = {
  [UnlockableFeature.CHALLENGES]: {
    icon: '⚡',
    name: 'Challenges',
    description: 'Test your speed with timed challenges and compete for high scores!',
  },
  [UnlockableFeature.SONGS]: {
    icon: '🎵',
    name: 'Songs',
    description: 'Practice chords through lyrics of your favorite songs!',
  },
  [UnlockableFeature.CATEGORIES]: {
    icon: '📂',
    name: 'Categories',
    description: 'Explore chords organized by topic, domain, and usage patterns!',
  },
  [UnlockableFeature.ANALYTICS]: {
    icon: '📊',
    name: 'Analytics',
    description: 'Track your progress with detailed statistics and insights!',
  },
  [UnlockableFeature.ACHIEVEMENTS]: {
    icon: '🏆',
    name: 'Achievements',
    description: 'Earn badges and rewards for your accomplishments!',
  },
  [UnlockableFeature.LIBRARY]: {
    icon: '📚',
    name: 'Library',
    description: 'Browse and search the complete chord library!',
  },
};

interface UnlockNotificationProps {
  /** The feature that was unlocked */
  feature: UnlockableFeature;
  /** Callback when notification is dismissed */
  onDismiss: () => void;
}

export function UnlockNotification({
  feature,
  onDismiss,
}: UnlockNotificationProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const featureInfo = FEATURE_INFO[feature];

  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    // Handle Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    // Add listeners after a small delay to prevent immediate dismiss
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div className="unlock-notification-overlay">
      <div className="unlock-notification-modal" ref={modalRef}>
        <button
          className="unlock-notification-close"
          onClick={onDismiss}
          aria-label="Close notification"
        >
          ×
        </button>

        <div className="unlock-notification-celebration">
          <span className="unlock-notification-confetti">🎉</span>
          <span className="unlock-notification-icon">{featureInfo.icon}</span>
          <span className="unlock-notification-confetti">🎉</span>
        </div>

        <h2 className="unlock-notification-title">Feature Unlocked!</h2>

        <div className="unlock-notification-feature">
          <span className="unlock-notification-feature-name">
            {featureInfo.name}
          </span>
        </div>

        <p className="unlock-notification-description">
          {featureInfo.description}
        </p>

        <button className="unlock-notification-button" onClick={onDismiss}>
          Awesome!
        </button>
      </div>
    </div>
  );
}

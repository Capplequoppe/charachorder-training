/**
 * Achievement Gallery Component
 *
 * Displays all achievements with category filtering and progress tracking.
 */

import React, { useState, useMemo } from 'react';
import {
  ACHIEVEMENTS,
  AchievementCategory,
  type AchievementDefinition,
} from '@/data/static/achievements';
import { getAchievementService, type AchievementProgress } from '@/free-play/services/AchievementService';
import { AchievementCard, AchievementModal } from './AchievementCard';
import './gamification.css';

// ==================== Category Display Names ====================

const CATEGORY_NAMES: Record<AchievementCategory | 'all', string> = {
  all: 'All',
  [AchievementCategory.PROGRESS]: 'Progress',
  [AchievementCategory.MASTERY]: 'Mastery',
  [AchievementCategory.SPEED]: 'Speed',
  [AchievementCategory.CONSISTENCY]: 'Consistency',
  [AchievementCategory.EXPLORATION]: 'Exploration',
  [AchievementCategory.CHALLENGE]: 'Challenge',
};

const CATEGORY_ICONS: Record<AchievementCategory | 'all', string> = {
  all: '🏆',
  [AchievementCategory.PROGRESS]: '📈',
  [AchievementCategory.MASTERY]: '⭐',
  [AchievementCategory.SPEED]: '⚡',
  [AchievementCategory.CONSISTENCY]: '🔥',
  [AchievementCategory.EXPLORATION]: '🧭',
  [AchievementCategory.CHALLENGE]: '🎯',
};

// ==================== Main Gallery Component ====================

export interface AchievementGalleryProps {
  onClose?: () => void;
  showHeader?: boolean;
}

export function AchievementGallery({
  onClose,
  showHeader = true,
}: AchievementGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDefinition | null>(null);
  const [showOnlyLocked, setShowOnlyLocked] = useState(false);

  const service = getAchievementService();
  const allProgress = useMemo(() => service.getAllProgress(), [service]);

  // Create progress map for quick lookups
  const progressMap = useMemo(() => {
    const map = new Map<string, AchievementProgress>();
    allProgress.forEach(p => map.set(p.achievementId, p));
    return map;
  }, [allProgress]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = ACHIEVEMENTS;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (showOnlyLocked) {
      filtered = filtered.filter(a => !progressMap.get(a.id)?.isUnlocked);
    }

    return filtered;
  }, [selectedCategory, showOnlyLocked, progressMap]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCount = ACHIEVEMENTS.length;
    const unlockedCount = service.getUnlockedCount();
    const totalXp = service.getTotalXp();

    // Category stats
    const categoryStats: Record<AchievementCategory, { total: number; unlocked: number }> = {
      [AchievementCategory.PROGRESS]: { total: 0, unlocked: 0 },
      [AchievementCategory.MASTERY]: { total: 0, unlocked: 0 },
      [AchievementCategory.SPEED]: { total: 0, unlocked: 0 },
      [AchievementCategory.CONSISTENCY]: { total: 0, unlocked: 0 },
      [AchievementCategory.EXPLORATION]: { total: 0, unlocked: 0 },
      [AchievementCategory.CHALLENGE]: { total: 0, unlocked: 0 },
    };

    ACHIEVEMENTS.forEach(a => {
      categoryStats[a.category].total++;
      if (progressMap.get(a.id)?.isUnlocked) {
        categoryStats[a.category].unlocked++;
      }
    });

    return {
      totalCount,
      unlockedCount,
      totalXp,
      completionPercentage: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
      categoryStats,
    };
  }, [service, progressMap]);

  const selectedProgress = selectedAchievement
    ? progressMap.get(selectedAchievement.id)
    : undefined;

  return (
    <div className="achievement-gallery">
      {/* Header */}
      {showHeader && (
        <div className="gallery-header">
          <div className="gallery-title">
            <span className="title-icon">🏆</span>
            <h1>Achievements</h1>
            {onClose && (
              <button className="gallery-close" onClick={onClose}>
                &times;
              </button>
            )}
          </div>

          <div className="gallery-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.unlockedCount}</span>
              <span className="stat-label">/ {stats.totalCount} Unlocked</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalXp}</span>
              <span className="stat-label">XP Earned</span>
            </div>
            <div className="stat-item progress-ring">
              <div className="ring-container">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray={`${stats.completionPercentage}, 100`}
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="ring-percentage">
                  {Math.round(stats.completionPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="gallery-tabs">
        {(Object.keys(CATEGORY_NAMES) as Array<AchievementCategory | 'all'>).map(category => {
          const isAll = category === 'all';
          const stat = isAll
            ? { total: stats.totalCount, unlocked: stats.unlockedCount }
            : stats.categoryStats[category as AchievementCategory];

          return (
            <button
              key={category}
              className={`tab-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              <span className="tab-icon">{CATEGORY_ICONS[category]}</span>
              <span className="tab-name">{CATEGORY_NAMES[category]}</span>
              <span className="tab-count">
                {stat.unlocked}/{stat.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Toggle */}
      <div className="gallery-filters">
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={showOnlyLocked}
            onChange={e => setShowOnlyLocked(e.target.checked)}
          />
          <span>Show only locked</span>
        </label>
        <span className="filter-count">
          Showing {filteredAchievements.length} achievements
        </span>
      </div>

      {/* Achievement Grid */}
      <div className="achievement-grid">
        {filteredAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            progress={progressMap.get(achievement.id)}
            onClick={() => setSelectedAchievement(achievement)}
          />
        ))}

        {filteredAchievements.length === 0 && (
          <div className="no-achievements">
            <span className="no-achievements-icon">🎉</span>
            <p>
              {showOnlyLocked
                ? 'All achievements in this category are unlocked!'
                : 'No achievements in this category yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Achievement Modal */}
      {selectedAchievement && (
        <AchievementModal
          achievement={selectedAchievement}
          progress={selectedProgress}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
}

// ==================== Mini Gallery Widget ====================

export interface AchievementWidgetProps {
  maxItems?: number;
  onViewAll?: () => void;
}

export function AchievementWidget({
  maxItems = 4,
  onViewAll,
}: AchievementWidgetProps) {
  const service = getAchievementService();
  const allProgress = useMemo(() => service.getAllProgress(), [service]);

  // Get recent unlocks or near-completion achievements
  const featuredAchievements = useMemo(() => {
    // Sort by: unlocked (recent first), then by progress percentage
    const sorted = [...allProgress].sort((a, b) => {
      // Unlocked achievements first, by date (most recent first)
      if (a.isUnlocked && b.isUnlocked) {
        const aDate = a.unlockedAt?.getTime() ?? 0;
        const bDate = b.unlockedAt?.getTime() ?? 0;
        return bDate - aDate;
      }
      if (a.isUnlocked) return -1;
      if (b.isUnlocked) return 1;

      // Then by progress (closest to completion first)
      return b.percentage - a.percentage;
    });

    return sorted.slice(0, maxItems);
  }, [allProgress, maxItems]);

  const stats = {
    unlocked: service.getUnlockedCount(),
    total: service.getTotalCount(),
    xp: service.getTotalXp(),
  };

  return (
    <div className="achievement-widget">
      <div className="widget-header">
        <h3>Achievements</h3>
        <span className="widget-count">
          {stats.unlocked}/{stats.total}
        </span>
      </div>

      <div className="widget-items">
        {featuredAchievements.map(progress => (
          <AchievementCard
            key={progress.achievementId}
            achievement={progress.definition}
            progress={progress}
            compact
          />
        ))}
      </div>

      {onViewAll && (
        <button className="widget-view-all" onClick={onViewAll}>
          View All Achievements
        </button>
      )}

      <div className="widget-xp">
        <span className="xp-icon">⭐</span>
        <span className="xp-value">{stats.xp} XP</span>
      </div>
    </div>
  );
}

// ==================== Recent Unlocks Display ====================

export interface RecentUnlocksProps {
  maxItems?: number;
  onViewAll?: () => void;
}

export function RecentUnlocks({
  maxItems = 3,
  onViewAll,
}: RecentUnlocksProps) {
  const service = getAchievementService();
  const unlocked = service.getUnlockedAchievements();

  // Get recent unlocks
  const recentUnlocks = useMemo(() => {
    const sorted = [...unlocked].sort((a, b) => {
      const aDate = a.unlockedAt?.getTime() ?? 0;
      const bDate = b.unlockedAt?.getTime() ?? 0;
      return bDate - aDate;
    });

    return sorted.slice(0, maxItems).map(unlock => {
      const definition = ACHIEVEMENTS.find(a => a.id === unlock.achievementId);
      return { unlock, definition };
    }).filter(item => item.definition !== undefined);
  }, [unlocked, maxItems]);

  if (recentUnlocks.length === 0) {
    return null;
  }

  return (
    <div className="recent-unlocks">
      <h4>Recent Achievements</h4>
      <div className="recent-list">
        {recentUnlocks.map(({ unlock, definition }) => (
          <div key={unlock.achievementId} className="recent-item">
            <span className="recent-icon">{definition!.icon}</span>
            <span className="recent-name">{definition!.name}</span>
          </div>
        ))}
      </div>
      {onViewAll && (
        <button className="recent-view-all" onClick={onViewAll}>
          View All
        </button>
      )}
    </div>
  );
}

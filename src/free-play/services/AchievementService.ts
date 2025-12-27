/**
 * Achievement Service
 *
 * Handles achievement checking, unlocking, and progress tracking.
 */

import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementTier,
  type Reward,
  getTierXp,
} from '@/data/static/achievements';
import {
  getAchievementRepository,
  type AchievementMetrics,
  type UnlockedAchievement,
} from '@/data/repositories/AchievementRepository';

// ==================== Types ====================

export interface AchievementProgress {
  achievementId: string;
  definition: AchievementDefinition;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isUnlocked: boolean;
  unlockedAt: Date | null;
}

export interface AchievementUnlockEvent {
  achievement: AchievementDefinition;
  unlockedAt: Date;
  xpEarned: number;
  reward?: Reward;
}

export type AchievementListener = (event: AchievementUnlockEvent) => void;

export interface IAchievementService {
  checkAchievements(): AchievementUnlockEvent[];
  getProgress(achievementId: string): AchievementProgress | null;
  getAllProgress(): AchievementProgress[];
  getUnlockedAchievements(): UnlockedAchievement[];
  getUnlockedCount(): number;
  getTotalCount(): number;
  getTotalXp(): number;
  getUnlockedRewards(): Reward[];
  isRewardUnlocked(rewardId: string): boolean;
  onAchievementUnlocked(callback: AchievementListener): () => void;

  // Metric recording helpers
  recordFingerPractice(fingerId: string, responseTimeMs: number): void;
  recordChordPractice(chordId: string, responseTimeMs: number, correct: boolean): void;
  recordWordPractice(word: string, correct: boolean): void;
  recordStreak(streak: number): void;
  recordMastery(type: 'character' | 'powerChord' | 'word'): void;
  recordChallengeComplete(type: 'timeAttack' | 'sprint', score: number, medal?: 'bronze' | 'silver' | 'gold'): void;
  recordCategoryPractice(category: string): void;
  recordPerfectSession(): void;
  checkTimeBasedAchievements(): void;
}

// ==================== Implementation ====================

export class AchievementService implements IAchievementService {
  private listeners: Set<AchievementListener> = new Set();
  private practicedFingers: Set<string> = new Set();
  private practicedCategories: Set<string> = new Set();

  constructor() {
    // Load persisted sets from metrics
    this.loadPersistedSets();
  }

  private loadPersistedSets(): void {
    const repo = getAchievementRepository();
    const metrics = repo.getMetrics();

    // Rebuild sets from stored counts
    // In a real app, you'd store the actual sets
    // For now, we just track via counts
  }

  // ==================== Achievement Checking ====================

  checkAchievements(): AchievementUnlockEvent[] {
    const repo = getAchievementRepository();
    const metrics = repo.getMetrics();
    const newlyUnlocked: AchievementUnlockEvent[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (repo.isUnlocked(achievement.id)) continue;

      const progress = this.calculateProgress(achievement, metrics);

      if (progress.percentage >= 1) {
        const unlock = repo.unlock(achievement.id, achievement.tier);
        const xpEarned = achievement.xpReward ?? getTierXp(achievement.tier);

        const event: AchievementUnlockEvent = {
          achievement,
          unlockedAt: unlock.unlockedAt,
          xpEarned,
          reward: achievement.reward,
        };

        newlyUnlocked.push(event);
        this.notifyListeners(event);
      }
    }

    return newlyUnlocked;
  }

  private calculateProgress(
    achievement: AchievementDefinition,
    metrics: AchievementMetrics
  ): AchievementProgress {
    const { criteria } = achievement;
    const repo = getAchievementRepository();

    let currentValue: number;
    const metricValue = metrics[criteria.metric as keyof AchievementMetrics];

    if (typeof metricValue === 'number') {
      currentValue = metricValue;
    } else {
      currentValue = 0;
    }

    // For time-based metrics (lower is better), invert the comparison
    let percentage: number;
    if (criteria.comparison === 'lte') {
      // For "fastest" metrics, check if current is at or below target
      if (currentValue === Infinity || currentValue === 0) {
        percentage = 0;
      } else {
        percentage = currentValue <= criteria.target ? 1 : 0;
      }
    } else {
      // Default: greater than or equal (count, streak)
      percentage = Math.min(currentValue / criteria.target, 1);
    }

    return {
      achievementId: achievement.id,
      definition: achievement,
      currentValue,
      targetValue: criteria.target,
      percentage,
      isUnlocked: repo.isUnlocked(achievement.id),
      unlockedAt: repo.getUnlockDate(achievement.id),
    };
  }

  // ==================== Progress Retrieval ====================

  getProgress(achievementId: string): AchievementProgress | null {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    const repo = getAchievementRepository();
    const metrics = repo.getMetrics();

    return this.calculateProgress(achievement, metrics);
  }

  getAllProgress(): AchievementProgress[] {
    const repo = getAchievementRepository();
    const metrics = repo.getMetrics();

    return ACHIEVEMENTS.map(achievement =>
      this.calculateProgress(achievement, metrics)
    );
  }

  getUnlockedAchievements(): UnlockedAchievement[] {
    return getAchievementRepository().getUnlocked();
  }

  getUnlockedCount(): number {
    return this.getUnlockedAchievements().length;
  }

  getTotalCount(): number {
    return ACHIEVEMENTS.length;
  }

  getTotalXp(): number {
    const unlocked = this.getUnlockedAchievements();
    return unlocked.reduce((total, unlock) => {
      const achievement = ACHIEVEMENTS.find(a => a.id === unlock.achievementId);
      if (!achievement) return total;
      return total + (achievement.xpReward ?? getTierXp(achievement.tier));
    }, 0);
  }

  // ==================== Rewards ====================

  getUnlockedRewards(): Reward[] {
    const unlocked = this.getUnlockedAchievements();
    const rewards: Reward[] = [];

    for (const unlock of unlocked) {
      const achievement = ACHIEVEMENTS.find(a => a.id === unlock.achievementId);
      if (achievement?.reward) {
        rewards.push(achievement.reward);
      }
    }

    return rewards;
  }

  isRewardUnlocked(rewardId: string): boolean {
    const rewards = this.getUnlockedRewards();
    return rewards.some(r => r.id === rewardId);
  }

  // ==================== Listeners ====================

  onAchievementUnlocked(callback: AchievementListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: AchievementUnlockEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in achievement listener:', error);
      }
    });
  }

  // ==================== Metric Recording Helpers ====================

  recordFingerPractice(fingerId: string, responseTimeMs: number): void {
    const repo = getAchievementRepository();

    repo.incrementMetric('fingers_practiced');

    if (!this.practicedFingers.has(fingerId)) {
      this.practicedFingers.add(fingerId);
      repo.incrementMetric('unique_fingers_practiced');
    }

    repo.updateMinMetric('fastest_finger_response', responseTimeMs);

    if (responseTimeMs < 500) {
      repo.incrementMetric('fast_responses');
    }

    // Record daily practice
    repo.recordDailyPractice();

    this.checkAchievements();
  }

  recordChordPractice(chordId: string, responseTimeMs: number, correct: boolean): void {
    const repo = getAchievementRepository();

    if (correct) {
      repo.incrementMetric('total_correct_chords');
      repo.updateMinMetric('fastest_chord_response', responseTimeMs);

      if (responseTimeMs < 500) {
        repo.incrementMetric('fast_responses');
      }
    }

    repo.recordDailyPractice();
    this.checkAchievements();
  }

  recordWordPractice(word: string, correct: boolean): void {
    const repo = getAchievementRepository();

    if (correct) {
      repo.incrementMetric('total_correct_words');
    }

    repo.recordDailyPractice();
    this.checkAchievements();
  }

  recordStreak(streak: number): void {
    const repo = getAchievementRepository();
    repo.updateMaxMetric('best_streak', streak);
    this.checkAchievements();
  }

  recordMastery(type: 'character' | 'powerChord' | 'word'): void {
    const repo = getAchievementRepository();

    switch (type) {
      case 'character':
        repo.incrementMetric('mastered_characters');
        break;
      case 'powerChord':
        repo.incrementMetric('mastered_power_chords');
        break;
      case 'word':
        repo.incrementMetric('mastered_words');
        break;
    }

    this.checkAchievements();
  }

  recordChallengeComplete(
    type: 'timeAttack' | 'sprint',
    score: number,
    medal?: 'bronze' | 'silver' | 'gold'
  ): void {
    const repo = getAchievementRepository();

    repo.incrementMetric('challenges_completed');

    if (type === 'timeAttack') {
      repo.incrementMetric('time_attacks_completed');
      repo.updateMaxMetric('best_time_attack_score', score);
    } else {
      repo.incrementMetric('sprints_completed');
    }

    if (medal) {
      repo.incrementMetric('total_medals');

      switch (medal) {
        case 'bronze':
          repo.incrementMetric('bronze_medals');
          break;
        case 'silver':
          repo.incrementMetric('silver_medals');
          break;
        case 'gold':
          repo.incrementMetric('gold_medals');
          break;
      }
    }

    repo.recordDailyPractice();
    this.checkAchievements();
  }

  recordCategoryPractice(category: string): void {
    const repo = getAchievementRepository();

    if (!this.practicedCategories.has(category)) {
      this.practicedCategories.add(category);
      repo.incrementMetric('categories_practiced');
      this.checkAchievements();
    }
  }

  recordPerfectSession(): void {
    const repo = getAchievementRepository();
    repo.incrementMetric('perfect_sessions');
    this.checkAchievements();
  }

  checkTimeBasedAchievements(): void {
    const now = new Date();
    const hour = now.getHours();
    const repo = getAchievementRepository();

    // Night owl: After midnight (0:00) but before 5:00
    if (hour >= 0 && hour < 5) {
      const current = repo.getMetric('practice_after_midnight');
      if (current === 0) {
        repo.setMetric('practice_after_midnight', 1);
        this.checkAchievements();
      }
    }

    // Early bird: Before 6:00 AM
    if (hour < 6) {
      const current = repo.getMetric('practice_before_6am');
      if (current === 0) {
        repo.setMetric('practice_before_6am', 1);
        this.checkAchievements();
      }
    }
  }
}

// ==================== Singleton ====================

let achievementServiceInstance: AchievementService | null = null;

export function getAchievementService(): AchievementService {
  if (!achievementServiceInstance) {
    achievementServiceInstance = new AchievementService();
  }
  return achievementServiceInstance;
}

export function resetAchievementService(): void {
  achievementServiceInstance = null;
}

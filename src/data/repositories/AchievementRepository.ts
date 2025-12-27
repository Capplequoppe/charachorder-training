/**
 * Achievement Repository
 *
 * Handles persistence of achievement unlocks, progress metrics, and statistics.
 */

import { storage } from '../storage';
import { type AchievementTier } from '@/data/static/achievements';

// ==================== Storage Keys ====================

const STORAGE_KEY_UNLOCKED = 'cc_achievements_unlocked';
const STORAGE_KEY_METRICS = 'cc_achievement_metrics';
const STORAGE_KEY_DAILY_STREAK = 'cc_daily_streak';

// ==================== Types ====================

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: Date;
  tier: AchievementTier;
}

export interface AchievementMetrics {
  // Progress metrics
  fingers_practiced: number;
  unique_fingers_practiced: number;
  total_correct_chords: number;
  total_correct_words: number;

  // Mastery metrics
  mastered_characters: number;
  mastered_power_chords: number;
  mastered_words: number;

  // Speed metrics
  fastest_finger_response: number;   // ms (lower is better)
  fastest_chord_response: number;    // ms
  best_time_attack_score: number;
  fast_responses: number;            // Count of sub-500ms responses

  // Medal counts
  bronze_medals: number;
  silver_medals: number;
  gold_medals: number;
  total_medals: number;

  // Consistency metrics
  best_streak: number;
  perfect_sessions: number;
  daily_streak: number;
  difficult_masteries: number;

  // Challenge metrics
  challenges_completed: number;
  time_attacks_completed: number;
  sprints_completed: number;

  // Exploration metrics
  categories_practiced: number;
  modes_tried: number;

  // Hidden/special metrics
  practice_after_midnight: number;
  practice_before_6am: number;

  // Timestamps
  last_practice_date: string | null;
}

export interface DailyStreakData {
  currentStreak: number;
  lastPracticeDate: string | null;
  longestStreak: number;
}

export interface IAchievementRepository {
  // Unlocked achievements
  getUnlocked(): UnlockedAchievement[];
  isUnlocked(achievementId: string): boolean;
  unlock(achievementId: string, tier: AchievementTier): UnlockedAchievement;
  getUnlockDate(achievementId: string): Date | null;

  // Metrics
  getMetrics(): AchievementMetrics;
  getMetric(key: keyof AchievementMetrics): number | string | null;
  setMetric(key: keyof AchievementMetrics, value: number | string | null): void;
  incrementMetric(key: keyof AchievementMetrics, amount?: number): number;
  updateMaxMetric(key: keyof AchievementMetrics, value: number): number;
  updateMinMetric(key: keyof AchievementMetrics, value: number): number;

  // Daily streak
  getDailyStreak(): DailyStreakData;
  recordDailyPractice(): DailyStreakData;

  // Reset
  clearAll(): void;
}

// ==================== Default Metrics ====================

function getDefaultMetrics(): AchievementMetrics {
  return {
    fingers_practiced: 0,
    unique_fingers_practiced: 0,
    total_correct_chords: 0,
    total_correct_words: 0,
    mastered_characters: 0,
    mastered_power_chords: 0,
    mastered_words: 0,
    fastest_finger_response: Infinity,
    fastest_chord_response: Infinity,
    best_time_attack_score: 0,
    fast_responses: 0,
    bronze_medals: 0,
    silver_medals: 0,
    gold_medals: 0,
    total_medals: 0,
    best_streak: 0,
    perfect_sessions: 0,
    daily_streak: 0,
    difficult_masteries: 0,
    challenges_completed: 0,
    time_attacks_completed: 0,
    sprints_completed: 0,
    categories_practiced: 0,
    modes_tried: 0,
    practice_after_midnight: 0,
    practice_before_6am: 0,
    last_practice_date: null,
  };
}

// ==================== Implementation ====================

export class AchievementRepository implements IAchievementRepository {
  // ==================== Unlocked Achievements ====================

  getUnlocked(): UnlockedAchievement[] {
    return storage.get<UnlockedAchievement[]>(STORAGE_KEY_UNLOCKED) ?? [];
  }

  isUnlocked(achievementId: string): boolean {
    const unlocked = this.getUnlocked();
    return unlocked.some(a => a.achievementId === achievementId);
  }

  unlock(achievementId: string, tier: AchievementTier): UnlockedAchievement {
    const unlocked = this.getUnlocked();

    // Check if already unlocked
    const existing = unlocked.find(a => a.achievementId === achievementId);
    if (existing) {
      return existing;
    }

    const newUnlock: UnlockedAchievement = {
      achievementId,
      unlockedAt: new Date(),
      tier,
    };

    unlocked.push(newUnlock);
    storage.set(STORAGE_KEY_UNLOCKED, unlocked);

    return newUnlock;
  }

  getUnlockDate(achievementId: string): Date | null {
    const unlocked = this.getUnlocked();
    const achievement = unlocked.find(a => a.achievementId === achievementId);
    return achievement?.unlockedAt ?? null;
  }

  // ==================== Metrics ====================

  getMetrics(): AchievementMetrics {
    const stored = storage.get<AchievementMetrics>(STORAGE_KEY_METRICS);
    return { ...getDefaultMetrics(), ...stored };
  }

  getMetric(key: keyof AchievementMetrics): number | string | null {
    const metrics = this.getMetrics();
    return metrics[key];
  }

  setMetric(key: keyof AchievementMetrics, value: number | string | null): void {
    const metrics = this.getMetrics();
    (metrics as unknown as Record<string, unknown>)[key] = value;
    storage.set(STORAGE_KEY_METRICS, metrics);
  }

  incrementMetric(key: keyof AchievementMetrics, amount: number = 1): number {
    const metrics = this.getMetrics();
    const currentValue = metrics[key];

    if (typeof currentValue !== 'number') {
      return 0;
    }

    const newValue = currentValue + amount;
    (metrics as unknown as Record<string, unknown>)[key] = newValue;
    storage.set(STORAGE_KEY_METRICS, metrics);

    return newValue;
  }

  updateMaxMetric(key: keyof AchievementMetrics, value: number): number {
    const metrics = this.getMetrics();
    const currentValue = metrics[key];

    if (typeof currentValue !== 'number') {
      return value;
    }

    const newValue = Math.max(currentValue, value);
    if (newValue !== currentValue) {
      (metrics as unknown as Record<string, unknown>)[key] = newValue;
      storage.set(STORAGE_KEY_METRICS, metrics);
    }

    return newValue;
  }

  updateMinMetric(key: keyof AchievementMetrics, value: number): number {
    const metrics = this.getMetrics();
    const currentValue = metrics[key];

    if (typeof currentValue !== 'number') {
      return value;
    }

    // Handle Infinity (initial state for "fastest" metrics)
    const newValue = currentValue === Infinity ? value : Math.min(currentValue, value);
    if (newValue !== currentValue) {
      (metrics as unknown as Record<string, unknown>)[key] = newValue;
      storage.set(STORAGE_KEY_METRICS, metrics);
    }

    return newValue;
  }

  // ==================== Daily Streak ====================

  getDailyStreak(): DailyStreakData {
    const stored = storage.get<DailyStreakData>(STORAGE_KEY_DAILY_STREAK);
    return stored ?? {
      currentStreak: 0,
      lastPracticeDate: null,
      longestStreak: 0,
    };
  }

  recordDailyPractice(): DailyStreakData {
    const data = this.getDailyStreak();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (data.lastPracticeDate === today) {
      // Already practiced today
      return data;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (data.lastPracticeDate === yesterdayStr) {
      // Continue streak
      data.currentStreak++;
    } else {
      // Streak broken or first practice
      data.currentStreak = 1;
    }

    data.lastPracticeDate = today;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);

    storage.set(STORAGE_KEY_DAILY_STREAK, data);

    // Also update the metric
    this.setMetric('daily_streak', data.currentStreak);
    this.setMetric('last_practice_date', today);

    return data;
  }

  // ==================== Reset ====================

  clearAll(): void {
    storage.remove(STORAGE_KEY_UNLOCKED);
    storage.remove(STORAGE_KEY_METRICS);
    storage.remove(STORAGE_KEY_DAILY_STREAK);
  }
}

// ==================== Singleton ====================

let achievementRepositoryInstance: AchievementRepository | null = null;

export function getAchievementRepository(): AchievementRepository {
  if (!achievementRepositoryInstance) {
    achievementRepositoryInstance = new AchievementRepository();
  }
  return achievementRepositoryInstance;
}

export function resetAchievementRepository(): void {
  achievementRepositoryInstance = null;
}

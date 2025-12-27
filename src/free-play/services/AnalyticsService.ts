/**
 * Analytics Service
 *
 * Aggregates learning data, generates trends, identifies weak areas,
 * and provides actionable insights for improvement.
 */

import type {
  DailyStats,
  WeeklyStats,
  MonthlyOverview,
  ItemType,
  ItemAnalytics,
  SkillAnalytics,
  SkillLevel,
  FingerHeatmapData,
  DistributionData,
  ProgressTrend,
  WpmTrend,
  AccuracyTrend,
  Insight,
  Recommendation,
  ProgressPoint,
} from '../data/models/Analytics';
import {
  createEmptyDailyStats,
  createEmptyWeeklyStats,
  createEmptyMonthlyOverview,
} from '../data/models/Analytics';
import type { IProgressRepository } from '../data/repositories';
import { getRepositories } from '../data/repositoryFactory';
import type { FingerId, LearningProgress } from '../domain';
import type { SemanticCategory } from '../data/static/semanticCategories';
import { getWordCategory, getCategoryDisplayName } from '../data/static/semanticCategories';
import { ALL_FINGER_IDS, MasteryLevel } from '../domain';

/**
 * Storage keys for analytics data.
 */
const ANALYTICS_STORAGE_KEYS = {
  DAILY_STATS: 'charachorder_daily_stats',
  ANALYTICS_HISTORY: 'charachorder_analytics_history',
};

/**
 * Interface for analytics service operations.
 */
export interface IAnalyticsService {
  // Daily/Weekly aggregations
  getDailyStats(date: Date): DailyStats;
  getWeeklyStats(weekStart: Date): WeeklyStats;
  getMonthlyOverview(month: Date): MonthlyOverview;

  // Record events
  recordPracticeEvent(
    itemType: ItemType,
    correct: boolean,
    responseTimeMs: number,
    wpm?: number
  ): void;
  recordSessionEnd(durationMs: number, itemsPracticed: number, wpm: number): void;

  // Item-level analytics
  getItemAnalytics(itemId: string, itemType: ItemType): ItemAnalytics;
  getTroubleItems(limit: number): ItemAnalytics[];
  getMasteredItems(itemType: ItemType): ItemAnalytics[];

  // Skill analysis
  getSkillAnalytics(): SkillAnalytics;
  getFingerHeatmap(): FingerHeatmapData;
  getResponseTimeDistribution(): DistributionData;

  // Trends
  getProgressTrend(days: number): ProgressTrend;
  getWpmTrend(days: number): WpmTrend;
  getAccuracyTrend(days: number): AccuracyTrend;

  // Insights
  generateInsights(): Insight[];
  getRecommendations(): Recommendation[];

  // Data management
  exportAnalytics(): string;
  resetAnalytics(): void;
}

/**
 * Get date string in YYYY-MM-DD format.
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get week start date (Monday).
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get month string in YYYY-MM format.
 */
function getMonthString(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/**
 * Analytics service implementation.
 */
export class AnalyticsService implements IAnalyticsService {
  private progressRepo: IProgressRepository;
  private dailyStatsCache: Map<string, DailyStats> = new Map();

  constructor(progressRepo: IProgressRepository) {
    this.progressRepo = progressRepo;
    this.loadDailyStatsCache();
  }

  private loadDailyStatsCache(): void {
    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEYS.DAILY_STATS);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, DailyStats>;
        for (const [date, stats] of Object.entries(data)) {
          this.dailyStatsCache.set(date, stats);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  private saveDailyStatsCache(): void {
    const data: Record<string, DailyStats> = {};
    // Keep last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = getDateString(cutoff);

    for (const [date, stats] of this.dailyStatsCache) {
      if (date >= cutoffStr) {
        data[date] = stats;
      }
    }
    localStorage.setItem(ANALYTICS_STORAGE_KEYS.DAILY_STATS, JSON.stringify(data));
  }

  // ==================== Recording Events ====================

  recordPracticeEvent(
    itemType: ItemType,
    correct: boolean,
    responseTimeMs: number,
    wpm?: number
  ): void {
    const today = getDateString(new Date());
    let stats = this.dailyStatsCache.get(today);

    if (!stats) {
      stats = createEmptyDailyStats(today);
    }

    stats.itemsPracticed++;
    if (correct) {
      stats.correctCount++;
    } else {
      stats.incorrectCount++;
    }

    // Update average response time
    const totalItems = stats.correctCount + stats.incorrectCount;
    stats.averageResponseTimeMs = Math.round(
      (stats.averageResponseTimeMs * (totalItems - 1) + responseTimeMs) / totalItems
    );

    // Update WPM if provided
    if (wpm !== undefined) {
      if (stats.wpmAverage === 0) {
        stats.wpmAverage = wpm;
      } else {
        stats.wpmAverage = Math.round((stats.wpmAverage + wpm) / 2);
      }
      if (wpm > stats.wpmPeak) {
        stats.wpmPeak = wpm;
      }
    }

    this.dailyStatsCache.set(today, stats);
    this.saveDailyStatsCache();
  }

  recordSessionEnd(durationMs: number, itemsPracticed: number, wpm: number): void {
    const today = getDateString(new Date());
    let stats = this.dailyStatsCache.get(today);

    if (!stats) {
      stats = createEmptyDailyStats(today);
    }

    stats.sessionsCount++;
    stats.totalPracticeTimeMs += durationMs;

    if (wpm > stats.wpmPeak) {
      stats.wpmPeak = wpm;
    }

    this.dailyStatsCache.set(today, stats);
    this.saveDailyStatsCache();
  }

  // ==================== Daily/Weekly/Monthly Stats ====================

  getDailyStats(date: Date): DailyStats {
    const dateStr = getDateString(date);
    const cached = this.dailyStatsCache.get(dateStr);
    if (cached) {
      return cached;
    }
    return createEmptyDailyStats(dateStr);
  }

  getWeeklyStats(weekStart: Date): WeeklyStats {
    const startStr = getDateString(getWeekStart(weekStart));
    const stats = createEmptyWeeklyStats(startStr);

    // Collect daily stats for the week
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dailyStats = this.getDailyStats(day);
      stats.dailyStats.push(dailyStats);

      stats.totalPracticeTimeMs += dailyStats.totalPracticeTimeMs;
      if (dailyStats.sessionsCount > 0) {
        stats.streakDays++;
      }
    }

    // Calculate averages
    const totalCorrect = stats.dailyStats.reduce((sum, d) => sum + d.correctCount, 0);
    const totalAttempts = stats.dailyStats.reduce(
      (sum, d) => sum + d.correctCount + d.incorrectCount,
      0
    );
    stats.averageAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    const wpmSum = stats.dailyStats.reduce((sum, d) => sum + d.wpmAverage, 0);
    const wpmCount = stats.dailyStats.filter((d) => d.wpmAverage > 0).length;
    stats.averageWpm = wpmCount > 0 ? Math.round(wpmSum / wpmCount) : 0;

    // Calculate improvement vs previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevStats = this.getWeeklyStatsInternal(prevWeekStart);

    if (prevStats.averageAccuracy > 0) {
      stats.improvementPercent = Math.round(
        ((stats.averageAccuracy - prevStats.averageAccuracy) / prevStats.averageAccuracy) * 100
      );
    }

    return stats;
  }

  private getWeeklyStatsInternal(weekStart: Date): WeeklyStats {
    const startStr = getDateString(getWeekStart(weekStart));
    const stats = createEmptyWeeklyStats(startStr);

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      stats.dailyStats.push(this.getDailyStats(day));
    }

    const totalCorrect = stats.dailyStats.reduce((sum, d) => sum + d.correctCount, 0);
    const totalAttempts = stats.dailyStats.reduce(
      (sum, d) => sum + d.correctCount + d.incorrectCount,
      0
    );
    stats.averageAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    return stats;
  }

  getMonthlyOverview(month: Date): MonthlyOverview {
    const monthStr = getMonthString(month);
    const overview = createEmptyMonthlyOverview(monthStr);

    // Get first day of month
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Collect weekly stats
    let currentWeek = getWeekStart(firstDay);
    while (currentWeek <= lastDay) {
      const weekStats = this.getWeeklyStats(currentWeek);
      overview.weeklyStats.push(weekStats);
      overview.totalPracticeTimeMs += weekStats.totalPracticeTimeMs;
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    // Calculate totals
    let totalCorrect = 0;
    let totalAttempts = 0;
    let wpmSum = 0;
    let wpmCount = 0;

    for (const week of overview.weeklyStats) {
      for (const day of week.dailyStats) {
        totalCorrect += day.correctCount;
        totalAttempts += day.correctCount + day.incorrectCount;
        overview.totalItemsPracticed += day.itemsPracticed;
        overview.itemsMastered += day.itemsMastered;

        if (day.wpmAverage > 0) {
          wpmSum += day.wpmAverage;
          wpmCount++;
        }

        // Track best day
        if (!overview.bestDay || day.itemsPracticed > overview.bestDay.itemsPracticed) {
          overview.bestDay = day;
        }
      }
    }

    overview.averageAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
    overview.averageWpm = wpmCount > 0 ? Math.round(wpmSum / wpmCount) : 0;

    return overview;
  }

  // ==================== Item Analytics ====================

  getItemAnalytics(itemId: string, itemType: ItemType): ItemAnalytics {
    let progress: LearningProgress | null = null;

    switch (itemType) {
      case 'finger':
        progress = this.progressRepo.getCharacterProgress(itemId) ?? null;
        break;
      case 'powerChord':
        progress = this.progressRepo.getPowerChordProgress(itemId) ?? null;
        break;
      case 'word':
        progress = this.progressRepo.getWordProgress(itemId) ?? null;
        break;
    }

    if (!progress) {
      return {
        itemId,
        itemType,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageResponseTimeMs: 0,
        responseTimeTrend: [],
        lastAttemptDate: null,
        masteryLevel: 0,
        troubleScore: 0,
      };
    }

    const accuracy = progress.accuracy;

    // Calculate trouble score: low accuracy + many attempts = high trouble
    const troubleScore = progress.totalAttempts > 0
      ? Math.round((1 - accuracy) * 100 * Math.min(progress.totalAttempts / 10, 2))
      : 0;

    // Calculate mastery level (0-100)
    const masteryLevel = this.calculateMasteryScore(progress);

    return {
      itemId,
      itemType,
      totalAttempts: progress.totalAttempts,
      correctAttempts: progress.correctAttempts,
      accuracy,
      averageResponseTimeMs: progress.averageResponseTimeMs,
      responseTimeTrend: [], // Would need historical data to populate
      lastAttemptDate: progress.lastAttemptDate,
      masteryLevel,
      troubleScore,
    };
  }

  private calculateMasteryScore(progress: LearningProgress): number {
    // Weight factors
    const accuracyWeight = 0.4;
    const speedWeight = 0.2;
    const repetitionsWeight = 0.2;
    const masteryWeight = 0.2;

    const accuracy = progress.accuracy;

    // Speed score: faster is better (max at 500ms response time)
    const speedScore =
      progress.averageResponseTimeMs > 0
        ? Math.max(0, 1 - progress.averageResponseTimeMs / 2000)
        : 0;

    // Repetitions score: more is better (max at 50 reps)
    const repetitionsScore = Math.min(progress.repetitions / 50, 1);

    // Mastery level score
    const masteryLevelScore = (() => {
      switch (progress.masteryLevel) {
        case MasteryLevel.MASTERED:
          return 1;
        case MasteryLevel.FAMILIAR:
          return 0.75;
        case MasteryLevel.LEARNING:
          return 0.5;
        case MasteryLevel.NEW:
        default:
          return 0.25;
      }
    })();

    return Math.round(
      (accuracy * accuracyWeight +
        speedScore * speedWeight +
        repetitionsScore * repetitionsWeight +
        masteryLevelScore * masteryWeight) *
        100
    );
  }

  getTroubleItems(limit: number): ItemAnalytics[] {
    const allItems: ItemAnalytics[] = [];

    // Get all character progress
    for (const progress of this.progressRepo.getAllCharacterProgress()) {
      if (progress.totalAttempts >= 5) {
        allItems.push(this.getItemAnalytics(progress.itemId, 'finger'));
      }
    }

    // Get all word progress
    for (const progress of this.progressRepo.getAllWordProgress()) {
      if (progress.totalAttempts >= 3) {
        allItems.push(this.getItemAnalytics(progress.itemId, 'word'));
      }
    }

    // Get all power chord progress
    for (const progress of this.progressRepo.getAllPowerChordProgress()) {
      if (progress.totalAttempts >= 3) {
        allItems.push(this.getItemAnalytics(progress.itemId, 'powerChord'));
      }
    }

    // Sort by trouble score descending
    allItems.sort((a, b) => b.troubleScore - a.troubleScore);

    return allItems.slice(0, limit);
  }

  getMasteredItems(itemType: ItemType): ItemAnalytics[] {
    const items: ItemAnalytics[] = [];

    switch (itemType) {
      case 'finger':
        for (const progress of this.progressRepo.getAllCharacterProgress()) {
          if (progress.masteryLevel === MasteryLevel.MASTERED) {
            items.push(this.getItemAnalytics(progress.itemId, 'finger'));
          }
        }
        break;
      case 'word':
        for (const progress of this.progressRepo.getAllWordProgress()) {
          if (progress.masteryLevel === MasteryLevel.MASTERED) {
            items.push(this.getItemAnalytics(progress.itemId, 'word'));
          }
        }
        break;
      case 'powerChord':
        for (const progress of this.progressRepo.getAllPowerChordProgress()) {
          if (progress.masteryLevel === MasteryLevel.MASTERED) {
            items.push(this.getItemAnalytics(progress.itemId, 'powerChord'));
          }
        }
        break;
    }

    return items;
  }

  // ==================== Skill Analytics ====================

  getSkillAnalytics(): SkillAnalytics {
    const fingerSkills: Partial<Record<FingerId, SkillLevel>> = {};
    const powerChordSkills: Record<string, SkillLevel> = {};
    const categorySkills: Partial<Record<SemanticCategory, SkillLevel>> = {};
    const categoryAttempts: Partial<Record<SemanticCategory, { correct: number; total: number }>> =
      {};

    // Calculate finger skills from character progress
    const fingerAttempts: Partial<Record<FingerId, { correct: number; total: number }>> = {};

    for (const progress of this.progressRepo.getAllCharacterProgress()) {
      const fingerId = progress.itemId.split('_')[0] as FingerId;
      if (!fingerAttempts[fingerId]) {
        fingerAttempts[fingerId] = { correct: 0, total: 0 };
      }
      fingerAttempts[fingerId].correct += progress.correctAttempts;
      fingerAttempts[fingerId].total += progress.totalAttempts;
    }

    for (const fingerId of ALL_FINGER_IDS) {
      const attempts = fingerAttempts[fingerId];
      if (attempts && attempts.total > 0) {
        const accuracy = attempts.correct / attempts.total;
        fingerSkills[fingerId] = {
          level: Math.round(accuracy * 100),
          trend: 'stable',
          lastUpdated: new Date(),
        };
      }
    }

    // Calculate word category skills
    for (const progress of this.progressRepo.getAllWordProgress()) {
      const category = getWordCategory(progress.itemId);
      if (category) {
        if (!categoryAttempts[category]) {
          categoryAttempts[category] = { correct: 0, total: 0 };
        }
        categoryAttempts[category].correct += progress.correctAttempts;
        categoryAttempts[category].total += progress.totalAttempts;
      }
    }

    for (const [category, attempts] of Object.entries(categoryAttempts)) {
      if (attempts && attempts.total > 0) {
        const accuracy = attempts.correct / attempts.total;
        categorySkills[category as SemanticCategory] = {
          level: Math.round(accuracy * 100),
          trend: 'stable',
          lastUpdated: new Date(),
        };
      }
    }

    // Calculate power chord skills
    for (const progress of this.progressRepo.getAllPowerChordProgress()) {
      if (progress.totalAttempts > 0) {
        powerChordSkills[progress.itemId] = {
          level: Math.round(progress.accuracy * 100),
          trend: 'stable',
          lastUpdated: new Date(),
        };
      }
    }

    // Calculate overall level
    const allLevels = [
      ...Object.values(fingerSkills).map((s) => s.level),
      ...Object.values(categorySkills).map((s) => s.level),
      ...Object.values(powerChordSkills).map((s) => s.level),
    ];
    const overallLevel =
      allLevels.length > 0
        ? Math.round(allLevels.reduce((a, b) => a + b, 0) / allLevels.length)
        : 0;

    // Find strongest and weakest areas
    const areas: Array<{ name: string; level: number }> = [];

    for (const [fingerId, skill] of Object.entries(fingerSkills)) {
      areas.push({ name: `${fingerId} finger`, level: skill.level });
    }
    for (const [category, skill] of Object.entries(categorySkills)) {
      areas.push({ name: getCategoryDisplayName(category as SemanticCategory), level: skill.level });
    }

    areas.sort((a, b) => b.level - a.level);
    const strongestAreas = areas.slice(0, 3).map((a) => a.name);
    const weakestAreas = areas
      .slice(-3)
      .reverse()
      .map((a) => a.name);

    return {
      fingerSkills,
      powerChordSkills,
      categorySkills,
      overallLevel,
      strongestAreas,
      weakestAreas,
    };
  }

  getFingerHeatmap(): FingerHeatmapData {
    const heatmap: FingerHeatmapData = {};

    // Aggregate by finger
    const fingerData: Record<
      string,
      { correct: number; total: number; totalTime: number; timeCount: number }
    > = {};

    for (const progress of this.progressRepo.getAllCharacterProgress()) {
      // Extract finger from character config or use first part of itemId
      const fingerId = progress.itemId.includes('_')
        ? progress.itemId.split('_')[0]
        : progress.itemId;

      if (!fingerData[fingerId]) {
        fingerData[fingerId] = { correct: 0, total: 0, totalTime: 0, timeCount: 0 };
      }
      fingerData[fingerId].correct += progress.correctAttempts;
      fingerData[fingerId].total += progress.totalAttempts;
      if (progress.averageResponseTimeMs > 0) {
        fingerData[fingerId].totalTime += progress.averageResponseTimeMs;
        fingerData[fingerId].timeCount++;
      }
    }

    for (const [fingerId, data] of Object.entries(fingerData)) {
      heatmap[fingerId] = {
        accuracy: data.total > 0 ? data.correct / data.total : 0,
        averageResponseTimeMs: data.timeCount > 0 ? Math.round(data.totalTime / data.timeCount) : 0,
        totalAttempts: data.total,
      };
    }

    return heatmap;
  }

  getResponseTimeDistribution(): DistributionData {
    const responseTimes: number[] = [];

    // Collect all response times
    for (const progress of this.progressRepo.getAllCharacterProgress()) {
      if (progress.averageResponseTimeMs > 0) {
        responseTimes.push(progress.averageResponseTimeMs);
      }
    }
    for (const progress of this.progressRepo.getAllWordProgress()) {
      if (progress.averageResponseTimeMs > 0) {
        responseTimes.push(progress.averageResponseTimeMs);
      }
    }

    if (responseTimes.length === 0) {
      return {
        labels: [],
        values: [],
        mean: 0,
        median: 0,
        stdDev: 0,
      };
    }

    // Create buckets (0-500, 500-1000, 1000-1500, 1500-2000, 2000+)
    const buckets = [0, 0, 0, 0, 0];
    const labels = ['0-500ms', '500-1000ms', '1000-1500ms', '1500-2000ms', '2000+ms'];

    for (const time of responseTimes) {
      if (time < 500) buckets[0]++;
      else if (time < 1000) buckets[1]++;
      else if (time < 1500) buckets[2]++;
      else if (time < 2000) buckets[3]++;
      else buckets[4]++;
    }

    // Calculate statistics
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance =
      responseTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);

    return {
      labels,
      values: buckets,
      mean: Math.round(mean),
      median: Math.round(median),
      stdDev: Math.round(stdDev),
    };
  }

  // ==================== Trends ====================

  getProgressTrend(days: number): ProgressTrend {
    const points: ProgressPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const stats = this.getDailyStats(date);

      const totalAttempts = stats.correctCount + stats.incorrectCount;
      points.push({
        date,
        accuracy: totalAttempts > 0 ? stats.correctCount / totalAttempts : 0,
        wpm: stats.wpmAverage,
        itemsPracticed: stats.itemsPracticed,
      });
    }

    // Calculate changes
    const firstHalf = points.slice(0, Math.floor(days / 2));
    const secondHalf = points.slice(Math.floor(days / 2));

    const firstAccuracy =
      firstHalf.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(firstHalf.length, 1);
    const secondAccuracy =
      secondHalf.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(secondHalf.length, 1);

    const firstWpm = firstHalf.reduce((sum, p) => sum + p.wpm, 0) / Math.max(firstHalf.length, 1);
    const secondWpm = secondHalf.reduce((sum, p) => sum + p.wpm, 0) / Math.max(secondHalf.length, 1);

    return {
      points,
      periodDays: days,
      accuracyChange: secondAccuracy - firstAccuracy,
      wpmChange: secondWpm - firstWpm,
    };
  }

  getWpmTrend(days: number): WpmTrend {
    const points: Array<{ date: Date; wpm: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const stats = this.getDailyStats(date);
      points.push({ date, wpm: stats.wpmAverage });
    }

    const halfPoint = Math.floor(days / 2);
    const previousPoints = points.slice(0, halfPoint).filter((p) => p.wpm > 0);
    const currentPoints = points.slice(halfPoint).filter((p) => p.wpm > 0);

    const previousAverage =
      previousPoints.length > 0
        ? previousPoints.reduce((sum, p) => sum + p.wpm, 0) / previousPoints.length
        : 0;
    const currentAverage =
      currentPoints.length > 0
        ? currentPoints.reduce((sum, p) => sum + p.wpm, 0) / currentPoints.length
        : 0;

    const changePercent =
      previousAverage > 0
        ? Math.round(((currentAverage - previousAverage) / previousAverage) * 100)
        : 0;

    const peakWpm = Math.max(...points.map((p) => p.wpm), 0);

    return {
      points,
      currentAverage: Math.round(currentAverage),
      previousAverage: Math.round(previousAverage),
      changePercent,
      peakWpm,
    };
  }

  getAccuracyTrend(days: number): AccuracyTrend {
    const points: Array<{ date: Date; accuracy: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const stats = this.getDailyStats(date);
      const totalAttempts = stats.correctCount + stats.incorrectCount;
      points.push({
        date,
        accuracy: totalAttempts > 0 ? stats.correctCount / totalAttempts : 0,
      });
    }

    const halfPoint = Math.floor(days / 2);
    const previousPoints = points.slice(0, halfPoint).filter((p) => p.accuracy > 0);
    const currentPoints = points.slice(halfPoint).filter((p) => p.accuracy > 0);

    const previousAverage =
      previousPoints.length > 0
        ? previousPoints.reduce((sum, p) => sum + p.accuracy, 0) / previousPoints.length
        : 0;
    const currentAverage =
      currentPoints.length > 0
        ? currentPoints.reduce((sum, p) => sum + p.accuracy, 0) / currentPoints.length
        : 0;

    const changePercent =
      previousAverage > 0
        ? Math.round(((currentAverage - previousAverage) / previousAverage) * 100)
        : 0;

    return {
      points,
      currentAverage,
      previousAverage,
      changePercent,
    };
  }

  // ==================== Insights & Recommendations ====================

  generateInsights(): Insight[] {
    const insights: Insight[] = [];
    const weeklyStats = this.getWeeklyStats(getWeekStart(new Date()));
    const troubleItems = this.getTroubleItems(10);
    const skillAnalytics = this.getSkillAnalytics();

    // Improvement insight
    if (weeklyStats.improvementPercent > 10) {
      insights.push({
        id: 'weekly-improvement',
        type: 'achievement',
        title: 'Great Progress!',
        message: `Your accuracy improved ${weeklyStats.improvementPercent}% this week!`,
        priority: 1,
        actionable: false,
      });
    } else if (weeklyStats.improvementPercent < -10) {
      insights.push({
        id: 'weekly-decline',
        type: 'warning',
        title: 'Accuracy Dip',
        message: `Your accuracy dropped ${Math.abs(weeklyStats.improvementPercent)}% this week. Consider focusing on problem areas.`,
        priority: 2,
        actionable: true,
        action: {
          label: 'View Problem Areas',
          href: '#trouble-items',
        },
      });
    }

    // Streak insight
    if (weeklyStats.streakDays >= 7) {
      insights.push({
        id: 'streak-week',
        type: 'achievement',
        title: 'Week Streak!',
        message: `You've practiced every day this week! Keep it up!`,
        priority: 2,
        actionable: false,
      });
    } else if (weeklyStats.streakDays === 0) {
      insights.push({
        id: 'no-practice',
        type: 'tip',
        title: 'Start Practicing',
        message: 'You haven\'t practiced yet this week. Even 5 minutes helps build muscle memory!',
        priority: 3,
        actionable: true,
        action: {
          label: 'Start Practice',
          href: '/practice',
        },
      });
    }

    // Trouble item insight
    if (troubleItems.length > 0 && troubleItems[0].troubleScore > 50) {
      const worstItem = troubleItems[0];
      insights.push({
        id: 'trouble-item',
        type: 'warning',
        title: 'Needs Attention',
        message: `"${worstItem.itemId}" has ${Math.round(worstItem.accuracy * 100)}% accuracy. Focused practice could help.`,
        priority: 3,
        actionable: true,
        action: {
          label: 'Practice This',
          href: `#practice-${worstItem.itemId}`,
        },
      });
    }

    // Weak area tip
    if (skillAnalytics.weakestAreas.length > 0) {
      insights.push({
        id: 'weak-area-tip',
        type: 'tip',
        title: 'Focus Suggestion',
        message: `Your ${skillAnalytics.weakestAreas[0]} skills could use more practice.`,
        priority: 4,
        actionable: true,
        action: {
          label: 'Start Practice',
          href: '/practice',
        },
      });
    }

    // WPM milestone check
    const wpmTrend = this.getWpmTrend(7);
    if (wpmTrend.currentAverage >= 60 && wpmTrend.previousAverage < 60) {
      insights.push({
        id: 'wpm-milestone-60',
        type: 'achievement',
        title: 'Speed Milestone!',
        message: 'You\'ve reached 60 WPM average - above average typist level!',
        priority: 1,
        actionable: false,
      });
    } else if (wpmTrend.currentAverage >= 80 && wpmTrend.previousAverage < 80) {
      insights.push({
        id: 'wpm-milestone-80',
        type: 'achievement',
        title: 'Speed Milestone!',
        message: 'You\'ve reached 80 WPM average - professional level!',
        priority: 1,
        actionable: false,
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  getRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const troubleItems = this.getTroubleItems(5);
    const skillAnalytics = this.getSkillAnalytics();

    // Recommend practicing trouble items
    if (troubleItems.length > 0) {
      const topTrouble = troubleItems.slice(0, 3);
      recommendations.push({
        id: 'practice-trouble',
        title: 'Practice Problem Items',
        description: `Focus on: ${topTrouble.map((t) => t.itemId).join(', ')}`,
        reason: `These items have the lowest accuracy in your practice history.`,
        priority: 'high',
        link: '/practice',
      });
    }

    // Recommend practicing weak categories
    if (skillAnalytics.weakestAreas.length > 0) {
      recommendations.push({
        id: 'practice-weak-category',
        title: `Practice ${skillAnalytics.weakestAreas[0]}`,
        description: `Focus on improving your ${skillAnalytics.weakestAreas[0]} skills.`,
        reason: 'This is your weakest skill area based on recent practice.',
        priority: 'medium',
        link: '/practice',
      });
    }

    // General recommendation based on overall level
    if (skillAnalytics.overallLevel < 50) {
      recommendations.push({
        id: 'basics-practice',
        title: 'Master the Basics',
        description: 'Focus on character recognition and basic chords before advancing.',
        reason: 'Building a strong foundation will accelerate your learning.',
        priority: 'high',
        link: '/learn',
      });
    } else if (skillAnalytics.overallLevel >= 75) {
      recommendations.push({
        id: 'advanced-practice',
        title: 'Try Advanced Challenges',
        description: 'You\'re ready for timed challenges and transcription exercises.',
        reason: 'Your fundamentals are strong - time to push your speed!',
        priority: 'medium',
        link: '/challenges',
      });
    }

    return recommendations;
  }

  // ==================== Data Management ====================

  exportAnalytics(): string {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      dailyStats: Object.fromEntries(this.dailyStatsCache),
    };
    return JSON.stringify(data, null, 2);
  }

  resetAnalytics(): void {
    this.dailyStatsCache.clear();
    localStorage.removeItem(ANALYTICS_STORAGE_KEYS.DAILY_STATS);
    localStorage.removeItem(ANALYTICS_STORAGE_KEYS.ANALYTICS_HISTORY);
  }
}

// ==================== Singleton Instance ====================

let analyticsServiceInstance: AnalyticsService | null = null;

/**
 * Gets the analytics service singleton instance.
 * Auto-initializes with default repositories if not already initialized.
 */
export function getAnalyticsService(progressRepo?: IProgressRepository): AnalyticsService {
  if (!analyticsServiceInstance) {
    const repo = progressRepo ?? getRepositories().progress;
    analyticsServiceInstance = new AnalyticsService(repo);
  }
  return analyticsServiceInstance;
}

/**
 * Resets the analytics service singleton (for testing).
 */
export function resetAnalyticsService(): void {
  analyticsServiceInstance = null;
}

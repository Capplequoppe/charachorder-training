/**
 * Analytics Data Models
 *
 * Defines data structures for tracking learning progress,
 * identifying weak areas, and providing actionable insights.
 */

import type { FingerId } from '../../domain';
import type { SemanticCategory } from '../static/semanticCategories';

/**
 * Daily statistics aggregation.
 */
export interface DailyStats {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Total practice time in milliseconds */
  totalPracticeTimeMs: number;
  /** Number of practice sessions */
  sessionsCount: number;
  /** Number of items practiced */
  itemsPracticed: number;
  /** Number of correct answers */
  correctCount: number;
  /** Number of incorrect answers */
  incorrectCount: number;
  /** Average response time in ms */
  averageResponseTimeMs: number;
  /** New items learned this day */
  newItemsLearned: number;
  /** Items that reached mastery */
  itemsMastered: number;
  /** Best streak achieved this day */
  bestStreak: number;
  /** Average WPM for the day */
  wpmAverage: number;
  /** Peak WPM achieved */
  wpmPeak: number;
}

/**
 * Weekly statistics aggregation.
 */
export interface WeeklyStats {
  /** Start of week (ISO date string) */
  weekStart: string;
  /** Daily stats for each day */
  dailyStats: DailyStats[];
  /** Total practice time for the week */
  totalPracticeTimeMs: number;
  /** Average accuracy for the week (0-1) */
  averageAccuracy: number;
  /** Average WPM for the week */
  averageWpm: number;
  /** Improvement vs previous week (-100 to +100) */
  improvementPercent: number;
  /** Consecutive days practiced this week */
  streakDays: number;
}

/**
 * Monthly overview aggregation.
 */
export interface MonthlyOverview {
  /** Month (YYYY-MM) */
  month: string;
  /** Weekly stats for each week */
  weeklyStats: WeeklyStats[];
  /** Total practice time for the month */
  totalPracticeTimeMs: number;
  /** Average accuracy for the month (0-1) */
  averageAccuracy: number;
  /** Average WPM for the month */
  averageWpm: number;
  /** Total items practiced */
  totalItemsPracticed: number;
  /** Items mastered this month */
  itemsMastered: number;
  /** Best day of the month */
  bestDay: DailyStats | null;
}

/**
 * Item type for analytics.
 */
export type ItemType = 'finger' | 'powerChord' | 'word';

/**
 * Analytics for a specific learning item.
 */
export interface ItemAnalytics {
  /** Item identifier */
  itemId: string;
  /** Type of item */
  itemType: ItemType;
  /** Total attempt count */
  totalAttempts: number;
  /** Correct attempt count */
  correctAttempts: number;
  /** Accuracy (0-1) */
  accuracy: number;
  /** Average response time in ms */
  averageResponseTimeMs: number;
  /** Response time trend (last 10 attempts) */
  responseTimeTrend: number[];
  /** When last attempted */
  lastAttemptDate: Date | null;
  /** Current mastery level (0-100) */
  masteryLevel: number;
  /** Trouble score (higher = needs more practice) */
  troubleScore: number;
}

/**
 * Trend direction for skill level.
 */
export type SkillTrend = 'improving' | 'stable' | 'declining';

/**
 * Skill level for a specific area.
 */
export interface SkillLevel {
  /** Level 0-100 */
  level: number;
  /** Trend direction */
  trend: SkillTrend;
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Overall skill analytics breakdown.
 */
export interface SkillAnalytics {
  /** Per-finger skill levels */
  fingerSkills: Partial<Record<FingerId, SkillLevel>>;
  /** Per-power chord skill levels */
  powerChordSkills: Record<string, SkillLevel>;
  /** Per-category skill levels */
  categorySkills: Partial<Record<SemanticCategory, SkillLevel>>;
  /** Overall level (0-100) */
  overallLevel: number;
  /** Top 3 strongest areas */
  strongestAreas: string[];
  /** Top 3 weakest areas */
  weakestAreas: string[];
}

/**
 * Finger heatmap data for visualization.
 */
export interface FingerHeatmapData {
  [fingerId: string]: {
    accuracy: number;
    averageResponseTimeMs: number;
    totalAttempts: number;
  };
}

/**
 * Distribution data for histograms.
 */
export interface DistributionData {
  /** Bucket labels */
  labels: string[];
  /** Count in each bucket */
  values: number[];
  /** Mean value */
  mean: number;
  /** Median value */
  median: number;
  /** Standard deviation */
  stdDev: number;
}

/**
 * Data point for progress trends.
 */
export interface ProgressPoint {
  /** Date of data point */
  date: Date;
  /** Accuracy (0-1) */
  accuracy: number;
  /** WPM */
  wpm: number;
  /** Items practiced */
  itemsPracticed: number;
}

/**
 * Progress trend over time.
 */
export interface ProgressTrend {
  /** Data points */
  points: ProgressPoint[];
  /** Period in days */
  periodDays: number;
  /** Overall accuracy change */
  accuracyChange: number;
  /** Overall WPM change */
  wpmChange: number;
}

/**
 * WPM-specific trend data.
 */
export interface WpmTrend {
  /** Data points with date and WPM */
  points: Array<{ date: Date; wpm: number }>;
  /** Current average */
  currentAverage: number;
  /** Previous period average */
  previousAverage: number;
  /** Change percentage */
  changePercent: number;
  /** Peak WPM in period */
  peakWpm: number;
}

/**
 * Accuracy-specific trend data.
 */
export interface AccuracyTrend {
  /** Data points with date and accuracy */
  points: Array<{ date: Date; accuracy: number }>;
  /** Current average */
  currentAverage: number;
  /** Previous period average */
  previousAverage: number;
  /** Change percentage */
  changePercent: number;
}

/**
 * Insight type categories.
 */
export type InsightType = 'achievement' | 'improvement' | 'warning' | 'tip';

/**
 * Actionable insight for the user.
 */
export interface Insight {
  /** Unique identifier */
  id: string;
  /** Insight type */
  type: InsightType;
  /** Short title */
  title: string;
  /** Detailed message */
  message: string;
  /** Priority (lower = more important) */
  priority: number;
  /** Whether action can be taken */
  actionable: boolean;
  /** Optional action */
  action?: {
    label: string;
    href: string;
  };
}

/**
 * Recommendation priority levels.
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Practice recommendation.
 */
export interface Recommendation {
  /** Unique identifier */
  id: string;
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Why this is recommended */
  reason: string;
  /** Priority level */
  priority: RecommendationPriority;
  /** Link to practice */
  link: string;
}

/**
 * Create empty daily stats.
 */
export function createEmptyDailyStats(date: string): DailyStats {
  return {
    date,
    totalPracticeTimeMs: 0,
    sessionsCount: 0,
    itemsPracticed: 0,
    correctCount: 0,
    incorrectCount: 0,
    averageResponseTimeMs: 0,
    newItemsLearned: 0,
    itemsMastered: 0,
    bestStreak: 0,
    wpmAverage: 0,
    wpmPeak: 0,
  };
}

/**
 * Create empty weekly stats.
 */
export function createEmptyWeeklyStats(weekStart: string): WeeklyStats {
  return {
    weekStart,
    dailyStats: [],
    totalPracticeTimeMs: 0,
    averageAccuracy: 0,
    averageWpm: 0,
    improvementPercent: 0,
    streakDays: 0,
  };
}

/**
 * Create empty monthly overview.
 */
export function createEmptyMonthlyOverview(month: string): MonthlyOverview {
  return {
    month,
    weeklyStats: [],
    totalPracticeTimeMs: 0,
    averageAccuracy: 0,
    averageWpm: 0,
    totalItemsPracticed: 0,
    itemsMastered: 0,
    bestDay: null,
  };
}

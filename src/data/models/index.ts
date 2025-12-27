/**
 * Data Models
 *
 * TypeScript interfaces and types for application data structures.
 */

export type {
  DailyStats,
  WeeklyStats,
  MonthlyOverview,
  ItemType,
  ItemAnalytics,
  SkillTrend,
  SkillLevel,
  SkillAnalytics,
  FingerHeatmapData,
  DistributionData,
  ProgressPoint,
  ProgressTrend,
  WpmTrend,
  AccuracyTrend,
  InsightType,
  Insight,
  RecommendationPriority,
  Recommendation,
} from './Analytics';

export {
  createEmptyDailyStats,
  createEmptyWeeklyStats,
  createEmptyMonthlyOverview,
} from './Analytics';

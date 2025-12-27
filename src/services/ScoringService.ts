/**
 * Scoring Service
 *
 * Handles score calculations for speed challenges including
 * speed bonuses, streak bonuses, and accuracy multipliers.
 */

import { SCORING_CONFIG, type Difficulty, type Medal, type SprintConfig } from '@/data/static/challengeConfig';

// ==================== Types ====================

export interface ScoreCalculation {
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  accuracyMultiplier: number;
  difficultyMultiplier: number;
  totalPoints: number;
}

export interface ScoreBreakdown {
  itemScores: ScoreCalculation[];
  totalScore: number;
  averageScore: number;
  bonusPoints: number;
}

// ==================== Quiz Scoring Types ====================

/**
 * Input for quiz score calculation.
 */
export interface QuizScoreInput {
  /** Response time in milliseconds */
  timeMs: number;
  /** Number of attempts (1 = first try) */
  attempts: number;
  /** Maximum allowed attempts */
  maxAttempts: number;
  /** Time limit in milliseconds */
  timeLimitMs: number;
  /** Whether the answer was correct */
  correct: boolean;
}

/**
 * Breakdown of quiz score components.
 */
export interface QuizScoreBreakdown {
  baseScore: number;
  attemptPenalty: number;
  timeBonus: number;
  quickAnswerBonus: number;
  totalScore: number;
}

export interface IScoringService {
  // Speed challenge scoring
  calculateItemScore(
    responseTimeMs: number,
    currentStreak: number,
    sessionAccuracy: number,
    difficulty: Difficulty
  ): ScoreCalculation;

  calculateSpeedBonus(responseTimeMs: number): number;
  calculateStreakBonus(basePoints: number, streak: number): number;
  calculateAccuracyMultiplier(accuracy: number): number;
  getDifficultyMultiplier(difficulty: Difficulty): number;

  getMedalForTime(timeSeconds: number, config: SprintConfig): Medal;
  getScoreRating(score: number, maxPossible: number): 'excellent' | 'good' | 'fair' | 'poor';

  // Quiz scoring
  /**
   * Calculate quiz score with attempt penalties and time bonuses.
   * Returns 0 if answer was incorrect.
   */
  calculateQuizScore(input: QuizScoreInput): number;

  /**
   * Get detailed breakdown of quiz score calculation.
   */
  getQuizScoreBreakdown(input: QuizScoreInput): QuizScoreBreakdown;

  /**
   * Get quick answer bonus based on response time.
   */
  getQuickAnswerBonus(timeMs: number): number;
}

// ==================== Implementation ====================

export class ScoringService implements IScoringService {
  /**
   * Calculate score for a single item response
   */
  calculateItemScore(
    responseTimeMs: number,
    currentStreak: number,
    sessionAccuracy: number,
    difficulty: Difficulty
  ): ScoreCalculation {
    const config = SCORING_CONFIG;
    const basePoints = config.basePointsPerItem;

    // Speed bonus: faster responses = more points
    const speedBonus = this.calculateSpeedBonus(responseTimeMs);

    // Streak bonus: consecutive correct answers
    const streakBonus = this.calculateStreakBonus(basePoints, currentStreak);

    // Accuracy multiplier
    const accuracyMultiplier = this.calculateAccuracyMultiplier(sessionAccuracy);

    // Difficulty multiplier
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    // Calculate total
    const totalPoints = Math.floor(
      (basePoints + speedBonus + streakBonus) * accuracyMultiplier * difficultyMultiplier
    );

    return {
      basePoints,
      speedBonus,
      streakBonus,
      accuracyMultiplier,
      difficultyMultiplier,
      totalPoints,
    };
  }

  /**
   * Calculate speed bonus based on response time
   * Faster responses earn more points
   */
  calculateSpeedBonus(responseTimeMs: number): number {
    const config = SCORING_CONFIG;
    const { maxSpeedBonusMs, minSpeedBonusMs, speedBonusMultiplier, basePointsPerItem } = config;

    // Clamp response time to valid range
    const clampedTime = Math.max(maxSpeedBonusMs, Math.min(minSpeedBonusMs, responseTimeMs));

    // Linear interpolation: max bonus at maxSpeedBonusMs, 0 at minSpeedBonusMs
    const speedFactor = (minSpeedBonusMs - clampedTime) / (minSpeedBonusMs - maxSpeedBonusMs);

    return Math.floor(basePointsPerItem * speedFactor * speedBonusMultiplier);
  }

  /**
   * Calculate streak bonus based on consecutive correct answers
   */
  calculateStreakBonus(basePoints: number, streak: number): number {
    const config = SCORING_CONFIG;
    const { streakBonusPerItem, maxStreakBonus } = config;

    // Cap the streak multiplier at max
    const streakMultiplier = Math.min(streak * streakBonusPerItem, maxStreakBonus);

    return Math.floor(basePoints * streakMultiplier);
  }

  /**
   * Calculate accuracy multiplier based on session accuracy
   */
  calculateAccuracyMultiplier(accuracy: number): number {
    const config = SCORING_CONFIG;
    const { minAccuracyMultiplier, maxAccuracyMultiplier } = config;

    // Clamp accuracy to 0-1
    const clampedAccuracy = Math.max(0, Math.min(1, accuracy));

    // Linear interpolation between min and max
    return minAccuracyMultiplier + (clampedAccuracy * (maxAccuracyMultiplier - minAccuracyMultiplier));
  }

  /**
   * Get difficulty multiplier
   */
  getDifficultyMultiplier(difficulty: Difficulty): number {
    return SCORING_CONFIG.difficultyMultipliers[difficulty];
  }

  /**
   * Determine medal for sprint time
   */
  getMedalForTime(timeSeconds: number, config: SprintConfig): Medal {
    if (timeSeconds <= config.goldTime) return 'gold';
    if (timeSeconds <= config.silverTime) return 'silver';
    if (timeSeconds <= config.bronzeTime) return 'bronze';
    return 'none';
  }

  /**
   * Get rating category for score
   */
  getScoreRating(score: number, maxPossible: number): 'excellent' | 'good' | 'fair' | 'poor' {
    const percentage = score / maxPossible;

    if (percentage >= 0.9) return 'excellent';
    if (percentage >= 0.7) return 'good';
    if (percentage >= 0.5) return 'fair';
    return 'poor';
  }

  // ==================== Quiz Scoring ====================

  /** Quiz scoring constants */
  private static readonly QUIZ_BASE_SCORE = 100;
  private static readonly QUIZ_MAX_TIME_BONUS = 50;
  private static readonly QUIZ_MAX_ATTEMPT_PENALTY = 60;
  private static readonly QUICK_ANSWER_THRESHOLDS = [
    { maxMs: 2000, bonus: 30 },
    { maxMs: 5000, bonus: 15 },
    { maxMs: 10000, bonus: 5 },
  ];

  /**
   * Calculate quiz score with attempt penalties and time bonuses.
   * Returns 0 if answer was incorrect.
   */
  calculateQuizScore(input: QuizScoreInput): number {
    if (!input.correct) {
      return 0;
    }
    return this.getQuizScoreBreakdown(input).totalScore;
  }

  /**
   * Get detailed breakdown of quiz score calculation.
   *
   * Scoring formula:
   * - Base score: 100 points
   * - Attempt penalty: (attempts - 1) * (60 / maxAttempts)
   * - Time bonus: up to 50 points based on response speed
   * - Quick answer bonus: 30/15/5 points for <2s/<5s/<10s responses
   */
  getQuizScoreBreakdown(input: QuizScoreInput): QuizScoreBreakdown {
    const baseScore = ScoringService.QUIZ_BASE_SCORE;

    // Attempt penalty: lose points for extra attempts
    const penaltyPerAttempt = ScoringService.QUIZ_MAX_ATTEMPT_PENALTY / input.maxAttempts;
    const attemptPenalty = Math.floor((input.attempts - 1) * penaltyPerAttempt);

    // Time bonus: faster responses earn more points
    const timeRatio = 1 - Math.min(1, input.timeMs / input.timeLimitMs);
    const timeBonus = Math.floor(ScoringService.QUIZ_MAX_TIME_BONUS * timeRatio);

    // Quick answer bonus: extra points for very fast responses
    const quickAnswerBonus = this.getQuickAnswerBonus(input.timeMs);

    // Calculate total (minimum 0)
    const totalScore = input.correct
      ? Math.max(0, baseScore - attemptPenalty + timeBonus + quickAnswerBonus)
      : 0;

    return {
      baseScore,
      attemptPenalty,
      timeBonus,
      quickAnswerBonus,
      totalScore,
    };
  }

  /**
   * Get quick answer bonus based on response time.
   * - <2s: 30 points
   * - <5s: 15 points
   * - <10s: 5 points
   * - >=10s: 0 points
   */
  getQuickAnswerBonus(timeMs: number): number {
    for (const { maxMs, bonus } of ScoringService.QUICK_ANSWER_THRESHOLDS) {
      if (timeMs < maxMs) {
        return bonus;
      }
    }
    return 0;
  }
}

// ==================== Singleton ====================

let scoringServiceInstance: ScoringService | null = null;

export function getScoringService(): ScoringService {
  if (!scoringServiceInstance) {
    scoringServiceInstance = new ScoringService();
  }
  return scoringServiceInstance;
}

export function resetScoringService(): void {
  scoringServiceInstance = null;
}

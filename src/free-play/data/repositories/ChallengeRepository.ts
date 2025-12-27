/**
 * Challenge Repository
 *
 * Handles persistence of challenge results, personal bests, and history.
 */

import { storage } from '@/data/storage';
import { type ChallengeResult } from '@/free-play/services/ChallengeService';
import { type Medal } from '@/data/static/challengeConfig';

// ==================== Storage Keys ====================

const STORAGE_KEY_PERSONAL_BESTS = 'cc_challenge_personal_bests';
const STORAGE_KEY_CHALLENGE_HISTORY = 'cc_challenge_history';
const MAX_HISTORY_PER_CHALLENGE = 50;

// ==================== Types ====================

export interface PersonalBest {
  challengeId: string;
  score: number;
  timeMs: number;
  accuracy: number;
  bestStreak: number;
  medal: Medal;
  achievedAt: Date;
}

export interface ChallengeHistoryEntry {
  result: ChallengeResult;
  timestamp: Date;
}

export interface IChallengeRepository {
  getPersonalBest(challengeId: string): PersonalBest | null;
  setPersonalBest(challengeId: string, result: ChallengeResult): boolean;
  getAllPersonalBests(): Record<string, PersonalBest>;

  getChallengeHistory(challengeId: string, limit?: number): ChallengeHistoryEntry[];
  addToHistory(result: ChallengeResult): void;
  getRecentChallenges(limit: number): ChallengeHistoryEntry[];

  getTotalChallengesCompleted(): number;
  getTotalScore(): number;
  getAverageAccuracy(): number;

  clearHistory(): void;
  clearPersonalBests(): void;
}

// ==================== Implementation ====================

export class ChallengeRepository implements IChallengeRepository {
  /**
   * Get personal best for a specific challenge
   */
  getPersonalBest(challengeId: string): PersonalBest | null {
    const bests = this.getAllPersonalBests();
    return bests[challengeId] ?? null;
  }

  /**
   * Set personal best if the result beats the current best
   * Returns true if it's a new personal best
   */
  setPersonalBest(challengeId: string, result: ChallengeResult): boolean {
    const currentBest = this.getPersonalBest(challengeId);

    // Check if this is a new personal best
    const isNewBest = this.isNewPersonalBest(currentBest, result);

    if (isNewBest) {
      const bests = this.getAllPersonalBests();
      bests[challengeId] = {
        challengeId,
        score: result.finalScore,
        timeMs: result.totalTimeMs,
        accuracy: result.accuracy,
        bestStreak: result.bestStreak,
        medal: result.medal,
        achievedAt: result.completedAt,
      };
      storage.set(STORAGE_KEY_PERSONAL_BESTS, bests);
    }

    return isNewBest;
  }

  /**
   * Get all personal bests
   */
  getAllPersonalBests(): Record<string, PersonalBest> {
    return storage.get<Record<string, PersonalBest>>(STORAGE_KEY_PERSONAL_BESTS) ?? {};
  }

  /**
   * Get challenge history for a specific challenge
   */
  getChallengeHistory(challengeId: string, limit?: number): ChallengeHistoryEntry[] {
    const allHistory = this.getAllHistory();
    const filtered = allHistory.filter(h => h.result.challengeId === challengeId);

    if (limit) {
      return filtered.slice(0, limit);
    }
    return filtered;
  }

  /**
   * Add a result to history
   */
  addToHistory(result: ChallengeResult): void {
    const history = this.getAllHistory();

    const entry: ChallengeHistoryEntry = {
      result,
      timestamp: new Date(),
    };

    // Add to beginning (most recent first)
    history.unshift(entry);

    // Trim per-challenge history to max size
    const challengeHistory = history.filter(h => h.result.challengeId === result.challengeId);
    if (challengeHistory.length > MAX_HISTORY_PER_CHALLENGE) {
      // Find and remove oldest entries for this challenge
      const toRemove = challengeHistory.slice(MAX_HISTORY_PER_CHALLENGE);
      const filteredHistory = history.filter(h =>
        h.result.challengeId !== result.challengeId ||
        !toRemove.includes(h)
      );
      storage.set(STORAGE_KEY_CHALLENGE_HISTORY, filteredHistory);
    } else {
      storage.set(STORAGE_KEY_CHALLENGE_HISTORY, history);
    }
  }

  /**
   * Get recent challenges across all types
   */
  getRecentChallenges(limit: number): ChallengeHistoryEntry[] {
    const history = this.getAllHistory();
    return history.slice(0, limit);
  }

  /**
   * Get total number of challenges completed
   */
  getTotalChallengesCompleted(): number {
    return this.getAllHistory().length;
  }

  /**
   * Get total score across all challenges
   */
  getTotalScore(): number {
    const history = this.getAllHistory();
    return history.reduce((sum, h) => sum + h.result.finalScore, 0);
  }

  /**
   * Get average accuracy across all challenges
   */
  getAverageAccuracy(): number {
    const history = this.getAllHistory();
    if (history.length === 0) return 0;

    const totalAccuracy = history.reduce((sum, h) => sum + h.result.accuracy, 0);
    return totalAccuracy / history.length;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    storage.remove(STORAGE_KEY_CHALLENGE_HISTORY);
  }

  /**
   * Clear all personal bests
   */
  clearPersonalBests(): void {
    storage.remove(STORAGE_KEY_PERSONAL_BESTS);
  }

  // ==================== Private Methods ====================

  /**
   * Get all history entries
   */
  private getAllHistory(): ChallengeHistoryEntry[] {
    return storage.get<ChallengeHistoryEntry[]>(STORAGE_KEY_CHALLENGE_HISTORY) ?? [];
  }

  /**
   * Determine if a result is a new personal best
   */
  private isNewPersonalBest(currentBest: PersonalBest | null, result: ChallengeResult): boolean {
    if (!currentBest) return true;

    // For time attack: higher score is better
    if (result.type === 'timeAttack') {
      return result.finalScore > currentBest.score;
    }

    // For sprint: faster time is better (with same or better accuracy)
    if (result.type === 'sprint') {
      // Better medal always wins
      const medalRank = { 'none': 0, 'bronze': 1, 'silver': 2, 'gold': 3 };
      if (medalRank[result.medal] > medalRank[currentBest.medal]) {
        return true;
      }

      // Same medal: faster time wins
      if (medalRank[result.medal] === medalRank[currentBest.medal]) {
        return result.totalTimeMs < currentBest.timeMs;
      }
    }

    return false;
  }
}

// ==================== Singleton ====================

let challengeRepositoryInstance: ChallengeRepository | null = null;

export function getChallengeRepository(): ChallengeRepository {
  if (!challengeRepositoryInstance) {
    challengeRepositoryInstance = new ChallengeRepository();
  }
  return challengeRepositoryInstance;
}

export function resetChallengeRepository(): void {
  challengeRepositoryInstance = null;
}

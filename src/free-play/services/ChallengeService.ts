/**
 * Challenge Service
 *
 * Manages speed challenge sessions including Time Attack and Sprint modes.
 * Handles session lifecycle, item generation, and result calculation.
 */

import { getRepositories } from '@/data';
import { type Finger, type FingerId, type PowerChord, Direction } from '@/domain';
import {
  type TimeAttackConfig,
  type SprintConfig,
  type ChallengeType,
  type ItemType,
  type Medal,
  getMedalForTime,
} from '@/data/static/challengeConfig';
import { getScoringService, type ScoreCalculation } from '@/services/ScoringService';

// ==================== Types ====================

export interface ChallengeItem {
  id: string;
  type: ItemType;
  prompt: string;           // What to display to the user
  expectedAnswer: string;   // What the user should type
  finger?: Finger;          // For finger challenges
  powerChord?: PowerChord;  // For power chord challenges
  word?: string;            // For word challenges
  responseTimeMs: number | null;
  isCorrect: boolean | null;
  attemptedAt: Date | null;
  score: ScoreCalculation | null;
}

export interface ChallengeSession {
  id: string;
  type: ChallengeType;
  config: TimeAttackConfig | SprintConfig;
  startTime: Date;
  endTime: Date | null;
  items: ChallengeItem[];
  currentIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  bestStreak: number;
  currentStreak: number;
  timeRemainingMs: number;  // For time attack
  isPaused: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  score: ScoreCalculation;
  bonusTime: number;        // Time added (positive) or subtracted (negative)
  streakBroken: boolean;
  newStreak: number;
  isComplete: boolean;
}

export interface ChallengeResult {
  sessionId: string;
  challengeId: string;
  type: ChallengeType;
  finalScore: number;
  totalTimeMs: number;
  accuracy: number;
  averageResponseTimeMs: number;
  correctCount: number;
  wrongCount: number;
  totalItems: number;
  bestStreak: number;
  medal: Medal;
  isPersonalBest: boolean;
  completedAt: Date;
}

export interface IChallengeService {
  startTimeAttack(config: TimeAttackConfig): ChallengeSession;
  startSprint(config: SprintConfig): ChallengeSession;
  getSession(sessionId: string): ChallengeSession | null;
  getCurrentItem(sessionId: string): ChallengeItem | null;
  submitAnswer(sessionId: string, answer: string): AnswerResult;
  skipItem(sessionId: string): void;
  getTimeRemaining(sessionId: string): number;
  updateTime(sessionId: string, deltaMs: number): void;
  endChallenge(sessionId: string): ChallengeResult;
  isComplete(sessionId: string): boolean;
}

// ==================== Implementation ====================

export class ChallengeService implements IChallengeService {
  private sessions: Map<string, ChallengeSession> = new Map();
  private sessionCounter = 0;

  /**
   * Start a Time Attack challenge
   */
  startTimeAttack(config: TimeAttackConfig): ChallengeSession {
    const sessionId = this.generateSessionId();
    const items = this.generateItems(config.itemType, 100); // Generate plenty of items

    const session: ChallengeSession = {
      id: sessionId,
      type: 'timeAttack',
      config,
      startTime: new Date(),
      endTime: null,
      items,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      bestStreak: 0,
      currentStreak: 0,
      timeRemainingMs: config.duration * 1000,
      isPaused: false,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Start a Sprint challenge
   */
  startSprint(config: SprintConfig): ChallengeSession {
    const sessionId = this.generateSessionId();
    const items = this.generateItems(config.itemType, config.itemCount);

    const session: ChallengeSession = {
      id: sessionId,
      type: 'sprint',
      config,
      startTime: new Date(),
      endTime: null,
      items,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      bestStreak: 0,
      currentStreak: 0,
      timeRemainingMs: Infinity, // Sprint has no time limit
      isPaused: false,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): ChallengeSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Get the current item for a session
   */
  getCurrentItem(sessionId: string): ChallengeItem | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.currentIndex >= session.items.length) {
      return null;
    }
    return session.items[session.currentIndex];
  }

  /**
   * Submit an answer for the current item
   */
  submitAnswer(sessionId: string, answer: string): AnswerResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const currentItem = session.items[session.currentIndex];
    if (!currentItem) {
      throw new Error('No current item');
    }

    const now = new Date();
    const responseTimeMs = currentItem.attemptedAt
      ? now.getTime() - currentItem.attemptedAt.getTime()
      : now.getTime() - session.startTime.getTime();

    // Check answer - case-insensitive, trim whitespace
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedExpected = currentItem.expectedAnswer.trim().toLowerCase();

    // For power chord items, also accept chorded word output from CharaChorder
    let isCorrect = normalizedAnswer === normalizedExpected;
    if (!isCorrect && currentItem.type === 'powerChord' && currentItem.powerChord) {
      const validWords = currentItem.powerChord.producesWords.map(w => w.toLowerCase());
      const chars = currentItem.powerChord.characters.map(c => c.char.toLowerCase());
      // Accept: raw chars in any order (e.g., "ou" or "uo"), or any word the chord produces
      const rawCharsMatch = normalizedAnswer.length === 2 &&
        chars.every(c => normalizedAnswer.includes(c));
      const chordedWordMatch = validWords.includes(normalizedAnswer);
      isCorrect = rawCharsMatch || chordedWordMatch;
    }

    // Calculate score
    const scoringService = getScoringService();
    const accuracy = session.correctCount / Math.max(1, session.correctCount + session.wrongCount);
    const config = session.config;
    const difficulty = config.difficulty;

    const score = isCorrect
      ? scoringService.calculateItemScore(
          responseTimeMs,
          session.currentStreak,
          accuracy,
          difficulty
        )
      : { basePoints: 0, speedBonus: 0, streakBonus: 0, accuracyMultiplier: 0, difficultyMultiplier: 1, totalPoints: 0 };

    // Update item
    currentItem.responseTimeMs = responseTimeMs;
    currentItem.isCorrect = isCorrect;
    currentItem.attemptedAt = now;
    currentItem.score = score;

    // Update session stats
    let bonusTime = 0;
    let streakBroken = false;

    if (isCorrect) {
      session.correctCount++;
      session.currentStreak++;
      session.score += score.totalPoints;

      if (session.currentStreak > session.bestStreak) {
        session.bestStreak = session.currentStreak;
      }

      // Time attack bonus time
      if (session.type === 'timeAttack') {
        const taConfig = config as TimeAttackConfig;
        bonusTime = taConfig.bonusTimeOnCorrect * 1000;
        session.timeRemainingMs += bonusTime;
      }
    } else {
      session.wrongCount++;
      streakBroken = session.currentStreak > 0;
      session.currentStreak = 0;

      // Time attack penalty
      if (session.type === 'timeAttack') {
        const taConfig = config as TimeAttackConfig;
        bonusTime = -taConfig.penaltyOnWrong * 1000;
        session.timeRemainingMs = Math.max(0, session.timeRemainingMs + bonusTime);
      }
    }

    // Move to next item
    session.currentIndex++;

    // Check if complete
    const isComplete = this.isComplete(sessionId);

    return {
      isCorrect,
      score,
      bonusTime,
      streakBroken,
      newStreak: session.currentStreak,
      isComplete,
    };
  }

  /**
   * Skip the current item (counts as wrong)
   */
  skipItem(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const currentItem = session.items[session.currentIndex];
    if (currentItem) {
      currentItem.isCorrect = false;
      currentItem.attemptedAt = new Date();
      session.wrongCount++;
      session.currentStreak = 0;
    }

    session.currentIndex++;
  }

  /**
   * Get time remaining in milliseconds
   */
  getTimeRemaining(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    return Math.max(0, session.timeRemainingMs);
  }

  /**
   * Update time remaining (called by timer)
   */
  updateTime(sessionId: string, deltaMs: number): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.isPaused) return;

    if (session.type === 'timeAttack') {
      session.timeRemainingMs = Math.max(0, session.timeRemainingMs - deltaMs);
    }
  }

  /**
   * Check if challenge is complete
   */
  isComplete(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;

    if (session.type === 'timeAttack') {
      return session.timeRemainingMs <= 0;
    }

    // Sprint: complete when all items are done
    const sprintConfig = session.config as SprintConfig;
    return session.currentIndex >= sprintConfig.itemCount;
  }

  /**
   * End the challenge and get results
   */
  endChallenge(sessionId: string): ChallengeResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.endTime = new Date();
    const totalTimeMs = session.endTime.getTime() - session.startTime.getTime();

    // Calculate average response time for correct answers
    const correctItems = session.items.filter(i => i.isCorrect === true);
    const averageResponseTimeMs = correctItems.length > 0
      ? correctItems.reduce((sum, i) => sum + (i.responseTimeMs ?? 0), 0) / correctItems.length
      : 0;

    // Calculate accuracy
    const totalAnswered = session.correctCount + session.wrongCount;
    const accuracy = totalAnswered > 0 ? session.correctCount / totalAnswered : 0;

    // Determine medal (for sprint)
    let medal: Medal = 'none';
    if (session.type === 'sprint') {
      const sprintConfig = session.config as SprintConfig;
      const totalTimeSeconds = totalTimeMs / 1000;
      medal = getMedalForTime(totalTimeSeconds, sprintConfig);
    }

    const result: ChallengeResult = {
      sessionId: session.id,
      challengeId: session.config.id,
      type: session.type,
      finalScore: session.score,
      totalTimeMs,
      accuracy,
      averageResponseTimeMs,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      totalItems: totalAnswered,
      bestStreak: session.bestStreak,
      medal,
      isPersonalBest: false, // Set by repository
      completedAt: session.endTime,
    };

    return result;
  }

  /**
   * Generate challenge items based on type
   */
  private generateItems(itemType: ItemType, count: number): ChallengeItem[] {
    switch (itemType) {
      case 'finger':
        return this.generateFingerItems(count);
      case 'powerChord':
        return this.generatePowerChordItems(count);
      case 'word':
        return this.generateWordItems(count);
    }
  }

  /**
   * Generate finger challenge items
   */
  private generateFingerItems(count: number): ChallengeItem[] {
    const repos = getRepositories();
    const characters = repos.characters.getAll();
    const items: ChallengeItem[] = [];

    // Shuffle and repeat as needed
    const shuffled = this.shuffleArray([...characters]);

    for (let i = 0; i < count; i++) {
      const char = shuffled[i % shuffled.length];
      const finger = repos.fingers.getById(char.fingerId);

      if (!finger) continue;

      // Use the character's direction for the challenge
      items.push({
        id: `finger-${i}`,
        type: 'finger',
        prompt: `${finger.displayName} - ${char.direction.toUpperCase()}`,
        expectedAnswer: char.char,
        finger,
        responseTimeMs: null,
        isCorrect: null,
        attemptedAt: null,
        score: null,
      });
    }

    return this.shuffleArray(items);
  }

  /**
   * Generate power chord challenge items
   */
  private generatePowerChordItems(count: number): ChallengeItem[] {
    const repos = getRepositories();
    const powerChords = repos.powerChords.getAll();
    const items: ChallengeItem[] = [];

    const shuffled = this.shuffleArray([...powerChords]);

    for (let i = 0; i < count; i++) {
      const pc = shuffled[i % shuffled.length];

      items.push({
        id: `powerchord-${i}`,
        type: 'powerChord',
        prompt: pc.characters.map(c => c.displayChar.toUpperCase()).join(' + '),
        expectedAnswer: pc.id,
        powerChord: pc,
        responseTimeMs: null,
        isCorrect: null,
        attemptedAt: null,
        score: null,
      });
    }

    return this.shuffleArray(items);
  }

  /**
   * Generate word challenge items
   */
  private generateWordItems(count: number): ChallengeItem[] {
    const repos = getRepositories();
    const words = repos.words.getAll();
    const items: ChallengeItem[] = [];

    // Prioritize shorter, more common words
    const sorted = [...words].sort((a, b) => {
      // Sort by rank (lower = more common)
      const rankA = a.rank ?? 999;
      const rankB = b.rank ?? 999;
      return rankA - rankB;
    });

    const shuffled = this.shuffleArray(sorted.slice(0, Math.min(200, sorted.length)));

    for (let i = 0; i < count; i++) {
      const wordEntry = shuffled[i % shuffled.length];

      items.push({
        id: `word-${i}`,
        type: 'word',
        prompt: wordEntry.word.toUpperCase(),
        expectedAnswer: wordEntry.word.toLowerCase(),
        word: wordEntry.word,
        responseTimeMs: null,
        isCorrect: null,
        attemptedAt: null,
        score: null,
      });
    }

    return items;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `challenge-${Date.now()}-${++this.sessionCounter}`;
  }
}

// ==================== Singleton ====================

let challengeServiceInstance: ChallengeService | null = null;

export function getChallengeService(): ChallengeService {
  if (!challengeServiceInstance) {
    challengeServiceInstance = new ChallengeService();
  }
  return challengeServiceInstance;
}

export function resetChallengeService(): void {
  challengeServiceInstance = null;
}

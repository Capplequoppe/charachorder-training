/**
 * Progress Service
 *
 * Coordinates progress tracking, statistics, and session management.
 * Implements comprehensive metrics at character, finger, direction, and session levels.
 */

import {
  FingerId,
  Direction,
  LearningProgress,
  LearningItemType,
  MasteryLevel,
} from '../domain';
import { IProgressRepository, ICharacterRepository } from '../data/repositories';
import { LearningStage, LearningService, QualityRating } from './LearningService';
import { getConfidenceLevelFromMetrics } from '../data/static/learningConfig';

/**
 * Overall progress summary.
 */
export interface OverallProgress {
  totalPracticeTimeMs: number;
  sessionsCompleted: number;
  charactersLearned: number;
  charactersMastered: number;
  powerChordsLearned: number;
  powerChordsMastered: number;
  wordsLearned: number;
  wordsMastered: number;
  currentStage: LearningStage;
  stagesCompleted: LearningStage[];
  averageAccuracy: number;
  averageWpm: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Progress for a specific finger.
 */
export interface FingerProgress {
  fingerId: FingerId;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  confidenceLevel: 'weak' | 'moderate' | 'strong';
  weakestDirection: Direction | null;
  averageResponseTimeMs: number;
}

/**
 * Progress for a specific direction of a finger.
 */
export interface DirectionProgress {
  direction: Direction;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageResponseTimeMs: number;
}

/**
 * Record of an attempt for progress tracking.
 */
export interface AttemptRecord {
  /** ID of the item attempted */
  itemId: string;
  /** Type of item */
  itemType: LearningItemType;
  /** Whether the attempt was correct */
  correct: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** When the attempt occurred */
  timestamp: Date;
  /** Direction (for characters) */
  direction?: Direction;
  /** Number of attempts before correct (for multi-attempt questions) */
  attempts?: number;
  /** Skip mastery level updates (for learning/intro phases) */
  skipMasteryUpdate?: boolean;
}

/**
 * Active session record.
 */
export interface SessionRecord {
  /** Unique session ID */
  id: string;
  /** Session type */
  type: 'learn' | 'review' | 'quiz' | 'challenge';
  /** When session started */
  startTime: Date;
  /** When session ended (null if active) */
  endTime: Date | null;
  /** Number of items attempted */
  itemsAttempted: number;
  /** Number of items correct */
  itemsCorrect: number;
  /** Calculated accuracy */
  accuracy: number;
  /** Average response time */
  averageResponseTimeMs: number;
  /** Session score */
  score: number;
}

/**
 * Global statistics.
 */
export interface GlobalStats {
  /** Total completed sessions */
  totalSessions: number;
  /** Total attempts across all items */
  totalAttempts: number;
  /** Total correct answers */
  totalCorrect: number;
  /** Total practice time in ms */
  totalPracticeTimeMs: number;
  /** Characters that have been practiced */
  charactersLearned: number;
  /** Power chords that have been practiced */
  powerChordsLearned: number;
  /** Words that have been practiced */
  wordsLearned: number;
  /** Current learning stage */
  currentStage: LearningStage;
  /** Current streak (consecutive days) */
  currentStreak: number;
  /** Longest streak ever */
  longestStreak: number;
  /** Last practice date (as Date object) */
  lastPracticeDate: Date | null;
  /** Last session date (ISO date string YYYY-MM-DD for streak calculation) */
  lastSessionDate: string;
  /** Average accuracy (0-1) */
  averageAccuracy: number;
  /** Average words per minute */
  averageWpm: number;
  /** Best WPM achieved */
  bestWpm: number;
}

/**
 * Interface for progress service operations.
 */
export interface IProgressService {
  // Generic attempt recording
  recordAttempt(record: AttemptRecord): void;

  // Typed attempt recording (convenience methods)
  recordCharacterAttempt(
    char: string,
    correct: boolean,
    timeMs: number,
    direction: Direction,
    skipMasteryUpdate?: boolean
  ): void;
  recordPowerChordAttempt(id: string, correct: boolean, timeMs: number, skipMasteryUpdate?: boolean): void;
  recordWordAttempt(
    word: string,
    correct: boolean,
    timeMs: number,
    attempts: number,
    skipMasteryUpdate?: boolean
  ): void;

  // Progress queries
  getOverallProgress(): OverallProgress;
  getFingerProgress(fingerId: FingerId): FingerProgress;
  getAllFingerProgress(): FingerProgress[];
  getDirectionProgress(fingerId: FingerId, direction: Direction): DirectionProgress;
  getGlobalStats(): GlobalStats;

  // Session tracking
  startSession(type: SessionRecord['type']): string;
  endSession(sessionId: string): SessionRecord;
  getCurrentSession(): SessionRecord | null;
  getSessionHistory(limit?: number): SessionRecord[];

  // Streaks
  recordPracticeSession(): void;
  getCurrentStreak(): number;
  getLongestStreak(): number;

  // Export/Import
  exportProgress(): string;
  importProgress(json: string): boolean;

  // Reset
  resetAllProgress(): void;
  resetProgressForStage(stage: LearningStage): void;

  // Mastery transitions
  transitionFromNewToLearning(itemId: string, itemType: LearningItemType): void;
}

/**
 * Storage keys for progress data.
 */
const STORAGE_KEYS = {
  ACTIVE_SESSION: 'charachorder_active_session',
  SESSION_HISTORY: 'charachorder_session_history',
  FINGER_PROGRESS: 'charachorder_finger_progress',
  GLOBAL_STATS: 'charachorder_global_stats',
};

/**
 * Progress service implementation.
 */
export class ProgressService implements IProgressService {
  private progressRepo: IProgressRepository;
  private characterRepo: ICharacterRepository | null = null;
  private learningService: LearningService;
  private currentSessionId: string | null = null;
  private fingerProgressCache: Map<FingerId, FingerProgress> = new Map();

  constructor(
    progressRepo: IProgressRepository,
    learningService: LearningService,
    characterRepo?: ICharacterRepository
  ) {
    this.progressRepo = progressRepo;
    this.learningService = learningService;
    this.characterRepo = characterRepo ?? null;
    this.loadFingerProgressCache();
  }

  /**
   * Sets the character repository (for dependency injection).
   */
  setCharacterRepository(repo: ICharacterRepository): void {
    this.characterRepo = repo;
  }

  private loadFingerProgressCache(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FINGER_PROGRESS);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, FingerProgress>;
        for (const [fingerId, progress] of Object.entries(data)) {
          this.fingerProgressCache.set(fingerId as FingerId, progress);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  private saveFingerProgressCache(): void {
    const data: Record<string, FingerProgress> = {};
    for (const [fingerId, progress] of this.fingerProgressCache) {
      data[fingerId] = progress;
    }
    localStorage.setItem(STORAGE_KEYS.FINGER_PROGRESS, JSON.stringify(data));
  }

  // ==================== Recording Results ====================

  /**
   * Records an attempt using the generic AttemptRecord interface.
   * This is the core recording method that all others delegate to.
   */
  recordAttempt(record: AttemptRecord): void {
    switch (record.itemType) {
      case 'character':
        this.recordCharacterAttemptInternal(record);
        break;
      case 'powerChord':
        this.recordPowerChordAttemptInternal(record);
        break;
      case 'word':
        this.recordWordAttemptInternal(record);
        break;
    }

    // Update active session if one exists
    this.updateActiveSession(record);

    // Update global stats
    this.updateGlobalStats(record);
  }

  recordCharacterAttempt(
    char: string,
    correct: boolean,
    timeMs: number,
    direction: Direction,
    skipMasteryUpdate?: boolean
  ): void {
    this.recordAttempt({
      itemId: char,
      itemType: 'character',
      correct,
      responseTimeMs: timeMs,
      timestamp: new Date(),
      direction,
      skipMasteryUpdate,
    });
  }

  private recordCharacterAttemptInternal(record: AttemptRecord): void {
    const progress = this.progressRepo.getOrCreate(record.itemId, 'character');

    // Update direction confidence if direction provided (always track this for practice purposes)
    if (record.direction && progress.directionConfidence) {
      this.updateDirectionConfidence(progress, record.direction, record.correct, record.responseTimeMs);
    }

    // Skip mastery updates during learning phase (only count basic stats, not recentAttempts)
    // This prevents learning mode attempts from counting towards mastery calculation
    if (record.skipMasteryUpdate) {
      // Only update basic cumulative stats, don't touch recentAttempts or mastery level
      progress.totalAttempts++;
      progress.lastAttemptDate = record.timestamp;
      if (record.correct) {
        progress.correctAttempts++;
        progress.lastCorrectDate = record.timestamp;
      }
      // Note: averageResponseTimeMs is NOT updated here because it's based on rolling window
      // and learning mode attempts don't go into recentAttempts
      this.progressRepo.saveCharacterProgress(progress, true); // Skip mastery update in repository
      this.updateFingerProgress(record);
      return;
    }

    // Full recording: update recentAttempts and mastery level
    progress.recordAttempt(record.correct, record.responseTimeMs);
    progress.lastAttemptDate = record.timestamp;

    // Calculate quality for SRS
    const quality = this.learningService.getQualityFromAttempt(
      record.correct,
      record.responseTimeMs,
      undefined,
      'character',
      progress.masteryLevel
    );

    // Update SRS data
    const updatedProgress = this.learningService.calculateNextReview(progress, quality);

    // Save
    this.progressRepo.saveCharacterProgress(updatedProgress);

    // Update finger progress aggregation
    this.updateFingerProgress(record);
  }

  /**
   * Updates direction confidence using exponential moving average.
   * More recent results have higher weight.
   */
  private updateDirectionConfidence(
    progress: LearningProgress,
    direction: Direction,
    correct: boolean,
    responseTimeMs: number
  ): void {
    if (!progress.directionConfidence) return;

    const current = progress.directionConfidence[direction];
    const newValue = correct ? 1 : 0;

    // Update attempts and correct count
    current.attempts++;
    if (correct) {
      current.correct++;
    }

    // Update average time
    current.averageTimeMs = LearningProgress.calculateNewAverage(
      current.averageTimeMs,
      responseTimeMs,
      current.attempts
    );

    current.lastPracticed = new Date();
  }

  recordPowerChordAttempt(id: string, correct: boolean, timeMs: number, skipMasteryUpdate?: boolean): void {
    this.recordAttempt({
      itemId: id,
      itemType: 'powerChord',
      correct,
      responseTimeMs: timeMs,
      timestamp: new Date(),
      skipMasteryUpdate,
    });
  }

  private recordPowerChordAttemptInternal(record: AttemptRecord): void {
    const progress = this.progressRepo.getOrCreate(record.itemId, 'powerChord');

    // Skip mastery updates during learning phase (only count basic stats, not recentAttempts)
    // This prevents learning mode attempts from counting towards mastery calculation
    if (record.skipMasteryUpdate) {
      // Only update basic cumulative stats, don't touch recentAttempts or mastery level
      progress.totalAttempts++;
      progress.lastAttemptDate = record.timestamp;
      if (record.correct) {
        progress.correctAttempts++;
        progress.lastCorrectDate = record.timestamp;
      }
      // Note: averageResponseTimeMs is NOT updated here because it's based on rolling window
      // and learning mode attempts don't go into recentAttempts
      this.progressRepo.savePowerChordProgress(progress, true); // Skip mastery update in repository
      return;
    }

    // Full recording: update recentAttempts and mastery level
    progress.recordAttempt(record.correct, record.responseTimeMs);
    progress.lastAttemptDate = record.timestamp;

    const quality = this.learningService.getQualityFromAttempt(
      record.correct,
      record.responseTimeMs,
      undefined,
      'powerChord',
      progress.masteryLevel
    );
    const updatedProgress = this.learningService.calculateNextReview(progress, quality);

    this.progressRepo.savePowerChordProgress(updatedProgress);
  }

  recordWordAttempt(
    word: string,
    correct: boolean,
    timeMs: number,
    attempts: number,
    skipMasteryUpdate?: boolean
  ): void {
    this.recordAttempt({
      itemId: word,
      itemType: 'word',
      correct,
      responseTimeMs: timeMs,
      timestamp: new Date(),
      attempts,
      skipMasteryUpdate,
    });
  }

  private recordWordAttemptInternal(record: AttemptRecord): void {
    const progress = this.progressRepo.getOrCreate(record.itemId, 'word');

    // Skip mastery updates during learning phase (only count basic stats, not recentAttempts)
    // This prevents learning mode attempts from counting towards mastery calculation
    if (record.skipMasteryUpdate) {
      // Only update basic cumulative stats, don't touch recentAttempts or mastery level
      progress.totalAttempts++;
      progress.lastAttemptDate = record.timestamp;
      if (record.correct) {
        progress.correctAttempts++;
        progress.lastCorrectDate = record.timestamp;
      }
      // Note: averageResponseTimeMs is NOT updated here because it's based on rolling window
      // and learning mode attempts don't go into recentAttempts
      this.progressRepo.saveWordProgress(progress, true); // Skip mastery update in repository
      return;
    }

    // Full recording: update recentAttempts and mastery level
    progress.recordAttempt(record.correct, record.responseTimeMs);
    progress.lastAttemptDate = record.timestamp;

    // Adjust quality based on attempts needed
    let quality = this.learningService.getQualityFromAttempt(
      record.correct,
      record.responseTimeMs,
      undefined,
      'word',
      progress.masteryLevel
    );
    const attempts = record.attempts ?? 1;
    if (attempts > 1 && quality > 3) {
      quality = Math.max(3, quality - (attempts - 1)) as QualityRating;
    }

    const updatedProgress = this.learningService.calculateNextReview(progress, quality);

    this.progressRepo.saveWordProgress(updatedProgress);
  }

  /**
   * Updates finger-level progress aggregation.
   */
  private updateFingerProgress(record: AttemptRecord): void {
    if (record.itemType !== 'character' || !this.characterRepo) return;

    const char = this.characterRepo.getByChar(record.itemId);
    if (!char) return;

    let fingerProgress = this.fingerProgressCache.get(char.fingerId);
    if (!fingerProgress) {
      fingerProgress = this.createEmptyFingerProgress(char.fingerId);
    }

    // Update counts
    fingerProgress.totalAttempts++;
    if (record.correct) {
      fingerProgress.correctAttempts++;
    }
    fingerProgress.accuracy =
      fingerProgress.correctAttempts / fingerProgress.totalAttempts;

    // Update average response time
    fingerProgress.averageResponseTimeMs = LearningProgress.calculateNewAverage(
      fingerProgress.averageResponseTimeMs,
      record.responseTimeMs,
      fingerProgress.totalAttempts
    );

    // Update confidence level
    fingerProgress.confidenceLevel = getConfidenceLevelFromMetrics(
      fingerProgress.accuracy,
      fingerProgress.totalAttempts,
      fingerProgress.averageResponseTimeMs
    );

    // Find weakest direction
    fingerProgress.weakestDirection = this.findWeakestDirection(char.fingerId);

    this.fingerProgressCache.set(char.fingerId, fingerProgress);
    this.saveFingerProgressCache();
  }

  private createEmptyFingerProgress(fingerId: FingerId): FingerProgress {
    return {
      fingerId,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      confidenceLevel: 'weak',
      weakestDirection: null,
      averageResponseTimeMs: 0,
    };
  }

  private findWeakestDirection(fingerId: FingerId): Direction | null {
    if (!this.characterRepo) return null;

    const characters = this.characterRepo.getByFinger(fingerId);
    let weakestDirection: Direction | null = null;
    let lowestAccuracy = 1;

    for (const char of characters) {
      const progress = this.progressRepo.getCharacterProgress(char.char);
      if (progress && progress.totalAttempts > 0) {
        if (progress.accuracy < lowestAccuracy) {
          lowestAccuracy = progress.accuracy;
          weakestDirection = char.direction;
        }
      }
    }

    return weakestDirection;
  }

  /**
   * Updates the active session with attempt data.
   */
  private updateActiveSession(record: AttemptRecord): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.itemsAttempted++;
    if (record.correct) {
      session.itemsCorrect++;
    }
    session.accuracy = session.itemsCorrect / session.itemsAttempted;
    session.averageResponseTimeMs = LearningProgress.calculateNewAverage(
      session.averageResponseTimeMs,
      record.responseTimeMs,
      session.itemsAttempted
    );

    this.saveActiveSession(session);
  }

  /**
   * Updates global statistics.
   */
  private updateGlobalStats(record: AttemptRecord): void {
    const stats = this.getGlobalStats();

    stats.totalAttempts++;
    if (record.correct) {
      stats.totalCorrect++;
    }
    stats.averageAccuracy = stats.totalCorrect / stats.totalAttempts;
    stats.lastPracticeDate = record.timestamp;

    this.saveGlobalStats(stats);
  }

  // ==================== Progress Queries ====================

  getOverallProgress(): OverallProgress {
    const repoStats = this.progressRepo.getTotalStats();
    const globalStats = this.getGlobalStats();
    const currentStage = this.learningService.getCurrentLearningStage();

    // Calculate completed stages (all stages before current that are unlocked)
    const stageOrder = Object.values(LearningStage);
    const currentIndex = stageOrder.indexOf(currentStage);
    const stagesCompleted = stageOrder.slice(0, currentIndex);

    // Calculate average accuracy across all items
    const allProgress = this.progressRepo.getAllProgress();
    let totalCorrect = 0;
    let totalAttempts = 0;
    let totalWpm = 0;
    let wpmCount = 0;

    for (const progress of allProgress) {
      totalCorrect += progress.correctAttempts;
      totalAttempts += progress.totalAttempts;
      if (progress.averageResponseTimeMs > 0) {
        // Rough WPM estimate: characters per minute
        const cpm = 60000 / progress.averageResponseTimeMs;
        totalWpm += cpm / 5; // Standard: 5 chars = 1 word
        wpmCount++;
      }
    }

    return {
      totalPracticeTimeMs: globalStats.totalPracticeTimeMs,
      sessionsCompleted: globalStats.totalSessions,
      charactersLearned: repoStats.charactersLearned,
      charactersMastered: repoStats.charactersMastered,
      powerChordsLearned: repoStats.powerChordsLearned,
      powerChordsMastered: repoStats.powerChordsMastered,
      wordsLearned: repoStats.wordsLearned,
      wordsMastered: repoStats.wordsMastered,
      currentStage,
      stagesCompleted,
      averageAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      averageWpm: wpmCount > 0 ? Math.round(totalWpm / wpmCount) : 0,
      currentStreak: globalStats.currentStreak,
      longestStreak: globalStats.longestStreak,
    };
  }

  getFingerProgress(fingerId: FingerId): FingerProgress {
    // Check cache first
    const cached = this.fingerProgressCache.get(fingerId);
    if (cached) {
      return cached;
    }

    // Compute from character progress if not cached
    if (!this.characterRepo) {
      return this.createEmptyFingerProgress(fingerId);
    }

    const characters = this.characterRepo.getByFinger(fingerId);
    let totalAttempts = 0;
    let correctAttempts = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const char of characters) {
      const progress = this.progressRepo.getCharacterProgress(char.char);
      if (progress) {
        totalAttempts += progress.totalAttempts;
        correctAttempts += progress.correctAttempts;
        if (progress.averageResponseTimeMs > 0) {
          totalResponseTime += progress.averageResponseTimeMs;
          responseTimeCount++;
        }
      }
    }

    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
    const averageResponseTimeMs = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;

    const fingerProgress: FingerProgress = {
      fingerId,
      totalAttempts,
      correctAttempts,
      accuracy,
      confidenceLevel: getConfidenceLevelFromMetrics(accuracy, totalAttempts, averageResponseTimeMs),
      weakestDirection: this.findWeakestDirection(fingerId),
      averageResponseTimeMs,
    };

    // Cache the result
    this.fingerProgressCache.set(fingerId, fingerProgress);

    return fingerProgress;
  }

  getAllFingerProgress(): FingerProgress[] {
    if (!this.characterRepo) return [];

    // Get all unique finger IDs from characters
    const fingerIds = new Set<FingerId>();
    for (const char of this.characterRepo.getAll()) {
      fingerIds.add(char.fingerId);
    }

    return Array.from(fingerIds).map((id) => this.getFingerProgress(id));
  }

  getDirectionProgress(fingerId: FingerId, direction: Direction): DirectionProgress {
    if (!this.characterRepo) {
      return {
        direction,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageResponseTimeMs: 0,
      };
    }

    // Find the character for this finger and direction
    const char = this.characterRepo.getByFingerAndDirection(fingerId, direction);
    if (!char) {
      return {
        direction,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageResponseTimeMs: 0,
      };
    }

    const progress = this.progressRepo.getCharacterProgress(char.char);
    if (!progress || !progress.directionConfidence) {
      return {
        direction,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageResponseTimeMs: 0,
      };
    }

    const dirProgress = progress.directionConfidence[direction];
    return {
      direction,
      totalAttempts: dirProgress.attempts,
      correctAttempts: dirProgress.correct,
      accuracy: dirProgress.attempts > 0 ? dirProgress.correct / dirProgress.attempts : 0,
      averageResponseTimeMs: dirProgress.averageTimeMs,
    };
  }

  getGlobalStats(): GlobalStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_STATS);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data,
          lastPracticeDate: data.lastPracticeDate ? new Date(data.lastPracticeDate) : null,
          lastSessionDate: data.lastSessionDate ?? '',
        };
      }
    } catch {
      // Ignore parse errors
    }

    const repoStats = this.progressRepo.getTotalStats();
    return {
      totalSessions: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      totalPracticeTimeMs: repoStats.totalPracticeTimeMs,
      charactersLearned: repoStats.charactersLearned,
      powerChordsLearned: repoStats.powerChordsLearned,
      wordsLearned: repoStats.wordsLearned,
      currentStage: LearningStage.FINGER_INTRODUCTION,
      currentStreak: repoStats.currentStreak,
      longestStreak: repoStats.longestStreak,
      lastPracticeDate: repoStats.lastPracticeDate,
      lastSessionDate: '',
      averageAccuracy: 0,
      averageWpm: 0,
      bestWpm: 0,
    };
  }

  private saveGlobalStats(stats: GlobalStats): void {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_STATS, JSON.stringify(stats));
  }

  // ==================== Session Tracking ====================

  startSession(type: SessionRecord['type']): string {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: SessionRecord = {
      id,
      type,
      startTime: new Date(),
      endTime: null,
      itemsAttempted: 0,
      itemsCorrect: 0,
      accuracy: 0,
      averageResponseTimeMs: 0,
      score: 0,
    };

    this.currentSessionId = id;
    this.saveActiveSession(session);

    return id;
  }

  endSession(sessionId: string): SessionRecord {
    const session = this.getCurrentSession();
    if (!session || session.id !== sessionId) {
      throw new Error(`No active session with ID: ${sessionId}`);
    }

    session.endTime = new Date();
    session.score = this.calculateSessionScore(session);

    // Add to history
    this.addSessionToHistory(session);

    // Update global stats
    const stats = this.getGlobalStats();
    stats.totalSessions++;
    stats.totalPracticeTimeMs +=
      session.endTime.getTime() - session.startTime.getTime();
    this.saveGlobalStats(stats);

    // Clear active session
    this.currentSessionId = null;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);

    // Record for streak tracking
    this.recordPracticeSession();

    return session;
  }

  getCurrentSession(): SessionRecord | null {
    if (!this.currentSessionId) {
      // Try to load from storage (in case of page refresh)
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        if (stored) {
          const session = JSON.parse(stored) as SessionRecord;
          session.startTime = new Date(session.startTime);
          this.currentSessionId = session.id;
          return session;
        }
      } catch {
        // Ignore parse errors
      }
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (stored) {
        const session = JSON.parse(stored) as SessionRecord;
        session.startTime = new Date(session.startTime);
        return session;
      }
    } catch {
      // Ignore parse errors
    }

    return null;
  }

  getSessionHistory(limit: number = 50): SessionRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
      if (stored) {
        const sessions = JSON.parse(stored) as SessionRecord[];
        return sessions
          .slice(-limit)
          .map((s) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : null,
          }))
          .reverse();
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  }

  private saveActiveSession(session: SessionRecord): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  }

  private addSessionToHistory(session: SessionRecord): void {
    const history = this.getSessionHistory(100);
    history.unshift(session);

    // Keep only last 100 sessions
    const trimmed = history.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(trimmed));
  }

  private calculateSessionScore(session: SessionRecord): number {
    // Score based on accuracy, speed, and volume
    const accuracyScore = session.accuracy * 100;
    const speedBonus = Math.max(0, 50 - session.averageResponseTimeMs / 50);
    const volumeBonus = Math.min(20, session.itemsAttempted * 2);

    return Math.round(accuracyScore + speedBonus + volumeBonus);
  }

  // ==================== Streaks ====================

  recordPracticeSession(): void {
    const stats = this.getGlobalStats();
    const today = new Date().toISOString().split('T')[0];

    if (stats.lastSessionDate === today) {
      // Already recorded today
      return;
    }

    const lastDate = stats.lastSessionDate
      ? new Date(stats.lastSessionDate)
      : null;
    const todayDate = new Date(today);

    // Check if consecutive day
    if (lastDate) {
      const dayDiff = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        // Consecutive day
        stats.currentStreak++;
      } else if (dayDiff > 1) {
        // Streak broken
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 1;
    }

    stats.lastSessionDate = today;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);

    this.saveGlobalStats(stats);
  }

  getCurrentStreak(): number {
    return this.getGlobalStats().currentStreak;
  }

  getLongestStreak(): number {
    return this.getGlobalStats().longestStreak;
  }

  // ==================== Export/Import ====================

  exportProgress(): string {
    // Convert cache to object for export
    const fingerProgressData: Record<string, FingerProgress> = {};
    for (const [fingerId, progress] of this.fingerProgressCache) {
      fingerProgressData[fingerId] = progress;
    }

    // Convert progress arrays to record objects keyed by itemId
    const charactersData: Record<string, LearningProgress> = {};
    for (const progress of this.progressRepo.getAllCharacterProgress()) {
      charactersData[progress.itemId] = progress;
    }
    const powerChordsData: Record<string, LearningProgress> = {};
    for (const progress of this.progressRepo.getAllPowerChordProgress()) {
      powerChordsData[progress.itemId] = progress;
    }
    const wordsData: Record<string, LearningProgress> = {};
    for (const progress of this.progressRepo.getAllWordProgress()) {
      wordsData[progress.itemId] = progress;
    }

    const data = {
      version: 3,
      exportDate: new Date().toISOString(),
      characters: charactersData,
      powerChords: powerChordsData,
      words: wordsData,
      fingerProgress: fingerProgressData,
      globalStats: this.getGlobalStats(),
      sessionHistory: this.getSessionHistory(100),
    };

    return JSON.stringify(data, null, 2);
  }

  importProgress(json: string): boolean {
    try {
      const data = JSON.parse(json);

      if (data.version !== 1 && data.version !== 2 && data.version !== 3) {
        console.error('Unsupported progress export version:', data.version);
        return false;
      }

      // Import character progress
      if (data.characters) {
        for (const [, progress] of Object.entries(data.characters)) {
          const prog = progress as LearningProgress;
          // Restore Date objects
          prog.lastAttemptDate = prog.lastAttemptDate ? new Date(prog.lastAttemptDate) : null;
          prog.lastCorrectDate = prog.lastCorrectDate ? new Date(prog.lastCorrectDate) : null;
          prog.nextReviewDate = new Date(prog.nextReviewDate);
          this.progressRepo.saveCharacterProgress(prog);
        }
      }

      // Import power chord progress
      if (data.powerChords) {
        for (const [, progress] of Object.entries(data.powerChords)) {
          const prog = progress as LearningProgress;
          prog.lastAttemptDate = prog.lastAttemptDate ? new Date(prog.lastAttemptDate) : null;
          prog.lastCorrectDate = prog.lastCorrectDate ? new Date(prog.lastCorrectDate) : null;
          prog.nextReviewDate = new Date(prog.nextReviewDate);
          this.progressRepo.savePowerChordProgress(prog);
        }
      }

      // Import word progress
      if (data.words) {
        for (const [, progress] of Object.entries(data.words)) {
          const prog = progress as LearningProgress;
          prog.lastAttemptDate = prog.lastAttemptDate ? new Date(prog.lastAttemptDate) : null;
          prog.lastCorrectDate = prog.lastCorrectDate ? new Date(prog.lastCorrectDate) : null;
          prog.nextReviewDate = new Date(prog.nextReviewDate);
          this.progressRepo.saveWordProgress(prog);
        }
      }

      // Import finger progress (v2+)
      if (data.fingerProgress) {
        for (const [fingerId, progress] of Object.entries(data.fingerProgress)) {
          this.fingerProgressCache.set(fingerId as FingerId, progress as FingerProgress);
        }
        this.saveFingerProgressCache();
      }

      // Import global stats (v2+)
      if (data.globalStats) {
        const stats = data.globalStats as GlobalStats;
        stats.lastPracticeDate = stats.lastPracticeDate ? new Date(stats.lastPracticeDate) : null;
        // Ensure lastSessionDate exists (may be missing from v2 exports)
        stats.lastSessionDate = stats.lastSessionDate ?? '';
        this.saveGlobalStats(stats);
      }

      // Import session history (v2+)
      if (data.sessionHistory) {
        localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(data.sessionHistory));
      }

      return true;
    } catch (error) {
      console.error('Failed to import progress:', error);
      return false;
    }
  }

  // ==================== Reset ====================

  resetAllProgress(): void {
    this.progressRepo.clearAllProgress();
    // Clear all progress-related storage
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.FINGER_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_STATS);
    // Clear cache
    this.fingerProgressCache.clear();
  }

  resetProgressForStage(stage: LearningStage): void {
    // Reset progress based on stage type
    switch (stage) {
      case LearningStage.FINGER_INTRODUCTION:
      case LearningStage.CHARACTER_QUIZ:
        // Reset character progress
        for (const progress of this.progressRepo.getAllCharacterProgress()) {
          this.progressRepo.saveCharacterProgress(this.createFreshProgress(progress.itemId, 'character'));
        }
        // Clear finger progress cache for affected fingers
        this.fingerProgressCache.clear();
        this.saveFingerProgressCache();
        break;

      case LearningStage.INTRA_HAND_POWER_CHORDS:
      case LearningStage.CROSS_HAND_POWER_CHORDS:
        // Reset power chord progress
        for (const progress of this.progressRepo.getAllPowerChordProgress()) {
          this.progressRepo.savePowerChordProgress(this.createFreshProgress(progress.itemId, 'powerChord'));
        }
        break;

      case LearningStage.WORD_CHORDS:
      case LearningStage.CHUNK_EXTENSION:
      case LearningStage.SPEED_CHALLENGES:
      case LearningStage.REAL_TYPING:
        // Reset word progress
        for (const progress of this.progressRepo.getAllWordProgress()) {
          this.progressRepo.saveWordProgress(this.createFreshProgress(progress.itemId, 'word'));
        }
        break;
    }
  }

  /**
   * Transitions an item from NEW to LEARNING status.
   * Used when an item completes the learn mode practice.
   * This allows the item to appear in Review modes without affecting recentAttempts.
   */
  transitionFromNewToLearning(itemId: string, itemType: LearningItemType): void {
    const progress = this.progressRepo.getOrCreate(itemId, itemType);

    // Only transition if currently NEW
    if (progress.masteryLevel !== MasteryLevel.NEW) {
      return;
    }

    // Set to LEARNING so it appears in Review modes
    progress.masteryLevel = MasteryLevel.LEARNING;

    // Save without running the normal mastery calculation
    // (which would set it back to NEW since recentAttempts is empty)
    switch (itemType) {
      case 'character':
        this.progressRepo.saveCharacterProgress(progress, true);
        break;
      case 'powerChord':
        this.progressRepo.savePowerChordProgress(progress, true);
        break;
      case 'word':
        this.progressRepo.saveWordProgress(progress, true);
        break;
    }
  }

  private createFreshProgress(itemId: string, itemType: 'character' | 'powerChord' | 'word'): LearningProgress {
    return LearningProgress.create(itemId, itemType);
  }
}

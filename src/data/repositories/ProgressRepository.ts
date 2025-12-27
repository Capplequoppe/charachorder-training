/**
 * Repository for managing user learning progress.
 * Persists data to LocalStorage.
 */

import {
  LearningProgress,
  LearningItemType,
  AttemptRecord,
  MasteryLevel,
  Direction,
  DirectionProgress,
} from '../../domain';
import {
  storage,
  STORAGE_KEYS,
} from '../storage/LocalStorageAdapter';

/**
 * Statistics about overall progress.
 */
export interface ProgressStats {
  charactersLearned: number;
  charactersMastered: number;
  powerChordsLearned: number;
  powerChordsMastered: number;
  wordsLearned: number;
  wordsMastered: number;
  totalPracticeTimeMs: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date | null;
}

/**
 * Interface for progress repository operations.
 */
export interface IProgressRepository {
  // Character progress
  getCharacterProgress(char: string): LearningProgress | undefined;
  getAllCharacterProgress(): LearningProgress[];
  saveCharacterProgress(progress: LearningProgress, skipMasteryUpdate?: boolean): void;

  // Power chord progress
  getPowerChordProgress(id: string): LearningProgress | undefined;
  getAllPowerChordProgress(): LearningProgress[];
  savePowerChordProgress(progress: LearningProgress, skipMasteryUpdate?: boolean): void;

  // Word progress
  getWordProgress(word: string): LearningProgress | undefined;
  getAllWordProgress(): LearningProgress[];
  saveWordProgress(progress: LearningProgress, skipMasteryUpdate?: boolean): void;

  // Bulk operations
  getItemsDueForReview(type: LearningItemType): LearningProgress[];
  getWeakItems(type: LearningItemType, threshold: number): LearningProgress[];
  getOrCreate(itemId: string, itemType: LearningItemType): LearningProgress;

  // Stats
  getTotalStats(): ProgressStats;
  updateStats(practiceTimeMs: number): void;

  // All progress
  getAllProgress(): LearningProgress[];
  getProgress(itemId: string, itemType: LearningItemType): LearningProgress | undefined;
  updateProgress(progress: LearningProgress): void;

  // Reset
  clearAll(): void;
  clearAllProgress(): void;
  clearByType(type: LearningItemType): void;
}

/**
 * Progress repository implementation with LocalStorage persistence.
 */
export class ProgressRepository implements IProgressRepository {
  private characterProgress: Map<string, LearningProgress>;
  private powerChordProgress: Map<string, LearningProgress>;
  private wordProgress: Map<string, LearningProgress>;
  private stats: ProgressStats;

  constructor() {
    // Load data from storage
    this.characterProgress = this.loadProgressMap(STORAGE_KEYS.CHARACTER_PROGRESS);
    this.powerChordProgress = this.loadProgressMap(STORAGE_KEYS.POWER_CHORD_PROGRESS);
    this.wordProgress = this.loadProgressMap(STORAGE_KEYS.WORD_PROGRESS);
    this.stats = this.loadStats();
  }

  private loadProgressMap(key: string): Map<string, LearningProgress> {
    const data = storage.get<Record<string, unknown>>(key);
    if (!data) return new Map();

    // Convert to Map and create proper LearningProgress instances
    const map = new Map<string, LearningProgress>();
    for (const [id, progressData] of Object.entries(data)) {
      const progress = LearningProgress.fromData(progressData as {
        itemId: string;
        itemType: LearningItemType;
        easeFactor?: number;
        interval?: number;
        nextReviewDate?: Date | string;
        repetitions?: number;
        totalAttempts?: number;
        correctAttempts?: number;
        averageResponseTimeMs?: number;
        lastAttemptDate?: Date | string | null;
        lastCorrectDate?: Date | string | null;
        masteryLevel?: MasteryLevel;
        directionConfidence?: Record<Direction, DirectionProgress>;
        recentAttempts?: AttemptRecord[];
      });
      map.set(id, progress);
    }
    return map;
  }

  private saveProgressMap(key: string, map: Map<string, LearningProgress>): void {
    const obj: Record<string, LearningProgress> = {};
    for (const [id, progress] of map) {
      obj[id] = progress;
    }
    storage.set(key, obj);
  }

  private loadStats(): ProgressStats {
    const data = storage.get<ProgressStats>(STORAGE_KEYS.STATS);
    return (
      data ?? {
        charactersLearned: 0,
        charactersMastered: 0,
        powerChordsLearned: 0,
        powerChordsMastered: 0,
        wordsLearned: 0,
        wordsMastered: 0,
        totalPracticeTimeMs: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: null,
      }
    );
  }

  private saveStats(): void {
    storage.set(STORAGE_KEYS.STATS, this.stats);
  }

  // ==================== Character Progress ====================

  getCharacterProgress(char: string): LearningProgress | undefined {
    return this.characterProgress.get(char.toLowerCase());
  }

  getAllCharacterProgress(): LearningProgress[] {
    return Array.from(this.characterProgress.values());
  }

  saveCharacterProgress(progress: LearningProgress, skipMasteryUpdate?: boolean): void {
    if (!skipMasteryUpdate) {
      progress.updateMasteryLevel();
    }
    this.characterProgress.set(progress.itemId.toLowerCase(), progress);
    this.saveProgressMap(STORAGE_KEYS.CHARACTER_PROGRESS, this.characterProgress);
    this.updateLearnedCounts();
  }

  // ==================== Power Chord Progress ====================

  getPowerChordProgress(id: string): LearningProgress | undefined {
    return this.powerChordProgress.get(id.toLowerCase());
  }

  getAllPowerChordProgress(): LearningProgress[] {
    return Array.from(this.powerChordProgress.values());
  }

  savePowerChordProgress(progress: LearningProgress, skipMasteryUpdate?: boolean): void {
    if (!skipMasteryUpdate) {
      progress.updateMasteryLevel();
    }
    this.powerChordProgress.set(progress.itemId.toLowerCase(), progress);
    this.saveProgressMap(STORAGE_KEYS.POWER_CHORD_PROGRESS, this.powerChordProgress);
    this.updateLearnedCounts();
  }

  // ==================== Word Progress ====================

  getWordProgress(word: string): LearningProgress | undefined {
    return this.wordProgress.get(word.toLowerCase());
  }

  getAllWordProgress(): LearningProgress[] {
    return Array.from(this.wordProgress.values());
  }

  saveWordProgress(progress: LearningProgress, skipMasteryUpdate?: boolean): void {
    if (!skipMasteryUpdate) {
      progress.updateMasteryLevel();
    }
    this.wordProgress.set(progress.itemId.toLowerCase(), progress);
    this.saveProgressMap(STORAGE_KEYS.WORD_PROGRESS, this.wordProgress);
    this.updateLearnedCounts();
  }

  // ==================== Bulk Operations ====================

  getItemsDueForReview(type: LearningItemType): LearningProgress[] {
    const progressMap = this.getProgressMapByType(type);
    return Array.from(progressMap.values()).filter((p) => p.isDueForReview);
  }

  getWeakItems(type: LearningItemType, threshold: number): LearningProgress[] {
    const progressMap = this.getProgressMapByType(type);
    return Array.from(progressMap.values())
      .filter((p) => p.totalAttempts > 0 && p.accuracy < threshold)
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  getOrCreate(itemId: string, itemType: LearningItemType): LearningProgress {
    const progressMap = this.getProgressMapByType(itemType);
    const existing = progressMap.get(itemId.toLowerCase());
    if (existing) return existing;

    const newProgress = LearningProgress.create(itemId.toLowerCase(), itemType);
    progressMap.set(itemId.toLowerCase(), newProgress);

    // Save immediately
    const key = this.getStorageKeyByType(itemType);
    this.saveProgressMap(key, progressMap);

    return newProgress;
  }

  private getProgressMapByType(type: LearningItemType): Map<string, LearningProgress> {
    switch (type) {
      case 'character':
        return this.characterProgress;
      case 'powerChord':
        return this.powerChordProgress;
      case 'word':
        return this.wordProgress;
    }
  }

  private getStorageKeyByType(type: LearningItemType): string {
    switch (type) {
      case 'character':
        return STORAGE_KEYS.CHARACTER_PROGRESS;
      case 'powerChord':
        return STORAGE_KEYS.POWER_CHORD_PROGRESS;
      case 'word':
        return STORAGE_KEYS.WORD_PROGRESS;
    }
  }

  // ==================== Stats ====================

  getTotalStats(): ProgressStats {
    return { ...this.stats };
  }

  updateStats(practiceTimeMs: number): void {
    this.stats.totalPracticeTimeMs += practiceTimeMs;

    // Update streak
    const now = new Date();
    const lastPractice = this.stats.lastPracticeDate
      ? new Date(this.stats.lastPracticeDate)
      : null;

    if (lastPractice) {
      const daysSinceLast = Math.floor(
        (now.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLast === 0) {
        // Same day, don't change streak
      } else if (daysSinceLast === 1) {
        // Consecutive day
        this.stats.currentStreak++;
        this.stats.longestStreak = Math.max(
          this.stats.longestStreak,
          this.stats.currentStreak
        );
      } else {
        // Streak broken
        this.stats.currentStreak = 1;
      }
    } else {
      this.stats.currentStreak = 1;
    }

    this.stats.lastPracticeDate = now;
    this.saveStats();
  }

  private updateLearnedCounts(): void {
    const countLearned = (map: Map<string, LearningProgress>): number =>
      Array.from(map.values()).filter((p) => p.totalAttempts > 0).length;

    const countMastered = (map: Map<string, LearningProgress>): number =>
      Array.from(map.values()).filter((p) => p.masteryLevel === 'mastered').length;

    this.stats.charactersLearned = countLearned(this.characterProgress);
    this.stats.charactersMastered = countMastered(this.characterProgress);
    this.stats.powerChordsLearned = countLearned(this.powerChordProgress);
    this.stats.powerChordsMastered = countMastered(this.powerChordProgress);
    this.stats.wordsLearned = countLearned(this.wordProgress);
    this.stats.wordsMastered = countMastered(this.wordProgress);

    this.saveStats();
  }

  // ==================== Reset ====================

  clearAll(): void {
    this.characterProgress.clear();
    this.powerChordProgress.clear();
    this.wordProgress.clear();
    this.stats = this.loadStats(); // Reset to defaults

    storage.remove(STORAGE_KEYS.CHARACTER_PROGRESS);
    storage.remove(STORAGE_KEYS.POWER_CHORD_PROGRESS);
    storage.remove(STORAGE_KEYS.WORD_PROGRESS);
    storage.remove(STORAGE_KEYS.STATS);
  }

  clearByType(type: LearningItemType): void {
    const map = this.getProgressMapByType(type);
    map.clear();

    const key = this.getStorageKeyByType(type);
    storage.remove(key);

    this.updateLearnedCounts();
  }

  // ==================== All Progress ====================

  getAllProgress(): LearningProgress[] {
    return [
      ...this.getAllCharacterProgress(),
      ...this.getAllPowerChordProgress(),
      ...this.getAllWordProgress(),
    ];
  }

  getProgress(itemId: string, itemType: LearningItemType): LearningProgress | undefined {
    switch (itemType) {
      case 'character':
        return this.getCharacterProgress(itemId);
      case 'powerChord':
        return this.getPowerChordProgress(itemId);
      case 'word':
        return this.getWordProgress(itemId);
    }
  }

  updateProgress(progress: LearningProgress): void {
    switch (progress.itemType) {
      case 'character':
        this.saveCharacterProgress(progress);
        break;
      case 'powerChord':
        this.savePowerChordProgress(progress);
        break;
      case 'word':
        this.saveWordProgress(progress);
        break;
    }
  }

  clearAllProgress(): void {
    this.clearAll();
  }
}

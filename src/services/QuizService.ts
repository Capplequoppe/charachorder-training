/**
 * Quiz Service
 *
 * Handles intelligent quiz item selection and session management.
 * Implements adaptive selection that prioritizes items based on
 * due dates, difficulty, and learning goals.
 */

import {
  type LearningProgress,
  type LearningItemType,
  type FingerId,
  Direction,
  ALL_DIRECTIONS,
} from '../domain';
import { type IProgressRepository, type ICharacterRepository } from '../data/repositories';
import {
  calculateSelectionWeight,
  getConfidenceLevel as getConfidenceLevelFromConfig,
  SESSION_CONFIG,
} from '../data/static/learningConfig';

// ==================== Types ====================

/**
 * Quiz session types.
 */
export type QuizSessionType = 'review' | 'learn' | 'weakness' | 'mixed';

/**
 * Confidence level for items.
 */
export type ConfidenceLevel = 'weak' | 'moderate' | 'strong';

/**
 * Options for selecting quiz items.
 */
export interface SelectionOptions {
  /** Number of items to select */
  count: number;
  /** Type of items to select */
  type: LearningItemType;
  /** Whether to include new (never seen) items */
  includeNew?: boolean;
  /** Ratio of new items (0-1, e.g., 0.2 = 20% new items) */
  newItemRatio?: number;
  /** Filter to specific finger (for character quizzes) */
  fingerId?: FingerId;
  /** Filter to specific direction (for character quizzes) */
  direction?: Direction;
}

/**
 * A quiz session containing selected items.
 */
export interface QuizSession {
  /** Session type */
  type: QuizSessionType;
  /** Selected items for this session */
  items: LearningProgress[];
  /** Total count of items */
  totalCount: number;
  /** Count of new items in this session */
  newItemCount: number;
  /** Count of review items in this session */
  reviewItemCount: number;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Statistics about items available for quiz.
 */
export interface QuizStats {
  /** Number of items due for review */
  dueCount: number;
  /** Number of never-seen items */
  newCount: number;
  /** Number of weak items (low accuracy) */
  weakCount: number;
  /** Total items of this type */
  totalCount: number;
}

/**
 * Confidence breakdown for a finger.
 */
export interface FingerConfidence {
  /** Overall finger confidence */
  overall: ConfidenceLevel;
  /** Confidence by direction */
  byDirection: Record<Direction, ConfidenceLevel>;
}

/**
 * Interface for quiz service operations.
 */
export interface IQuizService {
  // Session creation
  createReviewSession(type: LearningItemType, count?: number): QuizSession;
  createLearnSession(type: LearningItemType, count?: number): QuizSession;
  createWeaknessSession(type: LearningItemType, count?: number): QuizSession;
  createMixedSession(type: LearningItemType, count?: number): QuizSession;

  // Item selection
  selectItemsForQuiz(options: SelectionOptions): LearningProgress[];
  selectCharactersWithWeakDirections(count: number): LearningProgress[];

  // Statistics
  getQuizStats(type: LearningItemType): QuizStats;
  getFingerConfidence(fingerId: FingerId): FingerConfidence;
  getConfidenceLevel(progress: LearningProgress): ConfidenceLevel;

  // New items
  getNewItems(type: LearningItemType, count?: number): string[];
  getNewItemsForFinger(fingerId: FingerId): string[];
}

/**
 * Quiz service implementation.
 */
export class QuizService implements IQuizService {
  private progressRepo: IProgressRepository;
  private characterRepo: ICharacterRepository;

  constructor(
    progressRepo: IProgressRepository,
    characterRepo: ICharacterRepository
  ) {
    this.progressRepo = progressRepo;
    this.characterRepo = characterRepo;
  }

  // ==================== Session Creation ====================

  /**
   * Creates a review session focusing on due items.
   * No new items are introduced.
   */
  createReviewSession(
    type: LearningItemType,
    count: number = SESSION_CONFIG.maxReviewsPerSession
  ): QuizSession {
    const items = this.selectItemsForQuiz({
      count,
      type,
      includeNew: false,
    });

    return this.buildSession('review', items);
  }

  /**
   * Creates a learning session that introduces new items.
   * Mix of new items (40%) and review items (60%).
   */
  createLearnSession(
    type: LearningItemType,
    count: number = SESSION_CONFIG.maxReviewsPerSession
  ): QuizSession {
    const items = this.selectItemsForQuiz({
      count,
      type,
      includeNew: true,
      newItemRatio: 0.4,
    });

    return this.buildSession('learn', items);
  }

  /**
   * Creates a weakness session focusing on difficult items.
   * Targets items with lowest accuracy.
   */
  createWeaknessSession(
    type: LearningItemType,
    count: number = SESSION_CONFIG.maxReviewsPerSession
  ): QuizSession {
    const allProgress = this.getAllProgressByType(type);

    // Filter to items that have been attempted
    const attemptedItems = allProgress.filter((p) => p.totalAttempts > 0);

    // Sort by accuracy (lowest first)
    const sorted = attemptedItems.sort((a, b) => {
      return a.accuracy - b.accuracy;
    });

    const items = sorted.slice(0, count);
    return this.buildSession('weakness', items);
  }

  /**
   * Creates a mixed session with balanced selection.
   * 20% new, 50% due, 30% weighted random.
   */
  createMixedSession(
    type: LearningItemType,
    count: number = SESSION_CONFIG.maxReviewsPerSession
  ): QuizSession {
    const items = this.selectItemsForQuiz({
      count,
      type,
      includeNew: true,
      newItemRatio: 0.2,
    });

    return this.buildSession('mixed', items);
  }

  private buildSession(
    type: QuizSessionType,
    items: LearningProgress[]
  ): QuizSession {
    const newItemCount = items.filter((p) => p.totalAttempts === 0).length;

    return {
      type,
      items,
      totalCount: items.length,
      newItemCount,
      reviewItemCount: items.length - newItemCount,
      createdAt: new Date(),
    };
  }

  // ==================== Item Selection ====================

  /**
   * Selects items for a quiz using priority-based selection.
   *
   * Priority order:
   * 1. Due items (sorted by how overdue they are)
   * 2. New items (limited by ratio)
   * 3. Weighted random from remaining items
   */
  selectItemsForQuiz(options: SelectionOptions): LearningProgress[] {
    const {
      count,
      type,
      includeNew = true,
      newItemRatio = 0.2,
      fingerId,
      direction,
    } = options;

    let allProgress = this.getAllProgressByType(type);

    // Apply filters if specified
    if (fingerId && type === 'character') {
      const fingerChars = this.characterRepo.getByFinger(fingerId);
      const charIds = new Set(fingerChars.map((c) => c.char.toLowerCase()));
      allProgress = allProgress.filter((p) => charIds.has(p.itemId.toLowerCase()));
    }

    if (direction && type === 'character') {
      const directionChars = this.characterRepo
        .getAll()
        .filter((c) => c.direction === direction);
      const charIds = new Set(directionChars.map((c) => c.char.toLowerCase()));
      allProgress = allProgress.filter((p) => charIds.has(p.itemId.toLowerCase()));
    }

    const selected: LearningProgress[] = [];

    // Priority 1: Due items (sorted by overdue-ness)
    const dueItems = allProgress
      .filter((p) => p.isDueForReview)
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());

    selected.push(...dueItems.slice(0, count));

    // Priority 2: New items (limited by ratio)
    if (includeNew && selected.length < count) {
      const newItemIds = this.getNewItems(type);
      const newCount = Math.min(
        Math.floor(count * newItemRatio),
        count - selected.length
      );

      for (let i = 0; i < Math.min(newCount, newItemIds.length); i++) {
        const newProgress = this.progressRepo.getOrCreate(newItemIds[i], type);
        if (!selected.some((s) => s.itemId === newProgress.itemId)) {
          selected.push(newProgress);
        }
      }
    }

    // Priority 3: Fill remaining with weighted selection
    if (selected.length < count) {
      const selectedIds = new Set(selected.map((s) => s.itemId.toLowerCase()));
      const remaining = allProgress.filter(
        (p) => !selectedIds.has(p.itemId.toLowerCase())
      );

      const weighted = this.weightedRandomSelect(
        remaining,
        count - selected.length
      );
      selected.push(...weighted);
    }

    // Shuffle to avoid predictable order
    return this.shuffle(selected);
  }

  /**
   * Selects characters that have weak directions.
   * Useful for targeted practice on direction-specific weaknesses.
   */
  selectCharactersWithWeakDirections(count: number): LearningProgress[] {
    const charProgress = this.progressRepo.getAllCharacterProgress();

    // Find characters with direction confidence imbalance
    const withWeakDirections = charProgress.filter((p) => {
      if (!p.directionConfidence) return false;

      const confidences = Object.values(p.directionConfidence).map(
        (dc) => (dc.correct / Math.max(1, dc.attempts))
      );

      if (confidences.length === 0) return false;

      const max = Math.max(...confidences);
      const min = Math.min(...confidences);

      // Significant imbalance (>30% difference)
      return max - min > 0.3;
    });

    return this.weightedRandomSelect(withWeakDirections, count);
  }

  /**
   * Weighted random selection favoring difficult items.
   */
  private weightedRandomSelect(
    items: LearningProgress[],
    count: number
  ): LearningProgress[] {
    if (items.length <= count) return [...items];

    const weighted = items.map((item) => ({
      item,
      weight: calculateSelectionWeight(item),
    }));

    const selected: LearningProgress[] = [];
    const remaining = [...weighted];

    while (selected.length < count && remaining.length > 0) {
      const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < remaining.length; i++) {
        random -= remaining[i].weight;
        if (random <= 0) {
          selected.push(remaining[i].item);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return selected;
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // ==================== Statistics ====================

  /**
   * Gets quiz statistics for an item type.
   */
  getQuizStats(type: LearningItemType): QuizStats {
    const allProgress = this.getAllProgressByType(type);
    const newItemIds = this.getNewItems(type);

    return {
      dueCount: allProgress.filter((p) => p.isDueForReview).length,
      newCount: newItemIds.length,
      weakCount: allProgress.filter(
        (p) => p.totalAttempts > 0 && p.accuracy < 0.7
      ).length,
      totalCount: this.getTotalItemCount(type),
    };
  }

  /**
   * Gets confidence breakdown for a finger.
   */
  getFingerConfidence(fingerId: FingerId): FingerConfidence {
    const characters = this.characterRepo.getByFinger(fingerId);
    const byDirection: Record<Direction, ConfidenceLevel> = {} as Record<
      Direction,
      ConfidenceLevel
    >;

    // Initialize all directions as weak
    for (const dir of ALL_DIRECTIONS) {
      byDirection[dir] = 'weak';
    }

    // Calculate confidence for each direction
    characters.forEach((char) => {
      const progress = this.progressRepo.getCharacterProgress(char.char);
      if (progress) {
        byDirection[char.direction] = this.getConfidenceLevel(progress);
      }
    });

    // Calculate overall confidence
    const confidences = Object.values(byDirection);
    const overall = this.calculateOverallConfidence(confidences);

    return { overall, byDirection };
  }

  /**
   * Gets confidence level for a progress record.
   */
  getConfidenceLevel(progress: LearningProgress): ConfidenceLevel {
    return getConfidenceLevelFromConfig(progress);
  }

  private calculateOverallConfidence(
    confidences: ConfidenceLevel[]
  ): ConfidenceLevel {
    if (confidences.length === 0) return 'weak';

    const scores: number[] = confidences.map((c) =>
      c === 'strong' ? 2 : c === 'moderate' ? 1 : 0
    );
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (average >= 1.5) return 'strong';
    if (average >= 0.5) return 'moderate';
    return 'weak';
  }

  // ==================== New Items ====================

  /**
   * Gets IDs of items that have never been practiced.
   */
  getNewItems(type: LearningItemType, count?: number): string[] {
    const allItemIds = this.getAllItemIds(type);
    const practiced = new Set(
      this.getAllProgressByType(type)
        .filter((p) => p.totalAttempts > 0)
        .map((p) => p.itemId.toLowerCase())
    );

    const newItems = allItemIds.filter((id) => !practiced.has(id.toLowerCase()));

    if (count !== undefined) {
      return newItems.slice(0, count);
    }
    return newItems;
  }

  /**
   * Gets new (unpracticed) items for a specific finger.
   */
  getNewItemsForFinger(fingerId: FingerId): string[] {
    const fingerChars = this.characterRepo.getByFinger(fingerId);
    const practiced = new Set(
      this.progressRepo
        .getAllCharacterProgress()
        .filter((p) => p.totalAttempts > 0)
        .map((p) => p.itemId.toLowerCase())
    );

    return fingerChars
      .filter((c) => !practiced.has(c.char.toLowerCase()))
      .map((c) => c.char);
  }

  // ==================== Helpers ====================

  private getAllProgressByType(type: LearningItemType): LearningProgress[] {
    switch (type) {
      case 'character':
        return this.progressRepo.getAllCharacterProgress();
      case 'powerChord':
        return this.progressRepo.getAllPowerChordProgress();
      case 'word':
        return this.progressRepo.getAllWordProgress();
    }
  }

  private getAllItemIds(type: LearningItemType): string[] {
    switch (type) {
      case 'character':
        return this.characterRepo.getAll().map((c) => c.char);
      case 'powerChord':
        // Would need PowerChordRepository
        return [];
      case 'word':
        // Would need WordRepository
        return [];
    }
  }

  private getTotalItemCount(type: LearningItemType): number {
    switch (type) {
      case 'character':
        return this.characterRepo.getAll().length;
      case 'powerChord':
        // Would need PowerChordRepository
        return 0;
      case 'word':
        // Would need WordRepository
        return 0;
    }
  }
}

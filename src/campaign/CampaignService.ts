/**
 * Campaign Service
 *
 * Service managing campaign state, persistence, and business logic
 * for chapter progression.
 *
 * Implements ICampaignService for dependency injection.
 */

import {
  ChapterId,
  CampaignState,
  ChapterStatus,
  ChapterMasteryProgress,
  UnlockableFeature,
  ChapterDefinition,
} from './types';
import { MasteryLevel } from '../domain';
import {
  CAMPAIGN_STORAGE_KEY,
  CHAPTER_MAP,
  CHAPTERS,
  ALWAYS_AVAILABLE_FEATURES,
  BOSS_REQUIREMENTS,
  createInitialCampaignState,
  arePrerequisitesMet,
  getDependentChapters,
} from './constants';
import type { ICampaignService, CampaignStateCallback } from '../services/interfaces';
import type { Repositories } from '../data';

/**
 * Repository getter for legacy singleton support.
 * Set by ServiceContainer during initialization.
 */
let _repositoriesGetter: (() => Repositories) | null = null;

/**
 * Set the repository getter for legacy singleton support.
 * Called by ServiceContainer during initialization.
 * @internal
 */
export function setRepositoriesGetter(getter: () => Repositories): void {
  _repositoriesGetter = getter;
}

/**
 * Dependencies for CampaignService.
 */
export interface CampaignServiceDependencies {
  repositories: Repositories;
}

/**
 * Implementation of ICampaignService.
 *
 * Can be instantiated via constructor (for DI) or accessed as singleton
 * for backward compatibility.
 */
export class CampaignServiceImpl implements ICampaignService {
  private static instance: CampaignServiceImpl | null = null;
  private state: CampaignState;
  private subscribers: Set<CampaignStateCallback> = new Set();
  private readonly repositories: Repositories | null;

  /**
   * Create a new CampaignService instance.
   * @param deps Optional dependencies. If not provided, uses getServiceRepositories lazily.
   */
  constructor(deps?: CampaignServiceDependencies) {
    this.repositories = deps?.repositories ?? null;
    this.state = this.loadState();
  }

  /**
   * Get the singleton instance (for backward compatibility).
   * @deprecated Use dependency injection via ServiceContainer instead.
   */
  static getInstance(): CampaignServiceImpl {
    if (!CampaignServiceImpl.instance) {
      CampaignServiceImpl.instance = new CampaignServiceImpl();
    }
    return CampaignServiceImpl.instance;
  }

  /**
   * Reset the singleton instance (for testing).
   */
  static resetInstance(): void {
    CampaignServiceImpl.instance = null;
  }

  /**
   * Get repositories, either from injected deps or from the registered getter.
   */
  private getRepositories(): Repositories {
    if (this.repositories) {
      return this.repositories;
    }
    if (!_repositoriesGetter) {
      throw new Error(
        'CampaignService: repositories not available. ' +
        'Ensure ServiceContainer is initialized before using the legacy singleton.'
      );
    }
    return _repositoriesGetter();
  }

  /**
   * Load state from localStorage, falling back to initial state if invalid.
   */
  private loadState(): CampaignState {
    try {
      const stored = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      if (!stored) {
        return createInitialCampaignState();
      }

      const parsed = JSON.parse(stored) as CampaignState;

      // Validate basic structure
      if (!this.isValidState(parsed)) {
        console.warn('Invalid campaign state in storage, resetting');
        return createInitialCampaignState();
      }

      // Repair any inconsistent state (e.g., completed chapters with locked dependents)
      const repairedState = this.repairState(parsed);
      if (repairedState !== parsed) {
        localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(repairedState));
      }

      return repairedState;
    } catch (error) {
      console.error('Failed to load campaign state:', error);
      return createInitialCampaignState();
    }
  }

  /**
   * Repair any inconsistencies in loaded state.
   * Ensures completed chapters have their dependents unlocked.
   */
  private repairState(state: CampaignState): CampaignState {
    let needsRepair = false;
    const chapters = { ...state.chapters };

    // For each completed chapter, ensure dependents are unlocked
    for (const chapter of CHAPTERS) {
      if (chapters[chapter.id]?.isCompleted) {
        const dependents = getDependentChapters(chapter.id);
        for (const dependent of dependents) {
          if (arePrerequisitesMet(dependent.id, chapters) && !chapters[dependent.id]?.isUnlocked) {
            chapters[dependent.id] = {
              ...chapters[dependent.id],
              isUnlocked: true,
            };
            needsRepair = true;
          }
        }
      }

      // Also check: if boss is defeated, chapter should be completed
      if (chapters[chapter.id]?.bossDefeated && !chapters[chapter.id]?.isCompleted) {
        chapters[chapter.id] = {
          ...chapters[chapter.id],
          isCompleted: true,
          completedAt: chapters[chapter.id].completedAt || (new Date().toISOString() as unknown as Date),
        };
        needsRepair = true;
      }
    }

    if (!needsRepair) {
      return state;
    }

    return {
      ...state,
      chapters,
    };
  }

  /**
   * Basic validation of state structure.
   */
  private isValidState(state: unknown): state is CampaignState {
    if (!state || typeof state !== 'object') return false;
    const s = state as Record<string, unknown>;

    // Check required fields exist
    if (!('mode' in s)) return false;
    if (!('chapters' in s) || typeof s.chapters !== 'object') return false;
    if (!('unlockedFeatures' in s) || !Array.isArray(s.unlockedFeatures)) return false;

    // Verify all chapter IDs exist in state
    for (const chapter of CHAPTERS) {
      if (!(chapter.id in (s.chapters as Record<string, unknown>))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Save current state to localStorage and notify subscribers.
   */
  private saveState(): void {
    try {
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(this.state));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save campaign state:', error);
    }
  }

  /**
   * Notify all subscribers of state change.
   */
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Campaign state subscriber error:', error);
      }
    }
  }

  // ==================== ICampaignService Implementation ====================

  /**
   * Get current campaign state.
   */
  getState(): CampaignState {
    return this.state;
  }

  /**
   * Set the application mode (campaign or freeplay).
   */
  setMode(mode: 'campaign' | 'freeplay'): CampaignState {
    this.state = {
      ...this.state,
      mode,
      startedAt: this.state.startedAt || new Date().toISOString(),
    };
    this.saveState();
    return this.state;
  }

  /**
   * Subscribe to state changes.
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: CampaignStateCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Set the currently active chapter.
   */
  setActiveChapter(chapterId: ChapterId): CampaignState {
    const chapterStatus = this.state.chapters[chapterId];

    // Mark as started if not already
    if (chapterStatus && !chapterStatus.isStarted) {
      this.state = {
        ...this.state,
        chapters: {
          ...this.state.chapters,
          [chapterId]: {
            ...chapterStatus,
            isStarted: true,
          },
        },
      };
    }

    this.state = {
      ...this.state,
      activeChapterId: chapterId,
    };

    this.saveState();
    return this.state;
  }

  /**
   * Mark a chapter as completed, triggering unlocks.
   * Requires boss defeated.
   */
  completeChapter(chapterId: ChapterId): CampaignState {
    const chapter = CHAPTER_MAP.get(chapterId);
    if (!chapter) return this.state;

    // Verify chapter is ready for completion (boss defeated)
    if (!this.isChapterReadyForCompletion(chapterId)) {
      return this.state;
    }

    // Mark chapter as completed
    const updatedChapters: Record<ChapterId, ChapterStatus> = {
      ...this.state.chapters,
      [chapterId]: {
        ...this.state.chapters[chapterId],
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
    };

    // Unlock dependent chapters
    const dependents = getDependentChapters(chapterId);
    for (const dependent of dependents) {
      if (arePrerequisitesMet(dependent.id, updatedChapters)) {
        updatedChapters[dependent.id] = {
          ...updatedChapters[dependent.id],
          isUnlocked: true,
        };
      }
    }

    // Unlock features
    const newUnlockedFeatures = [...this.state.unlockedFeatures];
    const newPendingNotifications = [...this.state.pendingUnlockNotifications];

    for (const feature of chapter.unlocksFeatures) {
      if (!newUnlockedFeatures.includes(feature)) {
        newUnlockedFeatures.push(feature);
        newPendingNotifications.push(feature);
      }
    }

    this.state = {
      ...this.state,
      chapters: updatedChapters,
      unlockedFeatures: newUnlockedFeatures,
      pendingUnlockNotifications: newPendingNotifications,
    };

    this.saveState();
    return this.state;
  }

  /**
   * Record a boss challenge attempt.
   * If score meets target, marks boss as defeated.
   */
  recordBossAttempt(chapterId: ChapterId, scorePercent: number): CampaignState {
    const currentStatus = this.state.chapters[chapterId];
    if (!currentStatus) return this.state;

    const bossReq = BOSS_REQUIREMENTS[chapterId];
    const bossDefeated = currentStatus.bossDefeated || scorePercent >= bossReq.targetScore;
    // Use || 0 to guard against undefined/NaN - only update if new score is actually higher
    const currentBest = currentStatus.bossBestScore || 0;
    const bossBestScore = Math.max(currentBest, scorePercent);

    this.state = {
      ...this.state,
      chapters: {
        ...this.state.chapters,
        [chapterId]: {
          ...currentStatus,
          bossDefeated,
          bossBestScore,
        },
      },
    };

    this.saveState();
    return this.state;
  }

  /**
   * Manually unlock a chapter (and all prerequisites), bypassing boss requirements.
   * Used for experienced users skipping beginner content or testing.
   */
  unlockChapter(chapterId: ChapterId): CampaignState {
    const chapter = CHAPTER_MAP.get(chapterId);
    if (!chapter) return this.state;

    // Collect all chapters that need to be unlocked (prerequisites + target)
    const chaptersToUnlock = this.collectPrerequisites(chapterId);
    chaptersToUnlock.push(chapterId);

    const updatedChapters: Record<ChapterId, ChapterStatus> = {
      ...this.state.chapters,
    };
    const newUnlockedFeatures = [...this.state.unlockedFeatures];

    // Mark all prerequisite chapters and the target chapter as completed
    for (const id of chaptersToUnlock) {
      const chapterDef = CHAPTER_MAP.get(id);
      if (chapterDef) {
        updatedChapters[id] = {
          ...updatedChapters[id],
          isUnlocked: true,
          isStarted: true,
          isCompleted: true,
          completedAt: new Date().toISOString() as unknown as Date,
          bossDefeated: true,
          bossBestScore: 100,
        };

        // Unlock features from this chapter
        for (const feature of chapterDef.unlocksFeatures) {
          if (!newUnlockedFeatures.includes(feature)) {
            newUnlockedFeatures.push(feature);
          }
        }
      }
    }

    // Unlock any dependent chapters that now have prerequisites met
    const dependents = getDependentChapters(chapterId);
    for (const dependent of dependents) {
      if (arePrerequisitesMet(dependent.id, updatedChapters)) {
        updatedChapters[dependent.id] = {
          ...updatedChapters[dependent.id],
          isUnlocked: true,
        };
      }
    }

    this.state = {
      ...this.state,
      chapters: updatedChapters,
      unlockedFeatures: newUnlockedFeatures,
    };

    this.saveState();
    return this.state;
  }

  /**
   * Recursively collect all prerequisite chapter IDs for a given chapter.
   */
  private collectPrerequisites(chapterId: ChapterId): ChapterId[] {
    const chapter = CHAPTER_MAP.get(chapterId);
    if (!chapter) return [];

    const result: ChapterId[] = [];
    for (const prereqId of chapter.requires) {
      // Add all prerequisites of the prerequisite first
      result.push(...this.collectPrerequisites(prereqId));
      // Then add the prerequisite itself
      if (!result.includes(prereqId)) {
        result.push(prereqId);
      }
    }
    return result;
  }

  /**
   * Clear the next pending unlock notification.
   */
  clearPendingUnlock(): CampaignState {
    if (this.state.pendingUnlockNotifications.length === 0) {
      return this.state;
    }

    this.state = {
      ...this.state,
      pendingUnlockNotifications: this.state.pendingUnlockNotifications.slice(1),
    };

    this.saveState();
    return this.state;
  }

  /**
   * Reset campaign to initial state.
   */
  resetCampaign(): CampaignState {
    this.state = createInitialCampaignState();
    this.saveState();
    return this.state;
  }

  /**
   * Check if a chapter is unlocked.
   */
  isChapterUnlocked(chapterId: ChapterId): boolean {
    return this.state.chapters[chapterId]?.isUnlocked ?? false;
  }

  /**
   * Check if a chapter is completed.
   */
  isChapterCompleted(chapterId: ChapterId): boolean {
    return this.state.chapters[chapterId]?.isCompleted ?? false;
  }

  /**
   * Check if a feature is unlocked.
   */
  isFeatureUnlocked(feature: UnlockableFeature): boolean {
    // Always-available features are always unlocked
    if (ALWAYS_AVAILABLE_FEATURES.includes(feature)) {
      return true;
    }
    return this.state.unlockedFeatures.includes(feature);
  }

  /**
   * Get the definition for a chapter.
   */
  getChapterDefinition(chapterId: ChapterId): ChapterDefinition | undefined {
    return CHAPTER_MAP.get(chapterId);
  }

  /**
   * Get chapters that would unlock after completing a given chapter.
   */
  getNextChapters(chapterId: ChapterId): ChapterDefinition[] {
    const chapter = CHAPTER_MAP.get(chapterId);
    if (!chapter) return [];

    // Find chapters that have this chapter as a prerequisite
    // and would be fully unlocked after this completion
    return CHAPTERS.filter((c) => {
      if (!c.requires.includes(chapterId)) return false;

      // Check if all OTHER prerequisites are already met
      const otherReqs = c.requires.filter((r) => r !== chapterId);
      return otherReqs.every((r) => this.state.chapters[r]?.isCompleted);
    });
  }

  /**
   * Check if the entire campaign is complete.
   */
  isCampaignComplete(): boolean {
    return CHAPTERS.every((chapter) => this.state.chapters[chapter.id]?.isCompleted);
  }

  /**
   * Get mastery progress for a chapter.
   */
  getChapterMasteryProgress(chapterId: ChapterId): ChapterMasteryProgress {
    const repos = this.getRepositories();
    const { characters, powerChords, words, progress } = repos;
    const now = new Date();

    let items: { id: string; type: 'character' | 'powerChord' | 'word' }[] = [];

    switch (chapterId) {
      case ChapterId.FINGER_FUNDAMENTALS:
        items = characters.getAll().map((c) => ({ id: c.char, type: 'character' as const }));
        break;
      case ChapterId.POWER_CHORDS_LEFT:
        items = powerChords.getByHand('left').map((pc) => ({ id: pc.id, type: 'powerChord' as const }));
        break;
      case ChapterId.POWER_CHORDS_RIGHT:
        items = powerChords.getByHand('right').map((pc) => ({ id: pc.id, type: 'powerChord' as const }));
        break;
      case ChapterId.POWER_CHORDS_CROSS:
        items = powerChords.getByHand('cross').map((pc) => ({ id: pc.id, type: 'powerChord' as const }));
        break;
      case ChapterId.WORD_CHORDS:
        items = words.getAll().map((w) => ({ id: w.word, type: 'word' as const }));
        break;
    }

    let itemsMastered = 0;
    let itemsFamiliar = 0;
    let itemsLearned = 0;
    let itemsDueForReview = 0;
    let itemsReadyForBoss = 0;
    let earliestNextReview: Date | null = null;

    // Boss unlock thresholds
    const BOSS_ACCURACY_THRESHOLD = 0.80; // 80% accuracy required
    const BOSS_RESPONSE_TIME_THRESHOLD = 4000; // 4000ms max average response time

    for (const item of items) {
      const p = progress.getProgress(item.id, item.type);
      if (p) {
        if (p.totalAttempts > 0) {
          itemsLearned++;
        }
        if (p.masteryLevel === MasteryLevel.MASTERED) {
          itemsMastered++;
        }
        if (p.masteryLevel === MasteryLevel.FAMILIAR) {
          itemsFamiliar++;
        }
        if (p.totalAttempts > 0 && now >= p.nextReviewDate) {
          itemsDueForReview++;
        } else if (p.totalAttempts > 0 && p.nextReviewDate > now) {
          // Track the earliest future review date
          if (!earliestNextReview || p.nextReviewDate < earliestNextReview) {
            earliestNextReview = p.nextReviewDate;
          }
        }

        // Check if item is ready for boss (based on recent attempts window)
        if (p.recentAttempts && p.recentAttempts.length > 0) {
          const correctCount = p.recentAttempts.filter(a => a.correct).length;
          const accuracy = correctCount / p.recentAttempts.length;
          const avgResponseTime = p.recentAttempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / p.recentAttempts.length;

          if (accuracy >= BOSS_ACCURACY_THRESHOLD && avgResponseTime <= BOSS_RESPONSE_TIME_THRESHOLD) {
            itemsReadyForBoss++;
          }
        }
      }
    }

    return {
      itemsMastered,
      itemsFamiliar,
      totalItems: items.length,
      itemsLearned,
      itemsDueForReview,
      nextReviewDate: earliestNextReview,
      itemsReadyForBoss,
    };
  }

  /**
   * Check if all items in a chapter are mastered.
   */
  isChapterMastered(chapterId: ChapterId): boolean {
    const progress = this.getChapterMasteryProgress(chapterId);
    return progress.itemsMastered === progress.totalItems;
  }

  /**
   * Check if boss has been defeated for a chapter.
   */
  isBossDefeated(chapterId: ChapterId): boolean {
    return this.state.chapters[chapterId]?.bossDefeated ?? false;
  }

  /**
   * Check if chapter is ready for completion (boss defeated).
   */
  isChapterReadyForCompletion(chapterId: ChapterId): boolean {
    return this.isBossDefeated(chapterId);
  }
}

/**
 * Default singleton instance for backward compatibility.
 * @deprecated Use dependency injection via ServiceContainer instead.
 */
export const CampaignService = CampaignServiceImpl.getInstance();

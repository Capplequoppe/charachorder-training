/**
 * ICampaignService Interface
 *
 * Defines the public API for campaign management services.
 * Extracted from CampaignService to enable dependency injection and testing.
 *
 * @module services/interfaces
 */

import {
  ChapterId,
  CampaignState,
  ChapterDefinition,
  ChapterMasteryProgress,
  UnlockableFeature,
} from '../../campaign/types';

/**
 * Callback for state change subscriptions.
 */
export type CampaignStateCallback = (state: CampaignState) => void;

/**
 * Interface for campaign management services.
 *
 * Provides methods for:
 * - State management (get, set mode, subscribe)
 * - Chapter progression (start, complete, unlock)
 * - Boss challenge tracking
 * - Progress queries
 */
export interface ICampaignService {
  // ==================== State Management ====================

  /**
   * Get the current campaign state.
   */
  getState(): CampaignState;

  /**
   * Set the application mode (campaign or freeplay).
   * @param mode The mode to set
   * @returns Updated campaign state
   */
  setMode(mode: 'campaign' | 'freeplay'): CampaignState;

  /**
   * Subscribe to state changes.
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe?(callback: CampaignStateCallback): () => void;

  // ==================== Chapter Management ====================

  /**
   * Set the currently active chapter.
   * Marks the chapter as started if not already.
   * @param chapterId The chapter to activate
   * @returns Updated campaign state
   */
  setActiveChapter(chapterId: ChapterId): CampaignState;

  /**
   * Mark a chapter as completed, triggering unlocks.
   * Requires boss to be defeated first.
   * @param chapterId The chapter to complete
   * @returns Updated campaign state
   */
  completeChapter(chapterId: ChapterId): CampaignState;

  /**
   * Check if a chapter is unlocked (prerequisites met).
   * @param chapterId The chapter to check
   */
  isChapterUnlocked(chapterId: ChapterId): boolean;

  /**
   * Check if a chapter has been completed.
   * @param chapterId The chapter to check
   */
  isChapterCompleted(chapterId: ChapterId): boolean;

  /**
   * Check if a chapter is ready for completion (boss defeated).
   * @param chapterId The chapter to check
   */
  isChapterReadyForCompletion(chapterId: ChapterId): boolean;

  // ==================== Boss Management ====================

  /**
   * Record a boss challenge attempt.
   * If score meets target, marks boss as defeated.
   * @param chapterId The chapter whose boss was challenged
   * @param scorePercent Score achieved (0-100)
   * @returns Updated campaign state
   */
  recordBossAttempt(chapterId: ChapterId, scorePercent: number): CampaignState;

  /**
   * Check if the boss has been defeated for a chapter.
   * @param chapterId The chapter to check
   */
  isBossDefeated(chapterId: ChapterId): boolean;

  /**
   * Manually unlock a chapter (bypassing boss defeat requirement).
   * Used for experienced users skipping beginner content or testing.
   * @param chapterId The chapter to unlock
   * @returns Updated campaign state
   */
  unlockChapter(chapterId: ChapterId): CampaignState;

  // ==================== Progress Queries ====================

  /**
   * Get mastery progress for a chapter.
   * Includes counts of mastered, familiar, learning items.
   * @param chapterId The chapter to query
   */
  getChapterMasteryProgress(chapterId: ChapterId): ChapterMasteryProgress;

  /**
   * Check if all items in a chapter are mastered.
   * @param chapterId The chapter to check
   */
  isChapterMastered(chapterId: ChapterId): boolean;

  /**
   * Check if the entire campaign is complete.
   */
  isCampaignComplete(): boolean;

  // ==================== Feature Management ====================

  /**
   * Check if a feature is unlocked.
   * @param feature The feature to check
   */
  isFeatureUnlocked(feature: UnlockableFeature): boolean;

  /**
   * Clear the next pending unlock notification.
   * @returns Updated campaign state
   */
  clearPendingUnlock(): CampaignState;

  // ==================== Chapter Definitions ====================

  /**
   * Get the definition for a chapter.
   * @param chapterId The chapter to get
   */
  getChapterDefinition(chapterId: ChapterId): ChapterDefinition | undefined;

  /**
   * Get chapters that would unlock after completing a given chapter.
   * @param chapterId The chapter being completed
   */
  getNextChapters(chapterId: ChapterId): ChapterDefinition[];

  // ==================== Data Management ====================

  /**
   * Reset campaign to initial state.
   * @returns The reset campaign state
   */
  resetCampaign(): CampaignState;
}

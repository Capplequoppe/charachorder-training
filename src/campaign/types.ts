/**
 * Campaign Mode Type Definitions
 *
 * Core types for the chapter-based learning progression system.
 */

/**
 * Chapter identifiers following the pedagogical progression.
 */
export enum ChapterId {
  FINGER_FUNDAMENTALS = 'finger_fundamentals',
  POWER_CHORDS_LEFT = 'power_chords_left',
  POWER_CHORDS_RIGHT = 'power_chords_right',
  POWER_CHORDS_CROSS = 'power_chords_cross',
  WORD_CHORDS = 'word_chords',
}

/**
 * Features that can be progressively unlocked through campaign progress.
 */
export enum UnlockableFeature {
  CHALLENGES = 'challenges',
  SONGS = 'songs',
  CATEGORIES = 'categories',
  ANALYTICS = 'analytics',
  ACHIEVEMENTS = 'achievements',
  LIBRARY = 'library',
}

/**
 * Component keys for rendering chapter content.
 */
export type ChapterComponentKey =
  | 'characterLearning'
  | 'intraHandLeft'
  | 'intraHandRight'
  | 'crossHand'
  | 'wordChords';

/**
 * Tracks mastery progress for a chapter.
 */
export interface ChapterMasteryProgress {
  /** Number of items mastered */
  itemsMastered: number;
  /** Number of items at familiar level */
  itemsFamiliar: number;
  /** Total number of items in this chapter */
  totalItems: number;
  /** Number of items practiced (totalAttempts > 0) */
  itemsLearned: number;
  /** Number of items due for review */
  itemsDueForReview: number;
  /** Earliest next review date for items not yet due (null if none scheduled) */
  nextReviewDate: Date | null;
  /** Number of items ready for boss (>=80% accuracy AND <=4000ms avg response time in recent window) */
  itemsReadyForBoss: number;
}

/**
 * Tracks the status of an individual chapter.
 */
export interface ChapterStatus {
  /** Whether the chapter is available for the user to access */
  isUnlocked: boolean;
  /** Whether the user has started this chapter */
  isStarted: boolean;
  /** Whether the user has completed this chapter (all mastered + boss defeated) */
  isCompleted: boolean;
  /** Timestamp when the chapter was completed */
  completedAt: Date | null;
  /** Whether the boss challenge has been beaten */
  bossDefeated: boolean;
  /** Best score achieved in boss challenge (percentage) */
  bossBestScore: number;
}

/**
 * Static definition for a chapter in the campaign.
 */
export interface ChapterDefinition {
  /** Unique identifier for the chapter */
  id: ChapterId;
  /** Display number (e.g., "1", "2a", "2b", "2c", "3") */
  number: string;
  /** Short title for the chapter */
  title: string;
  /** Subtitle describing the chapter focus */
  subtitle: string;
  /** Longer description of what the user will learn */
  description: string;
  /** Icon to display for this chapter */
  icon: string;
  /** Component key to determine what content to render */
  componentKey: ChapterComponentKey;
  /** Features that unlock upon completing this chapter */
  unlocksFeatures: UnlockableFeature[];
  /** Chapter IDs that must be completed before this one unlocks */
  requires: ChapterId[];
}

/**
 * Overall campaign progress state persisted to storage.
 */
export interface CampaignState {
  /** Current mode: 'campaign' for guided progression, 'freeplay' for full access, null for not yet selected */
  mode: 'campaign' | 'freeplay' | null;
  /** Status of each chapter */
  chapters: Record<ChapterId, ChapterStatus>;
  /** Currently active chapter (what the user is viewing/practicing) */
  activeChapterId: ChapterId | null;
  /** Features that have been unlocked through campaign progress */
  unlockedFeatures: UnlockableFeature[];
  /** Queue of features pending unlock notification */
  pendingUnlockNotifications: UnlockableFeature[];
  /** When the user started the campaign */
  startedAt: string | null;
}

/**
 * Actions available through the campaign context.
 */
export interface CampaignActions {
  /** Set the application mode */
  setMode: (mode: 'campaign' | 'freeplay') => void;
  /** Set the currently active chapter */
  setActiveChapter: (chapterId: ChapterId) => void;
  /** Mark a chapter as completed, triggering unlocks */
  completeChapter: (chapterId: ChapterId) => void;
  /** Record a boss challenge attempt with score */
  recordBossAttempt: (chapterId: ChapterId, scorePercent: number) => void;
  /** Clear the next pending unlock notification */
  clearPendingUnlock: () => void;
  /** Reset campaign progress (for testing/settings) */
  resetCampaign: () => void;
  /** Manually unlock a chapter (bypassing boss requirement) */
  unlockChapter: (chapterId: ChapterId) => void;
}

/**
 * Query helpers available through the campaign context.
 */
export interface CampaignQueries {
  /** Check if a chapter is unlocked (prerequisites met) */
  isChapterUnlocked: (chapterId: ChapterId) => boolean;
  /** Check if a chapter has been completed */
  isChapterCompleted: (chapterId: ChapterId) => boolean;
  /** Check if a feature is available */
  isFeatureUnlocked: (feature: UnlockableFeature) => boolean;
  /** Get the definition for a chapter */
  getChapterDefinition: (chapterId: ChapterId) => ChapterDefinition | undefined;
  /** Get chapters that would unlock after completing a given chapter */
  getNextChapters: (chapterId: ChapterId) => ChapterDefinition[];
  /** Check if the entire campaign is complete */
  isCampaignComplete: () => boolean;
  /** Get mastery progress for a chapter */
  getChapterMasteryProgress: (chapterId: ChapterId) => ChapterMasteryProgress;
  /** Check if all items in a chapter are mastered */
  isChapterMastered: (chapterId: ChapterId) => boolean;
  /** Check if boss has been defeated for a chapter */
  isBossDefeated: (chapterId: ChapterId) => boolean;
  /** Check if chapter is ready for completion (all mastered + boss defeated) */
  isChapterReadyForCompletion: (chapterId: ChapterId) => boolean;
}

/**
 * Complete context value combining state, actions, and queries.
 */
export interface CampaignContextValue extends CampaignActions, CampaignQueries {
  campaignState: CampaignState;
}

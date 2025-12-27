/**
 * Campaign Configuration Constants
 *
 * Static definitions for chapters, their dependencies, and unlock rules.
 */

import {
  ChapterId,
  ChapterDefinition,
  UnlockableFeature,
  CampaignState,
  ChapterStatus,
} from './types';

/**
 * Chapter definitions in progression order.
 */
export const CHAPTERS: ChapterDefinition[] = [
  {
    id: ChapterId.FINGER_FUNDAMENTALS,
    number: '1',
    title: 'Finger Fundamentals',
    subtitle: 'Learn the keyboard layout',
    description:
      'Master finger-to-key mappings with colors and sounds. Build muscle memory for each finger position and direction.',
    icon: '⌨️',
    componentKey: 'characterLearning',
    unlocksFeatures: [],
    requires: [],
  },
  {
    id: ChapterId.POWER_CHORDS_LEFT,
    number: '2a',
    title: 'Left Hand Power Chords',
    subtitle: '10 essential combinations',
    description:
      'Learn 2-key combinations using only your left hand. Master common digraphs like ER, OR, and OU that appear in thousands of words.',
    icon: '🤚',
    componentKey: 'intraHandLeft',
    unlocksFeatures: [],
    requires: [ChapterId.FINGER_FUNDAMENTALS],
  },
  {
    id: ChapterId.POWER_CHORDS_RIGHT,
    number: '2b',
    title: 'Right Hand Power Chords',
    subtitle: '10 essential combinations',
    description:
      'Learn 2-key combinations using only your right hand. Master common digraphs like TH, ST, and AN that form the backbone of English.',
    icon: '✋',
    componentKey: 'intraHandRight',
    unlocksFeatures: [],
    requires: [ChapterId.FINGER_FUNDAMENTALS],
  },
  {
    id: ChapterId.POWER_CHORDS_CROSS,
    number: '2c',
    title: 'Cross-Hand Power Chords',
    subtitle: '10 bilateral combinations',
    description:
      'Learn 2-key combinations requiring both hands working together. Master synchronization with digraphs like IN, EN, and IT.',
    icon: '🙌',
    componentKey: 'crossHand',
    unlocksFeatures: [UnlockableFeature.CHALLENGES],
    requires: [ChapterId.POWER_CHORDS_LEFT, ChapterId.POWER_CHORDS_RIGHT],
  },
  {
    id: ChapterId.WORD_CHORDS,
    number: '3',
    title: 'Word Chords',
    subtitle: 'Full word combinations',
    description:
      'Apply your power chord skills to learn complete word chords, starting with the most common words in English.',
    icon: '📝',
    componentKey: 'wordChords',
    unlocksFeatures: [UnlockableFeature.SONGS, UnlockableFeature.CATEGORIES],
    requires: [ChapterId.POWER_CHORDS_CROSS],
  },
];

/**
 * Map for O(1) chapter lookup by ID.
 */
export const CHAPTER_MAP = new Map<ChapterId, ChapterDefinition>(
  CHAPTERS.map((chapter) => [chapter.id, chapter])
);

/**
 * Features that are always available regardless of campaign progress.
 */
export const ALWAYS_AVAILABLE_FEATURES: UnlockableFeature[] = [
  UnlockableFeature.ANALYTICS,
  UnlockableFeature.ACHIEVEMENTS,
  UnlockableFeature.LIBRARY,
];

/**
 * LocalStorage key for campaign state persistence.
 */
export const CAMPAIGN_STORAGE_KEY = 'charachorder_campaign_state';

/**
 * Feature display information for unlock notifications.
 */
export const FEATURE_INFO: Record<
  UnlockableFeature,
  { icon: string; name: string; description: string }
> = {
  [UnlockableFeature.CHALLENGES]: {
    icon: '⚡',
    name: 'Challenges',
    description: 'Test your skills with Time Attack and Sprint modes!',
  },
  [UnlockableFeature.SONGS]: {
    icon: '🎵',
    name: 'Songs',
    description: 'Practice chords with rhythm and music!',
  },
  [UnlockableFeature.CATEGORIES]: {
    icon: '📂',
    name: 'Categories',
    description: 'Learn words grouped by topics and themes!',
  },
  [UnlockableFeature.ANALYTICS]: {
    icon: '📊',
    name: 'Progress',
    description: 'Track your learning journey with detailed analytics.',
  },
  [UnlockableFeature.ACHIEVEMENTS]: {
    icon: '🏆',
    name: 'Achievements',
    description: 'Earn badges as you master new skills!',
  },
  [UnlockableFeature.LIBRARY]: {
    icon: '🔍',
    name: 'Library',
    description: 'Browse and reference all available chords.',
  },
};

/**
 * Creates the default status for a chapter.
 */
function createDefaultChapterStatus(isUnlocked: boolean): ChapterStatus {
  return {
    isUnlocked,
    isStarted: false,
    isCompleted: false,
    completedAt: null,
    bossDefeated: false,
    bossBestScore: 0,
  };
}

/**
 * Boss challenge requirements per chapter.
 * Score is percentage of items that must be correctly answered.
 * Fingers and power chords are repeated 3x each in boss mode.
 */
export const BOSS_REQUIREMENTS: Record<ChapterId, { targetScore: number; itemCount: number }> = {
  [ChapterId.FINGER_FUNDAMENTALS]: { targetScore: 80, itemCount: 78 }, // 26 characters × 3
  [ChapterId.POWER_CHORDS_LEFT]: { targetScore: 80, itemCount: 30 }, // 10 × 3
  [ChapterId.POWER_CHORDS_RIGHT]: { targetScore: 80, itemCount: 30 }, // 10 × 3
  [ChapterId.POWER_CHORDS_CROSS]: { targetScore: 80, itemCount: 30 }, // 10 × 3
  [ChapterId.WORD_CHORDS]: { targetScore: 80, itemCount: 20 }, // 20 words (no repetition)
};

/**
 * Creates the initial campaign state for new users.
 * Chapter 1 is unlocked, all others are locked.
 */
export function createInitialCampaignState(): CampaignState {
  const chapters = {} as Record<ChapterId, ChapterStatus>;

  for (const chapter of CHAPTERS) {
    // Only Chapter 1 (no prerequisites) is unlocked initially
    const isUnlocked = chapter.requires.length === 0;
    chapters[chapter.id] = createDefaultChapterStatus(isUnlocked);
  }

  return {
    mode: null,
    chapters,
    activeChapterId: null,
    unlockedFeatures: [...ALWAYS_AVAILABLE_FEATURES],
    pendingUnlockNotifications: [],
    startedAt: null,
  };
}

/**
 * Get chapters that depend on a given chapter.
 * Used to determine what unlocks when a chapter is completed.
 */
export function getDependentChapters(chapterId: ChapterId): ChapterDefinition[] {
  return CHAPTERS.filter((chapter) => chapter.requires.includes(chapterId));
}

/**
 * Check if all prerequisites for a chapter are met.
 */
export function arePrerequisitesMet(
  chapterId: ChapterId,
  chapters: Record<ChapterId, ChapterStatus>
): boolean {
  const chapter = CHAPTER_MAP.get(chapterId);
  if (!chapter) return false;

  return chapter.requires.every((reqId) => chapters[reqId]?.isCompleted);
}

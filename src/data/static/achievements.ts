/**
 * Achievement Definitions
 *
 * Defines all achievements, their criteria, and associated rewards.
 */

// ==================== Types ====================

export enum AchievementCategory {
  PROGRESS = 'progress',
  MASTERY = 'mastery',
  SPEED = 'speed',
  CONSISTENCY = 'consistency',
  EXPLORATION = 'exploration',
  CHALLENGE = 'challenge',
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type CriteriaType = 'count' | 'streak' | 'time' | 'accuracy' | 'compound';

export interface AchievementCriteria {
  type: CriteriaType;
  target: number;
  metric: string;
  comparison?: 'gte' | 'lte' | 'eq';  // Default: gte for count/streak, lte for time
  conditions?: Record<string, unknown>;
}

export interface Reward {
  type: 'theme' | 'sound' | 'badge' | 'title';
  id: string;
  name: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  criteria: AchievementCriteria;
  reward?: Reward;
  hidden?: boolean;
  tier: AchievementTier;
  xpReward?: number;
}

// ==================== Tier Configuration ====================

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

export const TIER_XP: Record<AchievementTier, number> = {
  bronze: 50,
  silver: 100,
  gold: 250,
  platinum: 500,
};

// ==================== Achievement Definitions ====================

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ==================== Progress Achievements ====================
  {
    id: 'first_finger',
    name: 'First Steps',
    description: 'Complete your first finger exercise',
    category: AchievementCategory.PROGRESS,
    icon: '👆',
    criteria: { type: 'count', target: 1, metric: 'fingers_practiced' },
    tier: 'bronze',
    xpReward: 25,
  },
  {
    id: 'all_fingers',
    name: 'Ten Fingers',
    description: 'Practice all 10 character-bearing fingers',
    category: AchievementCategory.PROGRESS,
    icon: '🙌',
    criteria: { type: 'count', target: 10, metric: 'unique_fingers_practiced' },
    tier: 'silver',
  },
  {
    id: 'first_chord',
    name: 'Chord Beginner',
    description: 'Successfully complete your first power chord',
    category: AchievementCategory.PROGRESS,
    icon: '🎵',
    criteria: { type: 'count', target: 1, metric: 'total_correct_chords' },
    tier: 'bronze',
    xpReward: 25,
  },
  {
    id: 'ten_chords',
    name: 'Getting Started',
    description: 'Successfully complete 10 chord exercises',
    category: AchievementCategory.PROGRESS,
    icon: '🎸',
    criteria: { type: 'count', target: 10, metric: 'total_correct_chords' },
    tier: 'bronze',
  },
  {
    id: 'hundred_chords',
    name: 'Century',
    description: 'Successfully complete 100 chord exercises',
    category: AchievementCategory.PROGRESS,
    icon: '💯',
    criteria: { type: 'count', target: 100, metric: 'total_correct_chords' },
    tier: 'silver',
  },
  {
    id: 'five_hundred_chords',
    name: 'Dedicated Learner',
    description: 'Successfully complete 500 chord exercises',
    category: AchievementCategory.PROGRESS,
    icon: '📈',
    criteria: { type: 'count', target: 500, metric: 'total_correct_chords' },
    tier: 'gold',
  },
  {
    id: 'thousand_chords',
    name: 'Chord Master',
    description: 'Successfully complete 1,000 chord exercises',
    category: AchievementCategory.PROGRESS,
    icon: '🏆',
    criteria: { type: 'count', target: 1000, metric: 'total_correct_chords' },
    reward: { type: 'title', id: 'chord_master', name: 'Chord Master' },
    tier: 'platinum',
  },
  {
    id: 'first_word',
    name: 'First Word',
    description: 'Successfully complete your first word chord',
    category: AchievementCategory.PROGRESS,
    icon: '📝',
    criteria: { type: 'count', target: 1, metric: 'total_correct_words' },
    tier: 'bronze',
  },
  {
    id: 'fifty_words',
    name: 'Wordsmith',
    description: 'Successfully complete 50 word exercises',
    category: AchievementCategory.PROGRESS,
    icon: '✍️',
    criteria: { type: 'count', target: 50, metric: 'total_correct_words' },
    tier: 'silver',
  },

  // ==================== Mastery Achievements ====================
  {
    id: 'finger_mastery_5',
    name: 'Finger Familiar',
    description: 'Master 5 finger-character associations',
    category: AchievementCategory.MASTERY,
    icon: '🖐️',
    criteria: { type: 'count', target: 5, metric: 'mastered_characters' },
    tier: 'bronze',
  },
  {
    id: 'finger_mastery_15',
    name: 'Finger Fluent',
    description: 'Master 15 finger-character associations',
    category: AchievementCategory.MASTERY,
    icon: '👐',
    criteria: { type: 'count', target: 15, metric: 'mastered_characters' },
    tier: 'silver',
  },
  {
    id: 'finger_mastery_all',
    name: 'Finger Graduate',
    description: 'Master all finger-character associations',
    category: AchievementCategory.MASTERY,
    icon: '🎓',
    criteria: { type: 'count', target: 26, metric: 'mastered_characters' },
    reward: { type: 'badge', id: 'finger_graduate', name: 'Graduate Badge' },
    tier: 'gold',
  },
  {
    id: 'power_chord_10',
    name: 'Power Player',
    description: 'Master 10 power chords',
    category: AchievementCategory.MASTERY,
    icon: '⚡',
    criteria: { type: 'count', target: 10, metric: 'mastered_power_chords' },
    tier: 'silver',
  },
  {
    id: 'power_chord_25',
    name: 'Chord Champion',
    description: 'Master 25 power chords',
    category: AchievementCategory.MASTERY,
    icon: '🎯',
    criteria: { type: 'count', target: 25, metric: 'mastered_power_chords' },
    tier: 'gold',
  },
  {
    id: 'power_chord_all',
    name: 'Chord Legend',
    description: 'Master all power chords',
    category: AchievementCategory.MASTERY,
    icon: '👑',
    criteria: { type: 'count', target: 50, metric: 'mastered_power_chords' },
    reward: { type: 'sound', id: 'electric_guitar', name: 'Electric Guitar Sound Pack' },
    tier: 'platinum',
  },
  {
    id: 'word_mastery_25',
    name: 'Word Learner',
    description: 'Master 25 word chords',
    category: AchievementCategory.MASTERY,
    icon: '📖',
    criteria: { type: 'count', target: 25, metric: 'mastered_words' },
    tier: 'silver',
  },
  {
    id: 'word_mastery_100',
    name: 'Vocabularian',
    description: 'Master 100 word chords',
    category: AchievementCategory.MASTERY,
    icon: '📚',
    criteria: { type: 'count', target: 100, metric: 'mastered_words' },
    reward: { type: 'theme', id: 'scholar', name: 'Scholar Theme' },
    tier: 'gold',
  },

  // ==================== Speed Achievements ====================
  {
    id: 'quick_finger',
    name: 'Quick Fingers',
    description: 'Complete a finger exercise in under 300ms',
    category: AchievementCategory.SPEED,
    icon: '💨',
    criteria: { type: 'time', target: 300, metric: 'fastest_finger_response', comparison: 'lte' },
    tier: 'silver',
  },
  {
    id: 'lightning_finger',
    name: 'Lightning Reflexes',
    description: 'Complete a finger exercise in under 200ms',
    category: AchievementCategory.SPEED,
    icon: '⚡',
    criteria: { type: 'time', target: 200, metric: 'fastest_finger_response', comparison: 'lte' },
    tier: 'gold',
  },
  {
    id: 'quick_chord',
    name: 'Swift Chord',
    description: 'Complete a power chord in under 500ms',
    category: AchievementCategory.SPEED,
    icon: '🎹',
    criteria: { type: 'time', target: 500, metric: 'fastest_chord_response', comparison: 'lte' },
    tier: 'silver',
  },
  {
    id: 'lightning_chord',
    name: 'Lightning Chord',
    description: 'Complete a power chord in under 300ms',
    category: AchievementCategory.SPEED,
    icon: '⚡',
    criteria: { type: 'time', target: 300, metric: 'fastest_chord_response', comparison: 'lte' },
    tier: 'gold',
  },
  {
    id: 'sprint_bronze',
    name: 'Bronze Sprinter',
    description: 'Achieve bronze medal in any sprint challenge',
    category: AchievementCategory.SPEED,
    icon: '🥉',
    criteria: { type: 'count', target: 1, metric: 'bronze_medals' },
    tier: 'bronze',
  },
  {
    id: 'sprint_silver',
    name: 'Silver Sprinter',
    description: 'Achieve silver medal in any sprint challenge',
    category: AchievementCategory.SPEED,
    icon: '🥈',
    criteria: { type: 'count', target: 1, metric: 'silver_medals' },
    tier: 'silver',
  },
  {
    id: 'sprint_gold',
    name: 'Gold Sprinter',
    description: 'Achieve gold medal in any sprint challenge',
    category: AchievementCategory.SPEED,
    icon: '🥇',
    criteria: { type: 'count', target: 1, metric: 'gold_medals' },
    tier: 'gold',
  },
  {
    id: 'time_attack_100',
    name: 'Time Attack Pro',
    description: 'Score 100+ points in a Time Attack challenge',
    category: AchievementCategory.SPEED,
    icon: '⏱️',
    criteria: { type: 'count', target: 100, metric: 'best_time_attack_score' },
    tier: 'silver',
  },

  // ==================== Consistency Achievements ====================
  {
    id: 'streak_5',
    name: 'Getting Warm',
    description: 'Get 5 correct answers in a row',
    category: AchievementCategory.CONSISTENCY,
    icon: '🌡️',
    criteria: { type: 'streak', target: 5, metric: 'best_streak' },
    tier: 'bronze',
  },
  {
    id: 'streak_10',
    name: 'Hot Streak',
    description: 'Get 10 correct answers in a row',
    category: AchievementCategory.CONSISTENCY,
    icon: '🔥',
    criteria: { type: 'streak', target: 10, metric: 'best_streak' },
    tier: 'bronze',
  },
  {
    id: 'streak_25',
    name: 'On Fire',
    description: 'Get 25 correct answers in a row',
    category: AchievementCategory.CONSISTENCY,
    icon: '🔥',
    criteria: { type: 'streak', target: 25, metric: 'best_streak' },
    tier: 'silver',
  },
  {
    id: 'streak_50',
    name: 'Unstoppable',
    description: 'Get 50 correct answers in a row',
    category: AchievementCategory.CONSISTENCY,
    icon: '🔥',
    criteria: { type: 'streak', target: 50, metric: 'best_streak' },
    reward: { type: 'theme', id: 'fire', name: 'Fire Theme' },
    tier: 'gold',
  },
  {
    id: 'streak_100',
    name: 'Legendary Streak',
    description: 'Get 100 correct answers in a row',
    category: AchievementCategory.CONSISTENCY,
    icon: '💫',
    criteria: { type: 'streak', target: 100, metric: 'best_streak' },
    reward: { type: 'title', id: 'streak_legend', name: 'Streak Legend' },
    tier: 'platinum',
  },
  {
    id: 'perfect_session',
    name: 'Perfectionist',
    description: 'Complete a 10+ item session with 100% accuracy',
    category: AchievementCategory.CONSISTENCY,
    icon: '✨',
    criteria: { type: 'count', target: 1, metric: 'perfect_sessions' },
    tier: 'silver',
  },
  {
    id: 'daily_streak_3',
    name: 'Three Day Streak',
    description: 'Practice for 3 consecutive days',
    category: AchievementCategory.CONSISTENCY,
    icon: '📅',
    criteria: { type: 'streak', target: 3, metric: 'daily_streak' },
    tier: 'bronze',
  },
  {
    id: 'daily_streak_7',
    name: 'Weekly Warrior',
    description: 'Practice for 7 consecutive days',
    category: AchievementCategory.CONSISTENCY,
    icon: '📆',
    criteria: { type: 'streak', target: 7, metric: 'daily_streak' },
    tier: 'silver',
  },
  {
    id: 'daily_streak_30',
    name: 'Monthly Master',
    description: 'Practice for 30 consecutive days',
    category: AchievementCategory.CONSISTENCY,
    icon: '🗓️',
    criteria: { type: 'streak', target: 30, metric: 'daily_streak' },
    reward: { type: 'title', id: 'dedicated', name: 'The Dedicated' },
    tier: 'platinum',
  },

  // ==================== Exploration Achievements ====================
  {
    id: 'first_challenge',
    name: 'Challenger',
    description: 'Complete your first speed challenge',
    category: AchievementCategory.EXPLORATION,
    icon: '🎮',
    criteria: { type: 'count', target: 1, metric: 'challenges_completed' },
    tier: 'bronze',
  },
  {
    id: 'try_time_attack',
    name: 'Time Attacker',
    description: 'Try a Time Attack challenge',
    category: AchievementCategory.EXPLORATION,
    icon: '⏱️',
    criteria: { type: 'count', target: 1, metric: 'time_attacks_completed' },
    tier: 'bronze',
  },
  {
    id: 'try_sprint',
    name: 'Sprinter',
    description: 'Try a Sprint challenge',
    category: AchievementCategory.EXPLORATION,
    icon: '🏃',
    criteria: { type: 'count', target: 1, metric: 'sprints_completed' },
    tier: 'bronze',
  },
  {
    id: 'category_5',
    name: 'Category Explorer',
    description: 'Practice words from 5 different semantic categories',
    category: AchievementCategory.EXPLORATION,
    icon: '🗂️',
    criteria: { type: 'count', target: 5, metric: 'categories_practiced' },
    tier: 'silver',
  },
  {
    id: 'category_all',
    name: 'Category Connoisseur',
    description: 'Practice words from every semantic category',
    category: AchievementCategory.EXPLORATION,
    icon: '📊',
    criteria: { type: 'count', target: 15, metric: 'categories_practiced' },
    tier: 'gold',
  },

  // ==================== Challenge Achievements ====================
  {
    id: 'challenge_10',
    name: 'Challenge Seeker',
    description: 'Complete 10 speed challenges',
    category: AchievementCategory.CHALLENGE,
    icon: '🎯',
    criteria: { type: 'count', target: 10, metric: 'challenges_completed' },
    tier: 'silver',
  },
  {
    id: 'challenge_50',
    name: 'Challenge Master',
    description: 'Complete 50 speed challenges',
    category: AchievementCategory.CHALLENGE,
    icon: '🏅',
    criteria: { type: 'count', target: 50, metric: 'challenges_completed' },
    tier: 'gold',
  },
  {
    id: 'medals_10',
    name: 'Medal Collector',
    description: 'Earn 10 medals in sprint challenges',
    category: AchievementCategory.CHALLENGE,
    icon: '🎖️',
    criteria: { type: 'count', target: 10, metric: 'total_medals' },
    tier: 'silver',
  },

  // ==================== Hidden Achievements ====================
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Practice after midnight',
    category: AchievementCategory.EXPLORATION,
    icon: '🦉',
    criteria: { type: 'compound', target: 1, metric: 'practice_after_midnight' },
    hidden: true,
    tier: 'bronze',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Practice before 6 AM',
    category: AchievementCategory.EXPLORATION,
    icon: '🐦',
    criteria: { type: 'compound', target: 1, metric: 'practice_before_6am' },
    hidden: true,
    tier: 'bronze',
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Master an item after failing it 10+ times',
    category: AchievementCategory.CONSISTENCY,
    icon: '💪',
    criteria: { type: 'count', target: 1, metric: 'difficult_masteries' },
    hidden: true,
    tier: 'silver',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 50 exercises with sub-500ms response time',
    category: AchievementCategory.SPEED,
    icon: '👹',
    criteria: { type: 'count', target: 50, metric: 'fast_responses' },
    hidden: true,
    tier: 'gold',
  },
];

// ==================== Helper Functions ====================

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementsByTier(tier: AchievementTier): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.tier === tier);
}

export function getVisibleAchievements(unlockedIds: string[]): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => !a.hidden || unlockedIds.includes(a.id));
}

export function getAchievementsWithRewards(): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.reward !== undefined);
}

export function getTierColor(tier: AchievementTier): string {
  return TIER_COLORS[tier];
}

export function getTierXp(tier: AchievementTier): number {
  return TIER_XP[tier];
}

export function getCategoryDisplayName(category: AchievementCategory): string {
  const names: Record<AchievementCategory, string> = {
    [AchievementCategory.PROGRESS]: 'Progress',
    [AchievementCategory.MASTERY]: 'Mastery',
    [AchievementCategory.SPEED]: 'Speed',
    [AchievementCategory.CONSISTENCY]: 'Consistency',
    [AchievementCategory.EXPLORATION]: 'Exploration',
    [AchievementCategory.CHALLENGE]: 'Challenge',
  };
  return names[category];
}

export function getCategoryIcon(category: AchievementCategory): string {
  const icons: Record<AchievementCategory, string> = {
    [AchievementCategory.PROGRESS]: '📈',
    [AchievementCategory.MASTERY]: '🎓',
    [AchievementCategory.SPEED]: '⚡',
    [AchievementCategory.CONSISTENCY]: '🔥',
    [AchievementCategory.EXPLORATION]: '🧭',
    [AchievementCategory.CHALLENGE]: '🏆',
  };
  return icons[category];
}

/**
 * Challenge Configuration
 *
 * Configuration for speed challenge modes including Time Attack and Sprint.
 */

// ==================== Challenge Types ====================

export type ChallengeType = 'timeAttack' | 'sprint';
export type ItemType = 'finger' | 'powerChord' | 'word';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Medal = 'none' | 'bronze' | 'silver' | 'gold';

// ==================== Time Attack Configuration ====================

export interface TimeAttackConfig {
  id: string;
  duration: number;           // Seconds
  itemType: ItemType;
  difficulty: Difficulty;
  bonusTimeOnCorrect: number; // Seconds added for correct answer
  penaltyOnWrong: number;     // Seconds subtracted for wrong answer
  displayName: string;
  description: string;
}

export const TIME_ATTACK_PRESETS: TimeAttackConfig[] = [
  {
    id: 'time-attack-finger-beginner',
    duration: 30,
    itemType: 'finger',
    difficulty: 'beginner',
    bonusTimeOnCorrect: 0.5,
    penaltyOnWrong: 1,
    displayName: 'Finger Sprint',
    description: 'Practice individual finger positions',
  },
  {
    id: 'time-attack-finger-intermediate',
    duration: 45,
    itemType: 'finger',
    difficulty: 'intermediate',
    bonusTimeOnCorrect: 0.3,
    penaltyOnWrong: 1.5,
    displayName: 'Finger Challenge',
    description: 'Faster finger position recall',
  },
  {
    id: 'time-attack-powerchord-beginner',
    duration: 45,
    itemType: 'powerChord',
    difficulty: 'beginner',
    bonusTimeOnCorrect: 1,
    penaltyOnWrong: 1.5,
    displayName: 'Power Chord Intro',
    description: 'Practice basic 2-key combinations',
  },
  {
    id: 'time-attack-powerchord-intermediate',
    duration: 60,
    itemType: 'powerChord',
    difficulty: 'intermediate',
    bonusTimeOnCorrect: 0.75,
    penaltyOnWrong: 2,
    displayName: 'Power Chord Rush',
    description: 'Speed up your chord recall',
  },
  {
    id: 'time-attack-powerchord-advanced',
    duration: 90,
    itemType: 'powerChord',
    difficulty: 'advanced',
    bonusTimeOnCorrect: 0.5,
    penaltyOnWrong: 2.5,
    displayName: 'Power Chord Master',
    description: 'Test your chord mastery under pressure',
  },
  {
    id: 'time-attack-word-intermediate',
    duration: 60,
    itemType: 'word',
    difficulty: 'intermediate',
    bonusTimeOnCorrect: 1,
    penaltyOnWrong: 2,
    displayName: 'Word Blitz',
    description: 'Type words as fast as you can',
  },
  {
    id: 'time-attack-word-advanced',
    duration: 90,
    itemType: 'word',
    difficulty: 'advanced',
    bonusTimeOnCorrect: 1.5,
    penaltyOnWrong: 3,
    displayName: 'Word Storm',
    description: 'Ultimate word typing challenge',
  },
];

// ==================== Sprint Configuration ====================

export interface SprintConfig {
  id: string;
  itemCount: number;          // Number of items to complete
  itemType: ItemType;
  difficulty: Difficulty;
  targetTime: number;         // Target time in seconds (for rating)
  bronzeTime: number;         // Bronze medal threshold
  silverTime: number;         // Silver medal threshold
  goldTime: number;           // Gold medal threshold
  displayName: string;
  description: string;
}

export const SPRINT_PRESETS: SprintConfig[] = [
  {
    id: 'sprint-finger-10',
    itemCount: 10,
    itemType: 'finger',
    difficulty: 'beginner',
    targetTime: 20,
    bronzeTime: 30,
    silverTime: 25,
    goldTime: 20,
    displayName: '10 Finger Sprint',
    description: 'Quick finger position test',
  },
  {
    id: 'sprint-finger-20',
    itemCount: 20,
    itemType: 'finger',
    difficulty: 'intermediate',
    targetTime: 35,
    bronzeTime: 50,
    silverTime: 42,
    goldTime: 35,
    displayName: '20 Finger Dash',
    description: 'Extended finger position challenge',
  },
  {
    id: 'sprint-powerchord-10',
    itemCount: 10,
    itemType: 'powerChord',
    difficulty: 'beginner',
    targetTime: 25,
    bronzeTime: 40,
    silverTime: 32,
    goldTime: 25,
    displayName: '10 Chord Sprint',
    description: 'Quick power chord test',
  },
  {
    id: 'sprint-powerchord-20',
    itemCount: 20,
    itemType: 'powerChord',
    difficulty: 'intermediate',
    targetTime: 45,
    bronzeTime: 60,
    silverTime: 50,
    goldTime: 45,
    displayName: '20 Chord Challenge',
    description: 'Extended chord typing test',
  },
  {
    id: 'sprint-powerchord-50',
    itemCount: 50,
    itemType: 'powerChord',
    difficulty: 'advanced',
    targetTime: 100,
    bronzeTime: 150,
    silverTime: 120,
    goldTime: 100,
    displayName: '50 Chord Marathon',
    description: 'Ultimate chord endurance test',
  },
  {
    id: 'sprint-word-20',
    itemCount: 20,
    itemType: 'word',
    difficulty: 'intermediate',
    targetTime: 60,
    bronzeTime: 90,
    silverTime: 72,
    goldTime: 60,
    displayName: '20 Word Sprint',
    description: 'Quick word typing challenge',
  },
  {
    id: 'sprint-word-50',
    itemCount: 50,
    itemType: 'word',
    difficulty: 'advanced',
    targetTime: 120,
    bronzeTime: 180,
    silverTime: 150,
    goldTime: 120,
    displayName: '50 Word Marathon',
    description: 'Extended word typing test',
  },
];

// ==================== Scoring Constants ====================

export const SCORING_CONFIG = {
  basePointsPerItem: 100,

  // Speed bonus: faster responses earn more points
  maxSpeedBonusMs: 200,     // Response time for max speed bonus
  minSpeedBonusMs: 2000,    // Response time for no speed bonus
  speedBonusMultiplier: 1,  // Max 100% bonus for fastest response

  // Streak bonus: consecutive correct answers
  streakBonusPerItem: 0.1,  // 10% per consecutive correct
  maxStreakBonus: 1,        // Max 100% streak bonus

  // Accuracy multiplier
  minAccuracyMultiplier: 0.5,  // 50% minimum
  maxAccuracyMultiplier: 1.0,  // 100% maximum

  // Difficulty multipliers
  difficultyMultipliers: {
    beginner: 1.0,
    intermediate: 1.5,
    advanced: 2.0,
  } as Record<Difficulty, number>,
};

// ==================== Helper Functions ====================

export function getTimeAttackPresets(itemType?: ItemType): TimeAttackConfig[] {
  if (!itemType) return TIME_ATTACK_PRESETS;
  return TIME_ATTACK_PRESETS.filter(p => p.itemType === itemType);
}

export function getSprintPresets(itemType?: ItemType): SprintConfig[] {
  if (!itemType) return SPRINT_PRESETS;
  return SPRINT_PRESETS.filter(p => p.itemType === itemType);
}

export function getTimeAttackById(id: string): TimeAttackConfig | undefined {
  return TIME_ATTACK_PRESETS.find(p => p.id === id);
}

export function getSprintById(id: string): SprintConfig | undefined {
  return SPRINT_PRESETS.find(p => p.id === id);
}

export function getMedalForTime(timeSeconds: number, config: SprintConfig): Medal {
  if (timeSeconds <= config.goldTime) return 'gold';
  if (timeSeconds <= config.silverTime) return 'silver';
  if (timeSeconds <= config.bronzeTime) return 'bronze';
  return 'none';
}

export function getMedalColor(medal: Medal): string {
  switch (medal) {
    case 'gold': return '#ffd700';
    case 'silver': return '#c0c0c0';
    case 'bronze': return '#cd7f32';
    default: return '#666';
  }
}

export function getMedalEmoji(medal: Medal): string {
  switch (medal) {
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
    default: return '🎯';
  }
}

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'beginner': return '#4ade80';     // Green
    case 'intermediate': return '#fbbf24'; // Yellow
    case 'advanced': return '#f87171';     // Red
  }
}

export function getItemTypeDisplayName(itemType: ItemType): string {
  switch (itemType) {
    case 'finger': return 'Fingers';
    case 'powerChord': return 'Power Chords';
    case 'word': return 'Words';
  }
}

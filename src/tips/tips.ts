/**
 * Educational Tip Content
 *
 * This module contains all educational tips that explain learning
 * techniques to users throughout their CharaChorder training journey.
 * Content is based on the whitepaper's scientific foundations.
 */

import { TipId, TipTrigger, type TipDefinition } from './types';

/**
 * All educational tips with detailed content.
 */
export const TIPS: TipDefinition[] = [
  {
    id: TipId.CHORDING_INTRO,
    trigger: TipTrigger.CAMPAIGN_START,
    title: 'The Power of Chording',
    icon: '⚡',
    content:
      'Welcome to a revolutionary way of typing! Unlike traditional keyboards where you press one key at a time, CharaChorder lets you press multiple keys simultaneously to produce entire words or phrases. This is called "chording" - similar to how musicians play chords on a piano.',
    keyPoints: [
      'Parallel input is exponentially faster than sequential typing',
      'Chording recruits the same brain regions used for musical instruments',
      'With practice, you can type at the speed of thought',
    ],
  },
  {
    id: TipId.MULTISENSORY_LEARNING,
    trigger: TipTrigger.FIRST_FINGER_LESSON,
    title: 'Learning Through Multiple Senses',
    icon: '🎨',
    content:
      'This trainer uses cross-modal learning - a scientifically proven technique where multiple senses work together to form stronger memories. Each finger has a unique color and musical note. When you see a color, hear a note, and move your finger together, your brain creates powerful associations that stick.',
    keyPoints: [
      'Color + Sound + Movement = Stronger memory connections',
      'Cross-modal learning speeds up skill acquisition by 40-60%',
      'Your brain naturally binds sensory experiences together',
      'The colors and sounds will become automatic over time',
    ],
  },
  {
    id: TipId.FINGER_MAPPING,
    trigger: TipTrigger.FINGER_INTRO,
    title: 'Your Personal Color-Sound Map',
    icon: '🎹',
    content:
      'Each of your fingers is mapped to a musical note and a color. Your left hand plays lower notes (warmer colors), while your right hand plays higher notes (cooler colors). This chromatic mapping helps you "feel" where characters are without looking. The notes are carefully chosen so common finger combinations sound harmonious together.',
    keyPoints: [
      'Left hand = lower notes, warmer colors (reds, oranges)',
      'Right hand = higher notes, cooler colors (blues, purples)',
      'Common finger pairs produce pleasant musical intervals',
      'Your fingers become instruments with their own voice',
    ],
  },
  {
    id: TipId.DIRECTIONAL_SYSTEM,
    trigger: TipTrigger.DIRECTION_INTRO,
    title: 'Five Directions Per Finger',
    icon: '✋',
    content:
      'Each finger can move in five directions: Up, Down, Left, Right, and Press (straight down). This gives each finger access to five different characters. With 10 fingers and 5 directions each, you have 50 possible inputs - more than enough for the entire alphabet plus common punctuation!',
    keyPoints: [
      'Up, Down, Left, Right, Press - five directions per finger',
      '10 fingers x 5 directions = 50 possible characters',
      'Directions have subtle audio/visual variations to help distinguish them',
    ],
  },
  {
    id: TipId.CHUNKING_THEORY,
    trigger: TipTrigger.POWER_CHORD_START,
    title: 'Power Chords: Atomic Units',
    icon: '🧱',
    content:
      'Power chords are 2-key combinations that your brain learns as single "chunks." Instead of thinking T then H, you learn TH as one atomic unit. This is called chunking - a cognitive technique that dramatically reduces mental load. Professional stenographers use this same principle to type 300+ words per minute.',
    keyPoints: [
      'Chunks are recalled as single units, not individual parts',
      'Common pairs (TH, ST, OU, ING) become muscle memory',
      'Chunking is how experts achieve extraordinary speed',
      'Each power chord produces a unique audio signature',
    ],
  },
  {
    id: TipId.SPACED_REPETITION,
    trigger: TipTrigger.FIRST_REVIEW,
    title: 'Smart Review Timing',
    icon: '📅',
    content:
      'This app uses spaced repetition - a scientifically optimized review schedule. Items you know well appear less often, while challenging items appear more frequently. The algorithm finds the perfect moment to review each item: not too soon (wasting time) and not too late (forgetting). This maximizes learning efficiency.',
    keyPoints: [
      'Easy items are spaced further apart to save time',
      'Difficult items appear more often until mastered',
      'Reviewing at the right moment strengthens long-term memory',
      'The system adapts to your personal learning patterns',
    ],
  },
  {
    id: TipId.MASTERY_CRITERIA,
    trigger: TipTrigger.BOSS_INTRO,
    title: 'What Mastery Means',
    icon: '👑',
    content:
      'Boss mode tests true mastery through three criteria: speed, accuracy, and consistency. An item is mastered when you can recall it automatically - without conscious thought. You need 80% accuracy to pass, but aim for responses under 600ms. That\'s when you know the movement has become automatic.',
    keyPoints: [
      'Mastery = Speed + Accuracy + Consistency',
      '80% accuracy required to pass boss challenges',
      'Target response time: under 600ms for true automaticity',
      'Mastered items require no conscious thought to execute',
    ],
  },
  {
    id: TipId.DOPAMINE_LOOP,
    trigger: TipTrigger.BOSS_VICTORY,
    title: 'Victory Fuels Learning',
    icon: '🏆',
    content:
      'Congratulations on your victory! That feeling of accomplishment isn\'t just satisfying - it\'s physiologically changing your brain. Success triggers dopamine release, which reinforces the neural pathways you just used. Each victory makes it easier to succeed again. This is why gamification works: your brain literally learns to chord.',
    keyPoints: [
      'Success triggers dopamine, reinforcing neural pathways',
      'Positive feedback loops accelerate skill development',
      'Celebrating wins is scientifically beneficial for learning',
      'Streaks and challenges activate reward centers in your brain',
    ],
  },
];

/**
 * Map for quick tip lookup by ID.
 */
export const TIPS_MAP = new Map<TipId, TipDefinition>(
  TIPS.map((tip) => [tip.id, tip])
);

/**
 * Get tip definition by ID.
 */
export function getTipById(id: TipId): TipDefinition | undefined {
  return TIPS_MAP.get(id);
}

/**
 * Map of tips organized by trigger point.
 */
export const TIPS_BY_TRIGGER = new Map<TipTrigger, TipDefinition[]>();

// Populate the trigger map
TIPS.forEach((tip) => {
  const existing = TIPS_BY_TRIGGER.get(tip.trigger) ?? [];
  TIPS_BY_TRIGGER.set(tip.trigger, [...existing, tip]);
});

/**
 * Get all tips for a specific trigger point.
 */
export function getTipsForTrigger(trigger: TipTrigger): TipDefinition[] {
  return TIPS_BY_TRIGGER.get(trigger) ?? [];
}

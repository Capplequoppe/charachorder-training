/**
 * Finger Mnemonics Configuration
 *
 * Memory aids to help users remember which characters belong to each finger.
 * Each mnemonic creates a memorable association between the finger and its characters.
 */

import { FingerId } from '../domain';

export interface FingerMnemonic {
  /** The finger this mnemonic is for */
  fingerId: FingerId;
  /** Short mnemonic phrase */
  phrase: string;
  /** Explanation of the mnemonic */
  explanation: string;
  /** The characters highlighted in the mnemonic */
  highlightedChars: string[];
}

/**
 * Mnemonics for each finger.
 * These help users remember the character-to-finger mappings.
 */
export const FINGER_MNEMONICS: Record<FingerId, FingerMnemonic> = {
  // ==================== LEFT HAND ====================
  l_index: {
    fingerId: 'l_index',
    phrase: 'fingER',
    explanation: 'Your index fingER types E and R',
    highlightedChars: ['e', 'r'],
  },
  l_middle: {
    fingerId: 'l_middle',
    phrase: 'OI! (rude gesture)',
    explanation: 'The middle finger is used for the "OI!" gesture - it types O, I, and period (.)',
    highlightedChars: ['o', 'i', '.'],
  },
  l_ring: {
    fingerId: 'l_ring',
    phrase: "U 'n' me (wedding)",
    explanation: "The ring finger is for 'U and me' - types U, apostrophe ('), and comma (,)",
    highlightedChars: ['u', "'", ','],
  },
  l_pinky: {
    fingerId: 'l_pinky',
    phrase: 'Modifier key',
    explanation: 'The pinky handles modifier keys (Shift, Alt, Layer) - can be customized',
    highlightedChars: [],
  },
  l_thumb_first: {
    fingerId: 'l_thumb_first',
    phrase: 'MiCK V',
    explanation: 'Think "Mick V" (like a name) - types M, C, K, and V',
    highlightedChars: ['m', 'c', 'k', 'v'],
  },
  l_thumb_second: {
    fingerId: 'l_thumb_second',
    phrase: 'ZaG W',
    explanation: 'Zigzag with W - types Z, G, and W',
    highlightedChars: ['z', 'g', 'w'],
  },
  l_thumb_third: {
    fingerId: 'l_thumb_third',
    phrase: 'Modifier key',
    explanation: 'The third thumb key handles modifier keys (Shift, Ctrl, etc.) - can be customized',
    highlightedChars: [],
  },
  l_arrow: {
    fingerId: 'l_arrow',
    phrase: 'Arrow keys',
    explanation: 'The arrow key cluster for navigation - can be customized',
    highlightedChars: [],
  },
  l_trackball: {
    fingerId: 'l_trackball',
    phrase: 'Trackball',
    explanation: 'The trackball/mouse controls - can be customized',
    highlightedChars: [],
  },

  // ==================== RIGHT HAND ====================
  r_index: {
    fingerId: 'r_index',
    phrase: 'TA! (thank you)',
    explanation: 'Say "TA!" to thank someone - types T and A',
    highlightedChars: ['t', 'a'],
  },
  r_middle: {
    fingerId: 'r_middle',
    phrase: 'JoiN L',
    explanation: 'Join the L (like joining a line) - types N, L, and J',
    highlightedChars: ['n', 'l', 'j'],
  },
  r_ring: {
    fingerId: 'r_ring',
    phrase: 'SaY;',
    explanation: 'Say it with style; - types S, Y, and semicolon (;)',
    highlightedChars: ['s', 'y', ';'],
  },
  r_pinky: {
    fingerId: 'r_pinky',
    phrase: 'Modifier key',
    explanation: 'The pinky handles modifier keys (Shift, Alt, Layer) - can be customized',
    highlightedChars: [],
  },
  r_thumb_first: {
    fingerId: 'r_thumb_first',
    phrase: 'HoPeD F',
    explanation: 'I HoPeD For this - types H, P, D, and F',
    highlightedChars: ['h', 'p', 'd', 'f'],
  },
  r_thumb_second: {
    fingerId: 'r_thumb_second',
    phrase: 'BoX Q',
    explanation: 'Put it in a BoX, Q! - types B, X, and Q',
    highlightedChars: ['b', 'x', 'q'],
  },
  r_thumb_third: {
    fingerId: 'r_thumb_third',
    phrase: 'Modifier key',
    explanation: 'The third thumb key handles modifier keys (Shift, Ctrl, etc.) - can be customized',
    highlightedChars: [],
  },
  r_arrow: {
    fingerId: 'r_arrow',
    phrase: 'Arrow keys',
    explanation: 'The arrow key cluster for navigation - can be customized',
    highlightedChars: [],
  },
  r_trackball: {
    fingerId: 'r_trackball',
    phrase: 'Trackball',
    explanation: 'The trackball/mouse controls - can be customized',
    highlightedChars: [],
  },
};

/**
 * Learning stages - groups of 2 fingers to learn together.
 * Ordered by letter frequency (most common first).
 */
export interface LearningStage {
  id: string;
  name: string;
  description: string;
  fingers: FingerId[];
}

export const LEARNING_STAGES: LearningStage[] = [
  {
    id: 'stage-1',
    name: 'Index Fingers',
    description: 'The most common letters: E, R, T, A',
    fingers: ['l_index', 'r_index'],
  },
  {
    id: 'stage-2',
    name: 'Middle Fingers',
    description: 'More common letters: O, I, N, L',
    fingers: ['l_middle', 'r_middle'],
  },
  {
    id: 'stage-3',
    name: 'Ring Fingers',
    description: 'Useful letters and punctuation: U, S, Y',
    fingers: ['l_ring', 'r_ring'],
  },
  {
    id: 'stage-4',
    name: 'First Thumbs',
    description: 'More letters: M, C, K, V, H, P, D, F',
    fingers: ['l_thumb_first', 'r_thumb_first'],
  },
  {
    id: 'stage-5',
    name: 'Second Thumbs',
    description: 'Remaining letters: Z, G, W, B, X, Q',
    fingers: ['l_thumb_second', 'r_thumb_second'],
  },
];

/**
 * Get mnemonic for a finger.
 */
export function getMnemonic(fingerId: FingerId): FingerMnemonic {
  return FINGER_MNEMONICS[fingerId];
}

/**
 * Get stage that contains a finger.
 */
export function getStageForFinger(fingerId: FingerId): LearningStage | undefined {
  return LEARNING_STAGES.find(stage => stage.fingers.includes(fingerId));
}

/**
 * TrainableItem - Unified interface for items that can be trained.
 *
 * This interface provides a common abstraction for PowerChords and Words,
 * allowing training components to work generically without knowing the
 * specific item type.
 *
 * @module domain/entities
 */

import { FingerId } from './Finger';
import { PowerChord } from './PowerChord';
import { Word } from '../aggregates/Word';

/**
 * Type of trainable item, used for repository lookups and progress tracking.
 */
export type TrainableItemType = 'powerChord' | 'word';

/**
 * Display information for a character in a trainable item.
 * Contains all properties needed to render the character in the UI.
 */
export interface DisplayCharacter {
  /** The actual character (lowercase) */
  readonly char: string;
  /** The display version (typically uppercase) */
  readonly displayChar: string;
  /** The color for rendering */
  readonly color: string;
  /** The finger that produces this character */
  readonly fingerId: FingerId;
}

/**
 * Unified interface for items that can be trained.
 *
 * This abstraction allows training components to work with both PowerChords
 * and Words without type-specific code. The training logic only needs to know:
 * - What to display (displayChars, blendedColor)
 * - What input to expect (expectedChars, validOutputWords)
 * - How to track progress (id, type)
 */
export interface TrainableItem {
  /**
   * Unique identifier for progress tracking.
   * For PowerChords: sorted character pair (e.g., 'er', 'th')
   * For Words: the word itself (e.g., 'the', 'and')
   */
  readonly id: string;

  /**
   * Item type for repository lookups.
   * Used when recording attempts to determine which progress map to update.
   */
  readonly type: TrainableItemType;

  /**
   * Characters to display in the UI.
   * Includes color and finger information for each character.
   */
  readonly displayChars: readonly DisplayCharacter[];

  /**
   * Finger IDs involved in producing this item.
   * Used for visual finger indicators.
   */
  readonly fingerIds: readonly FingerId[];

  /**
   * Characters that constitute correct raw input.
   * For PowerChords: the two characters (e.g., {'e', 'r'})
   * For Words: characters in the chord (may differ from word spelling)
   */
  readonly expectedChars: ReadonlySet<string>;

  /**
   * Valid chorded word outputs.
   * For PowerChords: words the chord produces (e.g., {'er', 'our'})
   * For Words: the word itself plus any alternates
   */
  readonly validOutputWords: ReadonlySet<string>;

  /**
   * Blended color for visual feedback.
   * Combines the colors of all constituent characters.
   */
  readonly blendedColor: string;

  /**
   * Display name for UI (optional, for debugging/display).
   */
  readonly displayName?: string;
}

/**
 * Converts a PowerChord to a TrainableItem.
 *
 * @param powerChord - The PowerChord to convert
 * @returns A TrainableItem representation of the power chord
 */
export function powerChordToTrainableItem(powerChord: PowerChord): TrainableItem {
  const [char1, char2] = powerChord.characters;

  const displayChars: DisplayCharacter[] = [
    {
      char: char1.char,
      displayChar: char1.displayChar,
      color: char1.color,
      fingerId: char1.fingerId,
    },
    {
      char: char2.char,
      displayChar: char2.displayChar,
      color: char2.color,
      fingerId: char2.fingerId,
    },
  ];

  const expectedChars = new Set([
    char1.char.toLowerCase(),
    char2.char.toLowerCase(),
  ]);

  // Valid outputs include raw chars and any words the chord produces
  const validOutputWords = new Set([
    ...powerChord.producesWords.map(w => w.toLowerCase()),
  ]);

  return {
    id: powerChord.id,
    type: 'powerChord',
    displayChars,
    fingerIds: [...powerChord.fingerIds],
    expectedChars,
    validOutputWords,
    blendedColor: powerChord.blendedColor,
    displayName: powerChord.displayName,
  };
}

/**
 * Converts a Word to a TrainableItem.
 *
 * @param word - The Word to convert
 * @returns A TrainableItem representation of the word
 */
export function wordToTrainableItem(word: Word): TrainableItem {
  // Extract display characters from the word's chord
  const displayChars: DisplayCharacter[] = word.chord.characters.map(char => ({
    char: char.char,
    displayChar: char.displayChar,
    color: char.color,
    fingerId: char.fingerId,
  }));

  // Expected chars are the chord's characters
  const expectedChars = new Set(
    word.chord.characters.map(c => c.char.toLowerCase())
  );

  // Valid outputs: the word itself
  const validOutputWords = new Set([word.word.toLowerCase()]);

  // Debug: Log item creation for words
  if (import.meta.env?.DEV) {
    console.log('[wordToTrainableItem] Creating TrainableItem:', {
      word: word.word,
      chordId: word.chord.id,
      chordCharacters: word.chord.characters.map(c => c.char),
      expectedChars: [...expectedChars],
      validOutputWords: [...validOutputWords],
    });
  }

  return {
    id: word.word,
    type: 'word',
    displayChars,
    fingerIds: word.chord.fingerIds.slice(),
    expectedChars,
    validOutputWords,
    blendedColor: word.chord.blendedColor,
    displayName: word.displayWord,
  };
}

/**
 * Type guard to check if a TrainableItem is from a PowerChord.
 */
export function isPowerChordItem(item: TrainableItem): boolean {
  return item.type === 'powerChord';
}

/**
 * Type guard to check if a TrainableItem is from a Word.
 */
export function isWordItem(item: TrainableItem): boolean {
  return item.type === 'word';
}

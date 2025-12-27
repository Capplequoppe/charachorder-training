import { Character } from './Character';
import { FingerId, Finger } from './Finger';
import { ColorDefinition } from '../valueObjects/ColorDefinition';
import { NoteDefinition } from '../valueObjects/NoteDefinition';

/**
 * Musical interval names (in order of semitones from 0-11).
 */
export const INTERVAL_NAMES: Record<number, string> = {
  0: 'unison',
  1: 'minor 2nd',
  2: 'major 2nd',
  3: 'minor 3rd',
  4: 'major 3rd',
  5: 'perfect 4th',
  6: 'tritone',
  7: 'perfect 5th',
  8: 'minor 6th',
  9: 'major 6th',
  10: 'minor 7th',
  11: 'major 7th',
};

/**
 * Type of power chord based on which hands are involved.
 */
export type PowerChordHand = 'left' | 'right' | 'cross';


/**
 * Represents a frequently-used 2-key combination (power chord).
 * Power chords are the building blocks for chord learning.
 * They are optimized based on:
 * - Statistical frequency in English text
 * - Ergonomic finger combinations
 * - Consonant musical intervals
 *
 * This is an Entity - has identity based on its id.
 */
export class PowerChord {
  /** Unique identifier (sorted characters, e.g., 'th', 'er') */
  readonly id: string;

  /** The two characters that make up this power chord */
  readonly characters: readonly [Character, Character];

  /** The finger IDs involved */
  readonly fingerIds: readonly [FingerId, FingerId];

  /** Whether this is intra-hand (same hand) or cross-hand */
  readonly hand: PowerChordHand;

  /** Frequency rank (1 = most common pair) */
  readonly frequencyRank: number;

  /**
   * Statistical weight for training prioritization.
   * Calculated as 1/rank, normalized across all power chords.
   */
  readonly frequencyWeight: number;

  /** Words that can be produced by extending this power chord */
  readonly producesWords: readonly string[];

  /**
   * Blended color from combining both finger colors.
   * Used for visual representation.
   */
  readonly blendedColor: string;

  /**
   * Combined note frequencies for audio.
   * Creates a musical interval (ideally consonant).
   */
  readonly noteFrequencies: readonly [number, number];

  /**
   * Creates a new PowerChord entity.
   * Private constructor - use static factory method.
   */
  private constructor(params: {
    id: string;
    characters: [Character, Character];
    fingerIds: [FingerId, FingerId];
    hand: PowerChordHand;
    frequencyRank: number;
    frequencyWeight: number;
    producesWords: string[];
    blendedColor: string;
    noteFrequencies: [number, number];
  }) {
    this.id = params.id;
    this.characters = Object.freeze([...params.characters]) as readonly [Character, Character];
    this.fingerIds = Object.freeze([...params.fingerIds]) as readonly [FingerId, FingerId];
    this.hand = params.hand;
    this.frequencyRank = params.frequencyRank;
    this.frequencyWeight = params.frequencyWeight;
    this.producesWords = Object.freeze([...params.producesWords]);
    this.blendedColor = params.blendedColor;
    this.noteFrequencies = Object.freeze([...params.noteFrequencies]) as readonly [number, number];
  }

  /**
   * Creates a new PowerChord entity.
   */
  static create(params: {
    characters: [Character, Character];
    frequencyRank: number;
    producesWords?: string[];
    noteFrequencies?: [number, number];
  }): PowerChord {
    const [char1, char2] = params.characters;
    const id = PowerChord.createId(char1.char, char2.char);
    const hand = PowerChord.determineHand(char1.fingerId, char2.fingerId);
    const blendedColor = ColorDefinition.blendTwo(char1.color, char2.color);
    const frequencyWeight = 1 / params.frequencyRank;

    return new PowerChord({
      id,
      characters: params.characters,
      fingerIds: [char1.fingerId, char2.fingerId],
      hand,
      frequencyRank: params.frequencyRank,
      frequencyWeight,
      producesWords: params.producesWords ?? [],
      blendedColor,
      noteFrequencies: params.noteFrequencies ?? [0, 0],
    });
  }

  /**
   * Creates a power chord ID from two characters.
   * The ID is the sorted concatenation of the characters.
   */
  static createId(char1: string, char2: string): string {
    return [char1.toLowerCase(), char2.toLowerCase()].sort().join('');
  }

  /**
   * Determines the hand type for a power chord based on finger IDs.
   */
  static determineHand(finger1: FingerId, finger2: FingerId): PowerChordHand {
    const isLeft1 = Finger.isLeftHandId(finger1);
    const isLeft2 = Finger.isLeftHandId(finger2);

    if (isLeft1 && isLeft2) return 'left';
    if (!isLeft1 && !isLeft2) return 'right';
    return 'cross';
  }

  /**
   * Returns true if this power chord equals another.
   * Power chords are equal if they have the same id.
   */
  equals(other: PowerChord): boolean {
    return this.id === other.id;
  }

  /**
   * Gets the finger IDs as a tuple.
   */
  get fingers(): readonly [FingerId, FingerId] {
    return this.fingerIds;
  }

  /**
   * Gets the musical interval name between the two fingers.
   */
  get interval(): string {
    const [freq1, freq2] = this.noteFrequencies;

    if (freq1 === 0 || freq2 === 0) return 'unknown';

    // Check for octave (exact 2x frequency ratio)
    const ratio = Math.max(freq1, freq2) / Math.min(freq1, freq2);
    if (Math.abs(ratio - 2) < 0.01) {
      return 'octave';
    }

    const semitones = Math.abs(
      NoteDefinition.intervalBetweenFrequencies(freq1, freq2)
    ) % 12;

    return INTERVAL_NAMES[semitones] ?? 'unknown';
  }

  /**
   * Returns true if this power chord produces any complete words.
   */
  get hasWords(): boolean {
    return this.producesWords.length > 0;
  }

  /**
   * Gets the display name (uppercase characters).
   */
  get displayName(): string {
    return this.characters.map((c) => c.displayChar).join(' + ');
  }

  /**
   * Returns true if this is a left-hand only chord.
   */
  get isLeftHand(): boolean {
    return this.hand === 'left';
  }

  /**
   * Returns true if this is a right-hand only chord.
   */
  get isRightHand(): boolean {
    return this.hand === 'right';
  }

  /**
   * Returns true if this is a cross-hand chord.
   */
  get isCrossHand(): boolean {
    return this.hand === 'cross';
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `PowerChord(${this.id}, ${this.displayName}, rank=${this.frequencyRank})`;
  }
}

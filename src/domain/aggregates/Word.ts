import { Chord } from './Chord';

/**
 * Semantic category for word classification.
 * Used for organized learning and practice sessions.
 */
export enum SemanticCategory {
  DETERMINER = 'determiner',
  PRONOUN = 'pronoun',
  PREPOSITION = 'preposition',
  CONJUNCTION = 'conjunction',
  VERB_COMMON = 'verb_common',
  VERB_MODAL = 'verb_modal',
  NOUN_COMMON = 'noun_common',
  ADJECTIVE = 'adjective',
  ADVERB = 'adverb',
  TIME = 'time',
  PLACE = 'place',
  QUESTION = 'question',
  OTHER = 'other',
}

/**
 * Display names for semantic categories.
 */
export const SEMANTIC_CATEGORY_NAMES: Record<SemanticCategory, string> = {
  [SemanticCategory.DETERMINER]: 'Determiners',
  [SemanticCategory.PRONOUN]: 'Pronouns',
  [SemanticCategory.PREPOSITION]: 'Prepositions',
  [SemanticCategory.CONJUNCTION]: 'Conjunctions',
  [SemanticCategory.VERB_COMMON]: 'Common Verbs',
  [SemanticCategory.VERB_MODAL]: 'Modal Verbs',
  [SemanticCategory.NOUN_COMMON]: 'Common Nouns',
  [SemanticCategory.ADJECTIVE]: 'Adjectives',
  [SemanticCategory.ADVERB]: 'Adverbs',
  [SemanticCategory.TIME]: 'Time Words',
  [SemanticCategory.PLACE]: 'Place Words',
  [SemanticCategory.QUESTION]: 'Question Words',
  [SemanticCategory.OTHER]: 'Other',
};

/**
 * Icons for semantic categories (for UI display).
 */
export const SEMANTIC_CATEGORY_ICONS: Record<SemanticCategory, string> = {
  [SemanticCategory.DETERMINER]: '\u{1F4CC}', // pin
  [SemanticCategory.PRONOUN]: '\u{1F464}', // bust
  [SemanticCategory.PREPOSITION]: '\u{1F4CD}', // pin
  [SemanticCategory.CONJUNCTION]: '\u{1F517}', // link
  [SemanticCategory.VERB_COMMON]: '\u{26A1}', // zap
  [SemanticCategory.VERB_MODAL]: '\u{1F4AD}', // thought
  [SemanticCategory.NOUN_COMMON]: '\u{1F4E6}', // package
  [SemanticCategory.ADJECTIVE]: '\u{1F3A8}', // palette
  [SemanticCategory.ADVERB]: '\u{1F3C3}', // runner
  [SemanticCategory.TIME]: '\u{23F0}', // alarm
  [SemanticCategory.PLACE]: '\u{1F5FA}', // map
  [SemanticCategory.QUESTION]: '\u{2753}', // question
  [SemanticCategory.OTHER]: '\u{1F4DD}', // memo
};

/**
 * Represents a word that can be produced by a chord.
 * Words are the ultimate goal of chord learning.
 *
 * This is an Aggregate - a cluster of related objects treated as a unit.
 */
export class Word {
  /** The actual word (lowercase) */
  readonly word: string;

  /** Display version of the word */
  readonly displayWord: string;

  /** The primary chord that produces this word */
  readonly chord: Chord;

  /** Alternative chords that also produce this word (if any) */
  readonly alternativeChords: readonly Chord[];

  /** Word frequency rank (1 = most common) */
  readonly rank: number;

  /** Semantic category for organized learning */
  readonly category: SemanticCategory;

  /**
   * Power chord IDs this word is built from.
   * Used for the "Lego model" of progressive learning.
   * e.g., "the" is built from "th" + "e"
   */
  readonly basedOnPowerChords: readonly string[];

  /**
   * Whether this word has a direct chord mapping.
   * Some words require character-by-character typing.
   */
  readonly hasDirectChord: boolean;

  /**
   * Creates a new Word aggregate.
   * Private constructor - use static factory method.
   */
  private constructor(params: {
    word: string;
    chord: Chord;
    rank: number;
    category: SemanticCategory;
    basedOnPowerChords: string[];
    alternativeChords: Chord[];
    hasDirectChord: boolean;
  }) {
    this.word = params.word.toLowerCase();
    this.displayWord = params.word;
    this.chord = params.chord;
    this.alternativeChords = Object.freeze([...params.alternativeChords]);
    this.rank = params.rank;
    this.category = params.category;
    this.basedOnPowerChords = Object.freeze([...params.basedOnPowerChords]);
    this.hasDirectChord = params.hasDirectChord;
  }

  /**
   * Creates a new Word aggregate.
   */
  static create(
    word: string,
    chord: Chord,
    rank: number,
    category: SemanticCategory = SemanticCategory.OTHER,
    basedOnPowerChords: string[] = [],
    alternativeChords: Chord[] = []
  ): Word {
    return new Word({
      word,
      chord,
      rank,
      category,
      basedOnPowerChords,
      alternativeChords,
      hasDirectChord: true,
    });
  }

  /**
   * Creates a Word without a direct chord (requires character-by-character typing).
   */
  static createWithoutChord(
    word: string,
    rank: number,
    category: SemanticCategory = SemanticCategory.OTHER
  ): Word {
    // Create a placeholder chord
    const placeholderChord = Chord.createFromFingerIds([], [], []);

    return new Word({
      word,
      chord: placeholderChord,
      rank,
      category,
      basedOnPowerChords: [],
      alternativeChords: [],
      hasDirectChord: false,
    });
  }

  /**
   * Returns true if this word equals another.
   * Words are equal if they have the same word string.
   */
  equals(other: Word): boolean {
    return this.word === other.word;
  }

  /**
   * Returns the display name of this word's category.
   */
  get categoryName(): string {
    return SEMANTIC_CATEGORY_NAMES[this.category];
  }

  /**
   * Returns the icon for this word's category.
   */
  get categoryIcon(): string {
    return SEMANTIC_CATEGORY_ICONS[this.category];
  }

  /**
   * Returns the length of the word.
   */
  get length(): number {
    return this.word.length;
  }

  /**
   * Returns true if this is a common word (rank <= 100).
   */
  get isCommon(): boolean {
    return this.rank <= 100;
  }

  /**
   * Returns true if this word has alternative chord mappings.
   */
  get hasAlternatives(): boolean {
    return this.alternativeChords.length > 0;
  }

  /**
   * Returns true if this word is built from power chords.
   */
  get isBuiltFromPowerChords(): boolean {
    return this.basedOnPowerChords.length > 0;
  }

  /**
   * Returns all available chords for this word (primary + alternatives).
   */
  get allChords(): readonly Chord[] {
    return Object.freeze([this.chord, ...this.alternativeChords]);
  }

  /**
   * Returns the number of chord keys required.
   */
  get chordSize(): number {
    return this.chord.size;
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `Word(${this.word}, rank=${this.rank}, category=${this.category})`;
  }
}

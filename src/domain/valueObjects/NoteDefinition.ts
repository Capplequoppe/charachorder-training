import { Direction } from '../enums/Direction';

/**
 * ADSR envelope parameters for audio synthesis.
 * Controls how a note sounds over time.
 */
export interface AudioVariation {
  /** Attack time in milliseconds (how quickly the note reaches full volume) */
  readonly attackMs: number;

  /** Decay time in milliseconds (time to reach sustain level) */
  readonly decayMs: number;

  /** Sustain level from 0-1 (volume during sustained portion) */
  readonly sustainLevel: number;

  /** Release time in milliseconds (fade out time) */
  readonly releaseMs: number;

  /** Pan position from -1 (full left) to 1 (full right) */
  readonly panPosition: number;

  /** Filter brightness offset in Hz (positive = brighter, negative = darker) */
  readonly brightnessOffset: number;

  /** Optional chorus effect depth (0-1, typically 0.2-0.4 for subtle effect) */
  readonly chorusDepth?: number;
}

/**
 * Default ADSR values for the press direction (base sound).
 */
const DEFAULT_ADSR: AudioVariation = {
  attackMs: 10,
  decayMs: 100,
  sustainLevel: 0.7,
  releaseMs: 300,
  panPosition: 0,
  brightnessOffset: 0,
};

/**
 * Represents a finger's musical note with directional variations.
 * Notes are assigned based on research to create consonant intervals
 * between frequently paired fingers.
 *
 * This is a Value Object - immutable and defined by its attributes.
 */
export class NoteDefinition {
  /** Note name in scientific pitch notation (e.g., 'B4') */
  readonly name: string;

  /** Frequency in Hz (e.g., 493.88) */
  readonly frequency: number;

  /** Directional audio variations */
  readonly variations: Readonly<Record<Direction, AudioVariation>>;

  /**
   * Creates a new NoteDefinition.
   * Private constructor - use static factory methods.
   */
  private constructor(
    name: string,
    frequency: number,
    variations: Record<Direction, AudioVariation>
  ) {
    this.name = name;
    this.frequency = frequency;
    this.variations = Object.freeze(
      Object.fromEntries(
        Object.entries(variations).map(([k, v]) => [k, Object.freeze({ ...v })])
      )
    ) as Record<Direction, AudioVariation>;
  }

  /**
   * Creates a NoteDefinition with auto-generated audio variations.
   * - Up: Brighter, shorter decay
   * - Down: Darker, longer sustain
   * - Left: Pan slightly left
   * - Right: Pan slightly right
   * - Press: Base sound with subtle chorus
   */
  static create(name: string, frequency: number, basePan: number = 0): NoteDefinition {
    const variations: Record<Direction, AudioVariation> = {
      [Direction.UP]: {
        attackMs: 5,
        decayMs: 80,
        sustainLevel: 0.5,
        releaseMs: 200,
        panPosition: basePan,
        brightnessOffset: 500, // Brighter
      },
      [Direction.DOWN]: {
        attackMs: 20,
        decayMs: 150,
        sustainLevel: 0.8,
        releaseMs: 500,
        panPosition: basePan,
        brightnessOffset: -300, // Darker
      },
      [Direction.LEFT]: {
        attackMs: 10,
        decayMs: 100,
        sustainLevel: 0.7,
        releaseMs: 300,
        panPosition: Math.max(-1, basePan - 0.3), // Pan left
        brightnessOffset: 0,
      },
      [Direction.RIGHT]: {
        attackMs: 10,
        decayMs: 100,
        sustainLevel: 0.7,
        releaseMs: 300,
        panPosition: Math.min(1, basePan + 0.3), // Pan right
        brightnessOffset: 0,
      },
      [Direction.PRESS]: {
        ...DEFAULT_ADSR,
        panPosition: basePan,
        chorusDepth: 0.3, // Subtle chorus for "presence"
      },
    };

    return new NoteDefinition(name, frequency, variations);
  }

  /**
   * Creates a NoteDefinition with custom variations.
   */
  static createWithVariations(
    name: string,
    frequency: number,
    variations: Record<Direction, AudioVariation>
  ): NoteDefinition {
    return new NoteDefinition(name, frequency, variations);
  }

  /**
   * Gets the audio variation for a specific direction.
   */
  getVariationForDirection(direction: Direction): AudioVariation {
    return this.variations[direction];
  }

  /**
   * Returns true if this NoteDefinition equals another.
   * Value objects are equal if all their attributes are equal.
   */
  equals(other: NoteDefinition): boolean {
    return this.name === other.name && this.frequency === other.frequency;
  }

  /**
   * Returns the MIDI note number for this note.
   * A4 (440Hz) = MIDI note 69
   */
  get midiNote(): number {
    return Math.round(69 + 12 * Math.log2(this.frequency / 440));
  }

  /**
   * Returns the octave of this note.
   */
  get octave(): number {
    const match = this.name.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 4;
  }

  /**
   * Returns the note letter (e.g., 'A', 'B#', 'Db').
   */
  get noteLetter(): string {
    return this.name.replace(/\d+$/, '');
  }

  /**
   * Creates a note one octave higher.
   */
  octaveUp(): NoteDefinition {
    const newFrequency = this.frequency * 2;
    const newOctave = this.octave + 1;
    const newName = `${this.noteLetter}${newOctave}`;
    return NoteDefinition.create(newName, newFrequency);
  }

  /**
   * Creates a note one octave lower.
   */
  octaveDown(): NoteDefinition {
    const newFrequency = this.frequency / 2;
    const newOctave = this.octave - 1;
    const newName = `${this.noteLetter}${newOctave}`;
    return NoteDefinition.create(newName, newFrequency);
  }

  /**
   * Calculates the interval in semitones to another note.
   */
  intervalTo(other: NoteDefinition): number {
    return NoteDefinition.intervalBetweenFrequencies(this.frequency, other.frequency);
  }

  /**
   * Calculates the interval in semitones between two frequencies.
   * Static helper for use when you don't have NoteDefinition objects.
   */
  static intervalBetweenFrequencies(freq1: number, freq2: number): number {
    if (freq1 === 0 || freq2 === 0) return 0;
    return Math.round(12 * Math.log2(freq2 / freq1));
  }

  /**
   * Converts a frequency to MIDI note number.
   * A4 (440Hz) = MIDI note 69
   */
  static frequencyToMidi(frequency: number): number {
    if (frequency <= 0) return 0;
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }
}

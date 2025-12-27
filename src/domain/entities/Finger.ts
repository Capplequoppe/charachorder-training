import { Hand } from '../enums/Hand';
import { FingerType } from '../enums/FingerType';
import { ColorDefinition } from '../valueObjects/ColorDefinition';
import { NoteDefinition } from '../valueObjects/NoteDefinition';

/**
 * Unique identifier for each finger.
 * Format: {hand}_{fingerType}
 * Note: 'middle' is called 'long' in some CharaChorder documentation.
 */
export type FingerId =
  | 'l_pinky'
  | 'l_ring'
  | 'l_middle'
  | 'l_index'
  | 'l_thumb_inner'
  | 'l_thumb_outer'
  | 'r_pinky'
  | 'r_ring'
  | 'r_middle'
  | 'r_index'
  | 'r_thumb_inner'
  | 'r_thumb_outer';

/**
 * All finger IDs for the left hand.
 */
export const LEFT_FINGER_IDS: FingerId[] = [
  'l_pinky',
  'l_ring',
  'l_middle',
  'l_index',
  'l_thumb_inner',
  'l_thumb_outer',
];

/**
 * All finger IDs for the right hand.
 */
export const RIGHT_FINGER_IDS: FingerId[] = [
  'r_pinky',
  'r_ring',
  'r_middle',
  'r_index',
  'r_thumb_inner',
  'r_thumb_outer',
];

/**
 * All finger IDs in left-to-right visual order.
 */
export const ALL_FINGER_IDS: FingerId[] = [
  ...LEFT_FINGER_IDS,
  ...RIGHT_FINGER_IDS,
];

/**
 * Position for hand/finger visualization.
 * Coordinates are percentages (0-100) within the visualization container.
 */
export interface VisualPosition {
  /** Percentage from left edge */
  readonly x: number;
  /** Percentage from top edge */
  readonly y: number;
}

/**
 * Represents a physical finger with its sensory properties.
 * Each finger has a unique combination of:
 * - Color (based on pitch-color psychology)
 * - Musical note (optimized for consonant chord intervals)
 * - Visual position (for UI rendering)
 *
 * This is an Entity - has identity based on its id (FingerId).
 */
export class Finger {
  /** Unique identifier (e.g., 'l_index', 'r_thumb_inner') */
  readonly id: FingerId;

  /** Which hand this finger belongs to */
  readonly hand: Hand;

  /** The type/position of finger */
  readonly type: FingerType;

  /** Human-readable display name (e.g., 'Left Index') */
  readonly displayName: string;

  /** Short display name (e.g., 'L.Index') */
  readonly shortName: string;

  /** Color definition with directional variations */
  readonly color: ColorDefinition;

  /** Musical note definition (undefined for pinky fingers which have no characters) */
  readonly note: NoteDefinition | undefined;

  /** Position for visualization */
  readonly visualPosition: VisualPosition;

  /** Whether this finger has typeable characters assigned */
  readonly hasCharacters: boolean;

  /**
   * Creates a new Finger entity.
   * Private constructor - use static factory method.
   */
  private constructor(
    id: FingerId,
    hand: Hand,
    type: FingerType,
    displayName: string,
    shortName: string,
    color: ColorDefinition,
    visualPosition: VisualPosition,
    hasCharacters: boolean,
    note?: NoteDefinition
  ) {
    this.id = id;
    this.hand = hand;
    this.type = type;
    this.displayName = displayName;
    this.shortName = shortName;
    this.color = color;
    this.note = note;
    this.visualPosition = Object.freeze({ ...visualPosition });
    this.hasCharacters = hasCharacters;
  }

  /**
   * Creates a new Finger entity with all properties.
   */
  static create(params: {
    id: FingerId;
    hand: Hand;
    type: FingerType;
    displayName: string;
    shortName: string;
    color: ColorDefinition;
    visualPosition: VisualPosition;
    hasCharacters: boolean;
    note?: NoteDefinition;
  }): Finger {
    return new Finger(
      params.id,
      params.hand,
      params.type,
      params.displayName,
      params.shortName,
      params.color,
      params.visualPosition,
      params.hasCharacters,
      params.note
    );
  }

  /**
   * Creates a FingerId from hand and finger type.
   */
  static createId(hand: Hand, type: FingerType): FingerId {
    const handPrefix = hand === Hand.LEFT ? 'l' : 'r';
    const typeMap: Record<FingerType, string> = {
      [FingerType.PINKY]: 'pinky',
      [FingerType.RING]: 'ring',
      [FingerType.MIDDLE]: 'middle',
      [FingerType.INDEX]: 'index',
      [FingerType.THUMB_INNER]: 'thumb_inner',
      [FingerType.THUMB_OUTER]: 'thumb_outer',
    };
    return `${handPrefix}_${typeMap[type]}` as FingerId;
  }

  /**
   * Parses a FingerId into its components.
   */
  static parseId(id: FingerId): { hand: Hand; type: FingerType } {
    const [handPrefix, ...typeParts] = id.split('_');
    const typeString = typeParts.join('_');

    const hand = handPrefix === 'l' ? Hand.LEFT : Hand.RIGHT;

    const typeMap: Record<string, FingerType> = {
      pinky: FingerType.PINKY,
      ring: FingerType.RING,
      middle: FingerType.MIDDLE,
      index: FingerType.INDEX,
      thumb_inner: FingerType.THUMB_INNER,
      thumb_outer: FingerType.THUMB_OUTER,
    };

    return { hand, type: typeMap[typeString] };
  }

  /**
   * Checks if a finger ID belongs to the left hand.
   */
  static isLeftHandId(id: FingerId): boolean {
    return id.startsWith('l_');
  }

  /**
   * Checks if a finger ID belongs to the right hand.
   */
  static isRightHandId(id: FingerId): boolean {
    return id.startsWith('r_');
  }

  /**
   * Returns true if this finger equals another.
   * Fingers are equal if they have the same id.
   */
  equals(other: Finger): boolean {
    return this.id === other.id;
  }

  /**
   * Returns true if this finger is on the left hand.
   */
  get isLeftHand(): boolean {
    return this.hand === Hand.LEFT;
  }

  /**
   * Returns true if this finger is on the right hand.
   */
  get isRightHand(): boolean {
    return this.hand === Hand.RIGHT;
  }

  /**
   * Returns true if this is a thumb.
   */
  get isThumb(): boolean {
    return this.type === FingerType.THUMB_INNER || this.type === FingerType.THUMB_OUTER;
  }

  /**
   * Returns true if this is a pinky.
   */
  get isPinky(): boolean {
    return this.type === FingerType.PINKY;
  }

  /**
   * Returns the note frequency, or 0 if no note is assigned.
   */
  get noteFrequency(): number {
    return this.note?.frequency ?? 0;
  }

  /**
   * Returns the note name, or empty string if no note is assigned.
   */
  get noteName(): string {
    return this.note?.name ?? '';
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `Finger(${this.id}, ${this.displayName})`;
  }
}

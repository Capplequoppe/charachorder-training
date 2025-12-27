/**
 * Repository for accessing character-finger mappings.
 * Provides read-only access to character configuration.
 */

import {
  Character,
  Finger,
  FingerId,
  Direction,
  Hand,
} from '../../domain';
import { FINGER_CONFIG } from '../static/fingerConfig';
import {
  CHARACTER_CONFIG,
  CharacterConfigEntry,
  CHAR_TO_CONFIG,
} from '../static/characterConfig';

/**
 * Interface for character repository operations.
 */
export interface ICharacterRepository {
  /** Gets all characters */
  getAll(): Character[];

  /** Gets a character by its string value */
  getByChar(char: string): Character | undefined;

  /** Gets all characters for a specific finger */
  getByFinger(fingerId: FingerId): Character[];

  /** Gets the character for a specific finger and direction */
  getByFingerAndDirection(
    fingerId: FingerId,
    direction: Direction
  ): Character | undefined;

  /** Gets all characters for a specific hand */
  getByHand(hand: Hand): Character[];

  /** Gets all printable characters */
  getPrintable(): Character[];

  /** Gets the finger ID for a character */
  getFingerForChar(char: string): FingerId | undefined;

  /** Gets the color for a character */
  getColorForChar(char: string): string | undefined;
}

/**
 * Character repository implementation.
 * Builds Character entities from static configuration.
 */
export class CharacterRepository implements ICharacterRepository {
  private characters: Character[];
  private charMap: Map<string, Character>;
  private fingerMap: Map<FingerId, Character[]>;
  private fingerDirectionMap: Map<string, Character>;

  constructor() {
    // Build character entities from config
    this.characters = CHARACTER_CONFIG.map((entry) =>
      this.buildCharacter(entry)
    );

    // Build lookup maps
    this.charMap = new Map(
      this.characters.map((c) => [c.char.toLowerCase(), c])
    );

    this.fingerMap = new Map();
    for (const char of this.characters) {
      const existing = this.fingerMap.get(char.fingerId) || [];
      existing.push(char);
      this.fingerMap.set(char.fingerId, existing);
    }

    this.fingerDirectionMap = new Map(
      this.characters.map((c) => [`${c.fingerId}:${c.direction}`, c])
    );
  }

  private buildCharacter(entry: CharacterConfigEntry): Character {
    const finger = FINGER_CONFIG[entry.fingerId];
    const color = finger.color.variations[entry.direction];

    return Character.create(
      entry.char,
      entry.fingerId,
      entry.direction,
      color,
      true // All entries in CHARACTER_CONFIG are printable
    );
  }

  getAll(): Character[] {
    return [...this.characters];
  }

  getByChar(char: string): Character | undefined {
    return this.charMap.get(char.toLowerCase());
  }

  getByFinger(fingerId: FingerId): Character[] {
    return [...(this.fingerMap.get(fingerId) || [])];
  }

  getByFingerAndDirection(
    fingerId: FingerId,
    direction: Direction
  ): Character | undefined {
    return this.fingerDirectionMap.get(`${fingerId}:${direction}`);
  }

  getByHand(hand: Hand): Character[] {
    return this.characters.filter((c) =>
      hand === Hand.LEFT ? Finger.isLeftHandId(c.fingerId) : !Finger.isLeftHandId(c.fingerId)
    );
  }

  getPrintable(): Character[] {
    return this.characters.filter((c) => c.isPrintable);
  }

  getFingerForChar(char: string): FingerId | undefined {
    const config = CHAR_TO_CONFIG.get(char.toLowerCase());
    return config?.fingerId;
  }

  getColorForChar(char: string): string | undefined {
    const character = this.getByChar(char);
    return character?.color;
  }
}

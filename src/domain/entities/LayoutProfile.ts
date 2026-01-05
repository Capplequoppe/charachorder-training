/**
 * LayoutProfile Entity
 *
 * Represents a custom keyboard layout profile.
 * This is an Entity - has identity based on its id.
 */

import { FingerId } from './Finger';
import { Direction } from '../enums/Direction';
import { CharacterMapping } from '../valueObjects/CharacterMapping';

/**
 * Represents a custom keyboard layout profile.
 * Contains a collection of character mappings that override the default layout.
 */
export class LayoutProfile {
  /** Unique identifier (UUID) */
  readonly id: string;

  /** User-defined name */
  readonly name: string;

  /** ISO timestamp of creation */
  readonly createdAt: Date;

  /** ISO timestamp of last modification */
  readonly updatedAt: Date;

  /** Custom character mappings (overrides only) */
  readonly mappings: readonly CharacterMapping[];

  /**
   * Private constructor - use static factory methods.
   */
  private constructor(
    id: string,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    mappings: CharacterMapping[]
  ) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.mappings = Object.freeze([...mappings]);
  }

  /**
   * Creates a new LayoutProfile with a generated ID.
   * @param name - The profile name
   */
  static create(name: string): LayoutProfile {
    const now = new Date();
    return new LayoutProfile(
      crypto.randomUUID(),
      name.trim() || 'New Layout',
      now,
      now,
      []
    );
  }

  /**
   * Creates a LayoutProfile from stored data (for deserialization).
   * @param data - Plain object with profile data
   */
  static fromPlain(data: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    mappings: Array<{
      char: string;
      fingerId: FingerId;
      direction: Direction;
    }>;
  }): LayoutProfile {
    const mappings = data.mappings.map((m) => CharacterMapping.fromPlain(m));
    return new LayoutProfile(
      data.id,
      data.name,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      mappings
    );
  }

  /**
   * Converts to a plain object (for serialization).
   */
  toPlain(): {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    mappings: Array<{
      char: string;
      fingerId: FingerId;
      direction: Direction;
    }>;
  } {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      mappings: this.mappings.map((m) => m.toPlain()),
    };
  }

  /**
   * Returns true if this profile equals another.
   * Entities are equal if they have the same identity (id).
   */
  equals(other: LayoutProfile): boolean {
    return this.id === other.id;
  }

  /**
   * Gets a mapping for a specific character.
   */
  getMappingForChar(char: string): CharacterMapping | undefined {
    return this.mappings.find((m) => m.isForChar(char));
  }

  /**
   * Gets a mapping for a specific finger+direction.
   */
  getMappingForFingerDirection(
    fingerId: FingerId,
    direction: Direction
  ): CharacterMapping | undefined {
    return this.mappings.find((m) => m.isForFingerDirection(fingerId, direction));
  }

  /**
   * Checks if there's a custom mapping for a character.
   */
  hasCustomMappingForChar(char: string): boolean {
    return this.getMappingForChar(char) !== undefined;
  }

  /**
   * Returns the number of custom mappings.
   */
  get mappingCount(): number {
    return this.mappings.length;
  }

  /**
   * Returns true if this profile has no custom mappings.
   */
  get isEmpty(): boolean {
    return this.mappings.length === 0;
  }

  // ==================== Mutation Methods (Return New Instance) ====================

  /**
   * Returns a new profile with the name changed.
   */
  withName(name: string): LayoutProfile {
    return new LayoutProfile(
      this.id,
      name.trim() || 'Unnamed Layout',
      this.createdAt,
      new Date(),
      [...this.mappings]
    );
  }

  /**
   * Returns a new profile with a mapping added or updated.
   */
  withMapping(mapping: CharacterMapping): LayoutProfile {
    // Remove existing mapping for this char (if any)
    const filteredMappings = this.mappings.filter(
      (m) => !m.isForChar(mapping.char)
    );

    return new LayoutProfile(
      this.id,
      this.name,
      this.createdAt,
      new Date(),
      [...filteredMappings, mapping]
    );
  }

  /**
   * Returns a new profile with multiple mappings set.
   */
  withMappings(mappings: CharacterMapping[]): LayoutProfile {
    return new LayoutProfile(
      this.id,
      this.name,
      this.createdAt,
      new Date(),
      mappings
    );
  }

  /**
   * Returns a new profile with a mapping removed.
   */
  withoutMapping(char: string): LayoutProfile {
    const filteredMappings = this.mappings.filter((m) => !m.isForChar(char));

    return new LayoutProfile(
      this.id,
      this.name,
      this.createdAt,
      new Date(),
      filteredMappings
    );
  }

  /**
   * Returns a new profile with all mappings cleared.
   */
  withClearedMappings(): LayoutProfile {
    return new LayoutProfile(
      this.id,
      this.name,
      this.createdAt,
      new Date(),
      []
    );
  }

  /**
   * Creates a duplicate of this profile with a new ID and name.
   */
  duplicate(newName?: string): LayoutProfile {
    const now = new Date();
    return new LayoutProfile(
      crypto.randomUUID(),
      newName?.trim() || `${this.name} (Copy)`,
      now,
      now,
      [...this.mappings]
    );
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `LayoutProfile(${this.id}, "${this.name}", ${this.mappingCount} mappings)`;
  }
}

/**
 * Repository for accessing power chord definitions.
 * Provides read-only access to statistically-derived power chord data.
 */

import {
  PowerChord,
  PowerChordHand,
  FingerId,
} from '../../domain';
import { FINGER_CONFIG } from '../static/fingerConfig';
import {
  POWER_CHORD_CONFIG,
  PowerChordConfigEntry,
  POWER_CHORD_MAP,
} from '../static/powerChordConfig';
import { CharacterRepository } from './CharacterRepository';

/**
 * Interface for power chord repository operations.
 */
export interface IPowerChordRepository {
  /** Gets all power chords */
  getAll(): PowerChord[];

  /** Gets a power chord by ID */
  getById(id: string): PowerChord | undefined;

  /** Gets power chords by hand type */
  getByHand(hand: PowerChordHand): PowerChord[];

  /** Gets power chords up to a certain frequency rank */
  getByFrequencyRank(maxRank: number): PowerChord[];

  /** Gets power chords containing a specific character */
  getByCharacter(char: string): PowerChord[];

  /** Gets power chords that produce words */
  getThatProduceWords(): PowerChord[];

  /** Gets the top N power chords for learning */
  getTopForLearning(n: number): PowerChord[];

  /** Gets a power chord by its two finger IDs (order doesn't matter) */
  getByFingers(fingerId1: FingerId, fingerId2: FingerId): PowerChord | undefined;
}

/**
 * Power chord repository implementation.
 * Builds PowerChord entities from static configuration.
 */
export class PowerChordRepository implements IPowerChordRepository {
  private powerChords: PowerChord[];
  private idMap: Map<string, PowerChord>;
  private characterRepo: CharacterRepository;

  constructor(characterRepo?: CharacterRepository) {
    this.characterRepo = characterRepo || new CharacterRepository();
    this.powerChords = POWER_CHORD_CONFIG.map((entry) =>
      this.buildPowerChord(entry)
    );
    this.idMap = new Map(this.powerChords.map((pc) => [pc.id, pc]));
  }

  private buildPowerChord(entry: PowerChordConfigEntry): PowerChord {
    const char1 = this.characterRepo.getByChar(entry.chars[0]);
    const char2 = this.characterRepo.getByChar(entry.chars[1]);

    if (!char1 || !char2) {
      throw new Error(
        `Invalid power chord config: characters not found for ${entry.id}`
      );
    }

    const finger1 = FINGER_CONFIG[char1.fingerId];
    const finger2 = FINGER_CONFIG[char2.fingerId];

    // Get note frequencies (may be undefined for pinky fingers)
    const freq1 = finger1.note?.frequency ?? 0;
    const freq2 = finger2.note?.frequency ?? 0;
    const noteFrequencies: [number, number] = [
      Math.min(freq1, freq2),
      Math.max(freq1, freq2),
    ];

    return PowerChord.create({
      characters: [char1, char2],
      frequencyRank: entry.frequencyRank,
      producesWords: entry.producesWords,
      noteFrequencies,
    });
  }

  getAll(): PowerChord[] {
    return [...this.powerChords];
  }

  getById(id: string): PowerChord | undefined {
    // Normalize the ID (sorted characters)
    const normalizedId = id.toLowerCase().split('').sort().join('');
    return this.idMap.get(normalizedId);
  }

  getByHand(hand: PowerChordHand): PowerChord[] {
    return this.powerChords.filter((pc) => pc.hand === hand);
  }

  getByFrequencyRank(maxRank: number): PowerChord[] {
    return this.powerChords.filter((pc) => pc.frequencyRank <= maxRank);
  }

  getByCharacter(char: string): PowerChord[] {
    const lowerChar = char.toLowerCase();
    return this.powerChords.filter(
      (pc) =>
        pc.characters[0].char === lowerChar ||
        pc.characters[1].char === lowerChar
    );
  }

  getThatProduceWords(): PowerChord[] {
    return this.powerChords.filter((pc) => pc.producesWords.length > 0);
  }

  getTopForLearning(n: number): PowerChord[] {
    // Return top N from each category (right, left, cross) for balanced learning
    const rightHand = this.getByHand('right').slice(0, Math.ceil(n / 3));
    const leftHand = this.getByHand('left').slice(0, Math.ceil(n / 3));
    const crossHand = this.getByHand('cross').slice(0, Math.ceil(n / 3));

    return [...rightHand, ...leftHand, ...crossHand].slice(0, n);
  }

  getByFingers(fingerId1: FingerId, fingerId2: FingerId): PowerChord | undefined {
    return this.powerChords.find((pc) => {
      const [f1, f2] = pc.fingerIds;
      return (
        (f1 === fingerId1 && f2 === fingerId2) ||
        (f1 === fingerId2 && f2 === fingerId1)
      );
    });
  }
}

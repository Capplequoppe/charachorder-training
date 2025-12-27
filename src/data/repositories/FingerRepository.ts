/**
 * Repository for accessing finger definitions.
 * Provides read-only access to static finger configuration.
 */

import {
  Finger,
  FingerId,
  Hand,
  FingerType,
  LEFT_FINGER_IDS,
  RIGHT_FINGER_IDS,
} from '../../domain';
import { FINGER_CONFIG, FINGERS_IN_ORDER } from '../static/fingerConfig';

/**
 * Interface for finger repository operations.
 */
export interface IFingerRepository {
  /** Gets all fingers */
  getAll(): Finger[];

  /** Gets a finger by ID */
  getById(id: FingerId): Finger | undefined;

  /** Gets all fingers for a specific hand */
  getByHand(hand: Hand): Finger[];

  /** Gets all fingers of a specific type (across both hands) */
  getByType(type: FingerType): Finger[];

  /** Gets fingers that have characters assigned */
  getWithCharacters(): Finger[];

  /** Gets finger IDs in visual order (left to right) */
  getIdsInOrder(): FingerId[];
}

/**
 * Finger repository implementation.
 * Uses static configuration data.
 */
export class FingerRepository implements IFingerRepository {
  getAll(): Finger[] {
    return FINGERS_IN_ORDER.map((id) => FINGER_CONFIG[id]);
  }

  getById(id: FingerId): Finger | undefined {
    return FINGER_CONFIG[id];
  }

  getByHand(hand: Hand): Finger[] {
    const ids = hand === Hand.LEFT ? LEFT_FINGER_IDS : RIGHT_FINGER_IDS;
    return ids.map((id) => FINGER_CONFIG[id]);
  }

  getByType(type: FingerType): Finger[] {
    return this.getAll().filter((finger) => finger.type === type);
  }

  getWithCharacters(): Finger[] {
    return this.getAll().filter((finger) => finger.hasCharacters);
  }

  getIdsInOrder(): FingerId[] {
    return [...FINGERS_IN_ORDER];
  }
}

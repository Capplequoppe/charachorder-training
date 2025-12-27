/**
 * Domain Entities
 *
 * Entities are objects with identity that persist over time.
 * They represent core concepts in the CharaChorder learning domain.
 */

export {
  Finger,
  LEFT_FINGER_IDS,
  RIGHT_FINGER_IDS,
  ALL_FINGER_IDS,
} from './Finger';

export type { FingerId, VisualPosition } from './Finger';

export { Character } from './Character';

export {
  PowerChord,
  INTERVAL_NAMES,
} from './PowerChord';

export type { PowerChordHand } from './PowerChord';

export {
  powerChordToTrainableItem,
  wordToTrainableItem,
  isPowerChordItem,
  isWordItem,
} from './TrainableItem';

export type {
  TrainableItem,
  TrainableItemType,
  DisplayCharacter,
} from './TrainableItem';

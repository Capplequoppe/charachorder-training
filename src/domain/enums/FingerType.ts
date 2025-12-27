/**
 * Represents the type/position of a finger on the hand.
 * CharaChorder uses all fingers including two thumb positions.
 */
export enum FingerType {
  PINKY = 'pinky',
  RING = 'ring',
  MIDDLE = 'middle',
  INDEX = 'index',
  THUMB_INNER = 'thumb_inner',
  THUMB_OUTER = 'thumb_outer',
}

/**
 * Fingers ordered from pinky to thumb for a single hand.
 */
export const FINGER_TYPES_IN_ORDER: FingerType[] = [
  FingerType.PINKY,
  FingerType.RING,
  FingerType.MIDDLE,
  FingerType.INDEX,
  FingerType.THUMB_INNER,
  FingerType.THUMB_OUTER,
];

/**
 * Display names for finger types.
 */
export const FINGER_TYPE_DISPLAY_NAMES: Record<FingerType, string> = {
  [FingerType.PINKY]: 'Pinky',
  [FingerType.RING]: 'Ring',
  [FingerType.MIDDLE]: 'Middle',
  [FingerType.INDEX]: 'Index',
  [FingerType.THUMB_INNER]: 'Thumb (Inner)',
  [FingerType.THUMB_OUTER]: 'Thumb (Outer)',
};

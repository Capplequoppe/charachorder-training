/**
 * Represents the type/position of a finger or key on the hand.
 * CharaChorder uses all fingers including three thumb positions,
 * plus dedicated arrow and trackball keys.
 */
export enum FingerType {
  PINKY = 'pinky',
  RING = 'ring',
  MIDDLE = 'middle',
  INDEX = 'index',
  THUMB_FIRST = 'thumb_first',
  THUMB_SECOND = 'thumb_second',
  THUMB_THIRD = 'thumb_third',
  ARROW = 'arrow',
  TRACKBALL = 'trackball',
}

/**
 * Fingers ordered from pinky to thumb for a single hand.
 */
export const FINGER_TYPES_IN_ORDER: FingerType[] = [
  FingerType.PINKY,
  FingerType.RING,
  FingerType.MIDDLE,
  FingerType.INDEX,
  FingerType.THUMB_FIRST,
  FingerType.THUMB_SECOND,
  FingerType.THUMB_THIRD,
  FingerType.ARROW,
  FingerType.TRACKBALL,
];

/**
 * Display names for finger types.
 */
export const FINGER_TYPE_DISPLAY_NAMES: Record<FingerType, string> = {
  [FingerType.PINKY]: 'Pinky',
  [FingerType.RING]: 'Ring',
  [FingerType.MIDDLE]: 'Middle',
  [FingerType.INDEX]: 'Index',
  [FingerType.THUMB_FIRST]: 'Thumb 1',
  [FingerType.THUMB_SECOND]: 'Thumb 2',
  [FingerType.THUMB_THIRD]: 'Thumb 3',
  [FingerType.ARROW]: 'Arrow Keys',
  [FingerType.TRACKBALL]: 'Trackball',
};

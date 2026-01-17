/**
 * Research-based color configuration for fingers.
 *
 * Colors are derived from pitch-color psychology research:
 * - High pitch → cool/bright colors (blues, greens)
 * - Low pitch → warm/dark colors (reds, oranges)
 *
 * Directional variations provide subtle feedback:
 * - Up: Lighter shade (+15% lightness)
 * - Down: Darker shade (-15% lightness)
 * - Left: Desaturated (-15% saturation)
 * - Right: More saturated (+15% saturation)
 * - Press: Base color (reference)
 */

import { FingerId, Direction } from '../../domain';

/**
 * Color variation amounts for directional feedback.
 * These percentages control how much colors shift per direction.
 */
export const COLOR_VARIATION_AMOUNTS = {
  /** Lightness change for up/down directions (%) */
  lightness: 15,
  /** Saturation change for left/right directions (%) */
  saturation: 15,
} as const;

/**
 * Direction symbols for visual display.
 */
export const DIRECTION_SYMBOLS: Record<Direction, string> = {
  [Direction.UP]: '↑',
  [Direction.DOWN]: '↓',
  [Direction.LEFT]: '←',
  [Direction.RIGHT]: '→',
  [Direction.PRESS]: '●',
};

/**
 * Direction display names.
 */
export const DIRECTION_NAMES: Record<Direction, string> = {
  [Direction.UP]: 'Up',
  [Direction.DOWN]: 'Down',
  [Direction.LEFT]: 'Left',
  [Direction.RIGHT]: 'Right',
  [Direction.PRESS]: 'Press',
};

/**
 * Color definition with directional variations.
 */
export interface FingerColorConfig {
  base: string;
  name: string;
  variations: Record<Direction, string>;
}

/**
 * Complete research-based finger color mapping.
 *
 * Left Hand: Includes both low (thumb) and high (middle) pitches
 * Right Hand: Warmer colors correlating with pitch distribution
 * Pinkies: Muted gray (no sound association)
 */
export const FINGER_COLORS: Record<FingerId, FingerColorConfig> = {
  // ==================== LEFT HAND ====================

  l_thumb_first: {
    base: '#C04000',
    name: 'Burnt Orange',
    variations: {
      [Direction.UP]: '#D4652F',
      [Direction.DOWN]: '#8B2E00',
      [Direction.LEFT]: '#9A4000',
      [Direction.RIGHT]: '#E04800',
      [Direction.PRESS]: '#C04000',
    },
  },

  l_thumb_second: {
    base: '#8B0000',
    name: 'Dark Red',
    variations: {
      [Direction.UP]: '#A52A2A', // Lighter (Indian Red)
      [Direction.DOWN]: '#5C0000', // Darker
      [Direction.LEFT]: '#6B0000', // Desaturated
      [Direction.RIGHT]: '#AB0000', // More saturated
      [Direction.PRESS]: '#8B0000', // Base
    },
  },

  l_thumb_third: {
    base: '#B03060',
    name: 'Maroon',
    variations: {
      [Direction.UP]: '#C85078',
      [Direction.DOWN]: '#802040',
      [Direction.LEFT]: '#982850',
      [Direction.RIGHT]: '#C83870',
      [Direction.PRESS]: '#B03060',
    },
  },

  l_arrow: {
    base: '#9370DB',
    name: 'Medium Purple',
    variations: {
      [Direction.UP]: '#B08AEB',
      [Direction.DOWN]: '#7350BB',
      [Direction.LEFT]: '#8060CB',
      [Direction.RIGHT]: '#A680EB',
      [Direction.PRESS]: '#9370DB',
    },
  },

  l_trackball: {
    base: '#6A5ACD',
    name: 'Slate Blue',
    variations: {
      [Direction.UP]: '#8A7AED',
      [Direction.DOWN]: '#4A3AAD',
      [Direction.LEFT]: '#5A4ABD',
      [Direction.RIGHT]: '#7A6ADD',
      [Direction.PRESS]: '#6A5ACD',
    },
  },

  l_ring: {
    base: '#FFB347',
    name: 'Soft Amber',
    variations: {
      [Direction.UP]: '#FFCC80',
      [Direction.DOWN]: '#CC8F39',
      [Direction.LEFT]: '#E0A040',
      [Direction.RIGHT]: '#FFC060',
      [Direction.PRESS]: '#FFB347',
    },
  },

  l_index: {
    base: '#4DA6FF',
    name: 'Sky Blue',
    variations: {
      [Direction.UP]: '#80C1FF',
      [Direction.DOWN]: '#1A7ACC',
      [Direction.LEFT]: '#4090E0',
      [Direction.RIGHT]: '#60B8FF',
      [Direction.PRESS]: '#4DA6FF',
    },
  },

  l_middle: {
    base: '#7F7FFF',
    name: 'Lavender Blue',
    variations: {
      [Direction.UP]: '#A5A5FF',
      [Direction.DOWN]: '#5959CC',
      [Direction.LEFT]: '#6B6BE0',
      [Direction.RIGHT]: '#9393FF',
      [Direction.PRESS]: '#7F7FFF',
    },
  },

  l_pinky: {
    base: '#666666',
    name: 'Gray', // No sound, muted color
    variations: {
      [Direction.UP]: '#808080',
      [Direction.DOWN]: '#4D4D4D',
      [Direction.LEFT]: '#595959',
      [Direction.RIGHT]: '#737373',
      [Direction.PRESS]: '#666666',
    },
  },

  // ==================== RIGHT HAND ====================

  r_thumb_first: {
    base: '#FF8C00',
    name: 'Deep Orange',
    variations: {
      [Direction.UP]: '#FFA333',
      [Direction.DOWN]: '#CC7000',
      [Direction.LEFT]: '#E07800',
      [Direction.RIGHT]: '#FFA000',
      [Direction.PRESS]: '#FF8C00',
    },
  },

  r_thumb_second: {
    base: '#FFD700',
    name: 'Gold',
    variations: {
      [Direction.UP]: '#FFE44D',
      [Direction.DOWN]: '#CCAC00',
      [Direction.LEFT]: '#E0BE00',
      [Direction.RIGHT]: '#FFEC00',
      [Direction.PRESS]: '#FFD700',
    },
  },

  r_thumb_third: {
    base: '#FFA07A',
    name: 'Light Salmon',
    variations: {
      [Direction.UP]: '#FFB899',
      [Direction.DOWN]: '#E0805A',
      [Direction.LEFT]: '#E8906A',
      [Direction.RIGHT]: '#FFB08A',
      [Direction.PRESS]: '#FFA07A',
    },
  },

  r_arrow: {
    base: '#20B2AA',
    name: 'Light Sea Green',
    variations: {
      [Direction.UP]: '#40D2CA',
      [Direction.DOWN]: '#10928A',
      [Direction.LEFT]: '#18A29A',
      [Direction.RIGHT]: '#28C2BA',
      [Direction.PRESS]: '#20B2AA',
    },
  },

  r_trackball: {
    base: '#008B8B',
    name: 'Dark Cyan',
    variations: {
      [Direction.UP]: '#20ABAB',
      [Direction.DOWN]: '#006B6B',
      [Direction.LEFT]: '#007B7B',
      [Direction.RIGHT]: '#009B9B',
      [Direction.PRESS]: '#008B8B',
    },
  },

  r_index: {
    base: '#228B22',
    name: 'Forest Green',
    variations: {
      [Direction.UP]: '#3AA53A',
      [Direction.DOWN]: '#1A6B1A',
      [Direction.LEFT]: '#1E7A1E',
      [Direction.RIGHT]: '#289C28',
      [Direction.PRESS]: '#228B22',
    },
  },

  r_middle: {
    base: '#32CD32',
    name: 'Bright Lime',
    variations: {
      [Direction.UP]: '#5FDF5F',
      [Direction.DOWN]: '#28A428',
      [Direction.LEFT]: '#2DB82D',
      [Direction.RIGHT]: '#3DE23D',
      [Direction.PRESS]: '#32CD32',
    },
  },

  r_ring: {
    base: '#ADFF2F',
    name: 'Green Yellow',
    variations: {
      [Direction.UP]: '#C4FF66',
      [Direction.DOWN]: '#8ACC26',
      [Direction.LEFT]: '#98E02A',
      [Direction.RIGHT]: '#BFFF4D',
      [Direction.PRESS]: '#ADFF2F',
    },
  },

  r_pinky: {
    base: '#666666',
    name: 'Gray', // No sound, muted color
    variations: {
      [Direction.UP]: '#808080',
      [Direction.DOWN]: '#4D4D4D',
      [Direction.LEFT]: '#595959',
      [Direction.RIGHT]: '#737373',
      [Direction.PRESS]: '#666666',
    },
  },
};

/**
 * Get finger color with optional direction variation.
 */
export function getFingerColor(fingerId: FingerId, direction?: Direction): string {
  const colorConfig = FINGER_COLORS[fingerId];
  if (!colorConfig) return '#888888';

  if (direction) {
    return colorConfig.variations[direction];
  }
  return colorConfig.base;
}

/**
 * Get all base finger colors as an array.
 */
export function getAllFingerColors(): string[] {
  return Object.values(FINGER_COLORS).map((c) => c.base);
}

/**
 * Get color name for a finger.
 */
export function getFingerColorName(fingerId: FingerId): string {
  return FINGER_COLORS[fingerId]?.name ?? 'Unknown';
}

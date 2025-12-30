/**
 * ColoredFinger Component
 *
 * Displays a finger indicator with its research-based color.
 * Supports directional variations and active/pressed states.
 */

import React from 'react';
import { FingerId, Direction } from '../../../domain';
import { useColor } from '../../../hooks';

/**
 * Size variants for the finger indicator.
 */
export type FingerSize = 'small' | 'medium' | 'large';

/**
 * Props for ColoredFinger component.
 */
export interface ColoredFingerProps {
  /** The finger ID to display */
  fingerId: FingerId;
  /** Optional direction for color variation */
  direction?: Direction;
  /** Whether the finger is currently active/highlighted */
  isActive?: boolean;
  /** Whether the finger is currently pressed */
  isPressed?: boolean;
  /** Size variant */
  size?: FingerSize;
  /** Whether to show the finger label */
  showLabel?: boolean;
  /** Optional label override (uses short name by default) */
  label?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Size dimensions in pixels.
 */
const SIZE_MAP: Record<FingerSize, number> = {
  small: 24,
  medium: 36,
  large: 48,
};

/**
 * Font sizes for labels.
 */
const FONT_SIZE_MAP: Record<FingerSize, number> = {
  small: 10,
  medium: 12,
  large: 14,
};

/**
 * ColoredFinger component renders a colored circle representing a finger.
 */
export function ColoredFinger({
  fingerId,
  direction,
  isActive = false,
  isPressed = false,
  size = 'medium',
  showLabel = false,
  label,
  onClick,
  className = '',
}: ColoredFingerProps): React.ReactElement {
  const colorService = useColor();

  const fingerColor = colorService.getFingerColor(fingerId, direction);
  const textColor = colorService.getContrastColor(fingerColor);
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  // Apply visual states
  const displayColor = isActive
    ? fingerColor
    : colorService.desaturate(fingerColor, 30);

  const scale = isPressed ? 0.9 : 1;
  const shadow = isPressed
    ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
    : isActive
    ? `0 0 8px ${fingerColor}`
    : 'none';

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dimension,
    height: dimension,
    borderRadius: '50%',
    backgroundColor: displayColor,
    color: textColor,
    fontSize,
    fontWeight: 'bold',
    transform: `scale(${scale})`,
    boxShadow: shadow,
    transition: 'all 0.15s ease-out',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
  };

  // Generate label from fingerId if not provided
  const displayLabel = label ?? getShortLabel(fingerId);

  return (
    <div
      className={`colored-finger ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {showLabel && displayLabel}
    </div>
  );
}

/**
 * Generate a short label from finger ID.
 */
function getShortLabel(fingerId: FingerId): string {
  const parts = fingerId.split('_');
  if (parts.length < 2) return fingerId;

  const hand = parts[0].toUpperCase()[0]; // L or R
  const finger = parts.slice(1).join('_');

  switch (finger) {
    case 'pinky':
      return `${hand}P`;
    case 'ring':
      return `${hand}R`;
    case 'middle':
      return `${hand}M`;
    case 'index':
      return `${hand}I`;
    case 'thumb_inner':
      return `${hand}T1`;
    case 'thumb_outer':
      return `${hand}T2`;
    default:
      return fingerId.substring(0, 3).toUpperCase();
  }
}

export default ColoredFinger;

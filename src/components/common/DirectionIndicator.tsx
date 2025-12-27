/**
 * DirectionIndicator Component
 *
 * Shows a visual indicator for a finger direction with the
 * appropriate color variation and directional symbol.
 */

import React from 'react';
import { FingerId, Direction } from '../../domain';
import { useColor } from '../../hooks';
import { DIRECTION_SYMBOLS, DIRECTION_NAMES } from '../../data/static/colorConfig';

/**
 * Props for DirectionIndicator component.
 */
export interface DirectionIndicatorProps {
  /** Direction to display */
  direction: Direction;
  /** Finger ID for color */
  fingerId: FingerId;
  /** Whether this direction is currently active */
  isActive?: boolean;
  /** Whether to show the direction name instead of symbol */
  showName?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Size dimensions in pixels.
 */
const SIZE_MAP = {
  small: { padding: '4px 8px', fontSize: 12 },
  medium: { padding: '8px 12px', fontSize: 16 },
  large: { padding: '12px 16px', fontSize: 20 },
};

/**
 * DirectionIndicator displays a direction symbol with finger-specific color.
 */
export function DirectionIndicator({
  direction,
  fingerId,
  isActive = false,
  showName = false,
  size = 'medium',
  onClick,
  className = '',
}: DirectionIndicatorProps): React.ReactElement {
  const colorService = useColor();

  const directionColor = colorService.getFingerColor(fingerId, direction);
  const textColor = isActive ? colorService.getContrastColor(directionColor) : directionColor;
  const symbol = DIRECTION_SYMBOLS[direction];
  const name = DIRECTION_NAMES[direction];
  const sizeStyles = SIZE_MAP[size];

  const isPress = direction === Direction.PRESS;

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isActive ? directionColor : 'transparent',
    border: `2px solid ${directionColor}`,
    borderRadius: isPress ? '50%' : 8,
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: 'bold',
    color: textColor,
    opacity: isActive ? 1 : 0.6,
    transition: 'all 0.15s ease-out',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    minWidth: isPress ? 0 : 40,
  };

  return (
    <div
      className={`direction-indicator direction-${direction.toLowerCase()} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      title={name}
    >
      {showName ? name : symbol}
    </div>
  );
}

export default DirectionIndicator;

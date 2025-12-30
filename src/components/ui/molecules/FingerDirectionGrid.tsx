/**
 * FingerDirectionGrid Component
 *
 * Displays all 5 directions for a finger in a cross/plus pattern:
 *       [UP]
 * [LEFT][PRESS][RIGHT]
 *      [DOWN]
 *
 * Each cell shows the direction-specific color and optionally the character.
 */

import React from 'react';
import { FingerId, Direction, ALL_DIRECTIONS } from '../../../domain';
import { useColor, useServices } from '../../../hooks';
import { DIRECTION_SYMBOLS } from '../../../data/static/colorConfig';

/**
 * Props for FingerDirectionGrid component.
 */
export interface FingerDirectionGridProps {
  /** Finger ID to display directions for */
  fingerId: FingerId;
  /** Currently active direction (highlighted) */
  activeDirection?: Direction;
  /** Callback when a direction cell is clicked */
  onDirectionClick?: (direction: Direction) => void;
  /** Whether to show the character in each cell */
  showCharacters?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS class names */
  className?: string;
}

/**
 * Size configurations.
 */
const SIZE_CONFIG = {
  small: { cellSize: 32, fontSize: 12, gap: 2 },
  medium: { cellSize: 48, fontSize: 16, gap: 4 },
  large: { cellSize: 64, fontSize: 20, gap: 6 },
};

/**
 * Grid position for each direction in the cross pattern.
 */
const GRID_POSITIONS: Record<Direction, { row: number; col: number }> = {
  [Direction.UP]: { row: 0, col: 1 },
  [Direction.LEFT]: { row: 1, col: 0 },
  [Direction.PRESS]: { row: 1, col: 1 },
  [Direction.RIGHT]: { row: 1, col: 2 },
  [Direction.DOWN]: { row: 2, col: 1 },
};

/**
 * FingerDirectionGrid displays a cross pattern of direction cells.
 */
export function FingerDirectionGrid({
  fingerId,
  activeDirection,
  onDirectionClick,
  showCharacters = true,
  size = 'medium',
  className = '',
}: FingerDirectionGridProps): React.ReactElement {
  const colorService = useColor();
  const { chord: chordService } = useServices();
  const config = SIZE_CONFIG[size];

  // Get characters for each direction if needed
  const getCharacterForDirection = (direction: Direction): string | null => {
    if (!showCharacters) return null;
    // This would need to look up the character from the character config
    // For now, we return null and show just the symbol
    return null;
  };

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: `repeat(3, ${config.cellSize}px)`,
    gridTemplateColumns: `repeat(3, ${config.cellSize}px)`,
    gap: config.gap,
  };

  return (
    <div
      className={`finger-direction-grid ${className}`}
      style={containerStyle}
    >
      {ALL_DIRECTIONS.map((direction) => {
        const position = GRID_POSITIONS[direction];
        const directionColor = colorService.getFingerColor(fingerId, direction);
        const isActive = activeDirection === direction;
        const textColor = isActive
          ? colorService.getContrastColor(directionColor)
          : directionColor;
        const char = getCharacterForDirection(direction);
        const isPress = direction === Direction.PRESS;

        const cellStyle: React.CSSProperties = {
          gridRow: position.row + 1,
          gridColumn: position.col + 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? directionColor : 'transparent',
          border: `2px solid ${directionColor}`,
          borderRadius: isPress ? '50%' : 8,
          fontSize: config.fontSize,
          fontWeight: 'bold',
          color: textColor,
          opacity: isActive ? 1 : 0.7,
          transition: 'all 0.15s ease-out',
          cursor: onDirectionClick ? 'pointer' : 'default',
          userSelect: 'none',
        };

        return (
          <div
            key={direction}
            className={`direction-cell direction-${direction.toLowerCase()}`}
            style={cellStyle}
            onClick={() => onDirectionClick?.(direction)}
            role={onDirectionClick ? 'button' : undefined}
            tabIndex={onDirectionClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onDirectionClick) {
                onDirectionClick(direction);
              }
            }}
          >
            <span className="direction-symbol">{DIRECTION_SYMBOLS[direction]}</span>
            {char && <span className="direction-char">{char}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default FingerDirectionGrid;

/**
 * Layout Mapping Table Component
 *
 * Displays a table of all finger+direction mappings.
 * Allows editing custom character assignments.
 */

import { useState, useCallback } from 'react';
import { FingerId, Direction, LEFT_FINGER_IDS, RIGHT_FINGER_IDS, CharacterMapping } from '../../../domain';
import {
  FINGER_NAMES,
  FINGER_COLORS,
} from '../../../config/fingerMapping';
import { CHARACTER_CONFIG } from '../../../data/static/characterConfig';

interface LayoutMappingTableProps {
  /** Current custom mappings */
  mappings: readonly CharacterMapping[];
  /** Called when mappings change */
  onChange: (mappings: CharacterMapping[]) => void;
  /** Whether the table is read-only */
  readOnly?: boolean;
}

/**
 * Direction display config.
 */
const DIRECTION_CONFIG: Record<Direction, { symbol: string; label: string }> = {
  [Direction.UP]: { symbol: '↑', label: 'Up' },
  [Direction.DOWN]: { symbol: '↓', label: 'Down' },
  [Direction.LEFT]: { symbol: '←', label: 'Left' },
  [Direction.RIGHT]: { symbol: '→', label: 'Right' },
  [Direction.PRESS]: { symbol: '●', label: 'Press' },
};

/**
 * Order of directions for display.
 */
const DIRECTION_ORDER: Direction[] = [
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT,
];

/**
 * Filters fingers that have printable characters.
 */
function getFingersWithChars(fingerIds: FingerId[]): FingerId[] {
  // Pinky fingers don't have printable characters
  return fingerIds.filter((id) => !id.includes('pinky'));
}

/**
 * Gets the default character for a finger+direction from CHARACTER_CONFIG.
 */
function getDefaultChar(fingerId: FingerId, direction: Direction): string | null {
  const entry = CHARACTER_CONFIG.find(
    (e) => e.fingerId === fingerId && e.direction === direction
  );
  return entry?.char ?? null;
}

/**
 * Layout mapping table component.
 */
export function LayoutMappingTable({
  mappings,
  onChange,
  readOnly = false,
}: LayoutMappingTableProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build a map of current custom mappings
  const customMappingMap = new Map<string, CharacterMapping>();
  for (const mapping of mappings) {
    const key = `${mapping.fingerId}:${mapping.direction}`;
    customMappingMap.set(key, mapping);
  }

  // Get the effective char for a finger+direction
  const getEffectiveChar = useCallback(
    (fingerId: FingerId, direction: Direction): string => {
      const key = `${fingerId}:${direction}`;
      const customMapping = customMappingMap.get(key);
      if (customMapping) {
        return customMapping.char;
      }
      return getDefaultChar(fingerId, direction) ?? '';
    },
    [customMappingMap]
  );

  // Check if a mapping is custom (overridden)
  const isCustomMapping = useCallback(
    (fingerId: FingerId, direction: Direction): boolean => {
      const key = `${fingerId}:${direction}`;
      return customMappingMap.has(key);
    },
    [customMappingMap]
  );

  // Handle character input change
  const handleCharChange = useCallback(
    (fingerId: FingerId, direction: Direction, value: string) => {
      const key = `${fingerId}:${direction}`;
      const normalizedValue = value.toLowerCase().slice(0, 1);

      // Clear error
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      // Validate: must be a printable character
      if (normalizedValue && !/^[a-z0-9.,;'\-=\[\]\\\/`]$/.test(normalizedValue)) {
        setErrors((prev) => ({ ...prev, [key]: 'Invalid character' }));
        return;
      }

      // Check for duplicates in custom mappings (excluding current)
      if (normalizedValue) {
        const duplicate = mappings.find(
          (m) =>
            m.char.toLowerCase() === normalizedValue &&
            !(m.fingerId === fingerId && m.direction === direction)
        );
        if (duplicate) {
          setErrors((prev) => ({
            ...prev,
            [key]: `Already mapped to ${FINGER_NAMES[duplicate.fingerId]}`,
          }));
          return;
        }
      }

      // Get the default char for comparison
      const defaultChar = getDefaultChar(fingerId, direction);

      // If value matches default, remove the custom mapping
      if (normalizedValue === defaultChar || normalizedValue === '') {
        const newMappings = mappings.filter(
          (m) => !(m.fingerId === fingerId && m.direction === direction)
        );
        onChange(newMappings);
        return;
      }

      // Add or update custom mapping
      const existingIndex = mappings.findIndex(
        (m) => m.fingerId === fingerId && m.direction === direction
      );

      const newMapping = CharacterMapping.create(normalizedValue, fingerId, direction);

      if (existingIndex >= 0) {
        const newMappings = [...mappings];
        newMappings[existingIndex] = newMapping;
        onChange(newMappings);
      } else {
        onChange([...mappings, newMapping]);
      }
    },
    [mappings, onChange]
  );

  // Handle reset to default
  const handleReset = useCallback(
    (fingerId: FingerId, direction: Direction) => {
      const newMappings = mappings.filter(
        (m) => !(m.fingerId === fingerId && m.direction === direction)
      );
      onChange(newMappings);

      // Clear any error
      const key = `${fingerId}:${direction}`;
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [mappings, onChange]
  );

  // Render a single mapping row
  const renderMappingRow = (fingerId: FingerId, direction: Direction) => {
    const key = `${fingerId}:${direction}`;
    const defaultChar = getDefaultChar(fingerId, direction);

    // Skip if there's no default char for this direction
    if (defaultChar === null) {
      return null;
    }

    const currentChar = getEffectiveChar(fingerId, direction);
    const isCustom = isCustomMapping(fingerId, direction);
    const error = errors[key];
    const dirConfig = DIRECTION_CONFIG[direction];

    return (
      <div key={key} className="mapping-row">
        <div className="mapping-row__direction">
          <span className="mapping-row__direction-arrow">{dirConfig.symbol}</span>
          <span>{dirConfig.label}</span>
        </div>
        <div className="mapping-row__input-wrapper">
          <input
            type="text"
            className={`mapping-row__input ${isCustom ? 'mapping-row__input--custom' : ''} ${error ? 'mapping-row__input--error' : ''}`}
            value={currentChar}
            onChange={(e) => handleCharChange(fingerId, direction, e.target.value)}
            maxLength={1}
            disabled={readOnly}
            title={error || (isCustom ? 'Custom mapping' : 'Default mapping')}
          />
          <span
            className={`mapping-row__badge ${isCustom ? 'mapping-row__badge--custom' : 'mapping-row__badge--default'}`}
          >
            {isCustom ? 'Custom' : 'Default'}
          </span>
          {isCustom && !readOnly && (
            <button
              type="button"
              className="mapping-row__reset-btn"
              onClick={() => handleReset(fingerId, direction)}
              title="Reset to default"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render finger group
  const renderFingerGroup = (fingerId: FingerId) => {
    const fingerName = FINGER_NAMES[fingerId];
    const fingerColor = FINGER_COLORS[fingerId];
    const rows = DIRECTION_ORDER.map((dir) => renderMappingRow(fingerId, dir)).filter(Boolean);

    if (rows.length === 0) {
      return null;
    }

    return (
      <div key={fingerId} className="mapping-table__finger-group">
        <div className="mapping-table__finger-header">
          <span
            className="mapping-table__finger-color"
            style={{ backgroundColor: fingerColor }}
          />
          <span>{fingerName}</span>
        </div>
        <div className="mapping-table__rows">{rows}</div>
      </div>
    );
  };

  // Render hand section
  const renderHand = (
    hand: 'left' | 'right',
    fingerIds: FingerId[],
    icon: string
  ) => {
    const fingersWithChars = getFingersWithChars(fingerIds);

    return (
      <div className="mapping-table__hand">
        <div className="mapping-table__hand-header">
          <span className="mapping-table__hand-icon">{icon}</span>
          <h4 className="mapping-table__hand-title">
            {hand === 'left' ? 'Left Hand' : 'Right Hand'}
          </h4>
        </div>
        {fingersWithChars.map(renderFingerGroup)}
      </div>
    );
  };

  return (
    <div className="mapping-table">
      {renderHand('left', LEFT_FINGER_IDS, '🤚')}
      {renderHand('right', RIGHT_FINGER_IDS, '✋')}
    </div>
  );
}

/**
 * ColoredChord Component
 *
 * Displays a chord (word or power chord) with each character
 * colored according to its finger mapping. Optionally shows
 * a blended background color.
 */

import React from 'react';
import { Chord } from '../../../domain';
import { useColor, useChord } from '../../../hooks';

/**
 * Size variants for the chord display.
 */
export type ChordSize = 'small' | 'medium' | 'large';

/**
 * Props for ColoredChord component.
 */
export interface ColoredChordProps {
  /** Chord object or string to display */
  chord: Chord | string;
  /** Size variant */
  size?: ChordSize;
  /** Whether to show blended background */
  showBlendedBackground?: boolean;
  /** Whether to display in monospace font */
  monospace?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Font sizes for different sizes.
 */
const FONT_SIZE_MAP: Record<ChordSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
};

/**
 * Padding for different sizes.
 */
const PADDING_MAP: Record<ChordSize, string> = {
  small: '2px 6px',
  medium: '4px 8px',
  large: '6px 12px',
};

/**
 * ColoredChord component renders a chord with colored characters.
 */
export function ColoredChord({
  chord,
  size = 'medium',
  showBlendedBackground = false,
  monospace = true,
  className = '',
}: ColoredChordProps): React.ReactElement {
  const colorService = useColor();
  const chordService = useChord();

  // Convert string to chord if needed
  const chordObj: Chord | null = typeof chord === 'string'
    ? chordService.createChordFromInput(chord)
    : chord;

  const chordText = typeof chord === 'string' ? chord : getChordText(chord);

  // Get blended background color
  const backgroundColor = showBlendedBackground && chordObj
    ? colorService.getChordBlendedColor(chordObj)
    : 'transparent';

  const textColorForBg = showBlendedBackground && chordObj
    ? colorService.getContrastColor(backgroundColor)
    : undefined;

  const fontSize = FONT_SIZE_MAP[size];
  const padding = PADDING_MAP[size];

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor,
    padding,
    borderRadius: 4,
    fontFamily: monospace ? 'monospace' : 'inherit',
    fontSize,
  };

  return (
    <span className={`colored-chord ${className}`} style={containerStyle}>
      {chordText.split('').map((char, index) => (
        <ColoredCharacter
          key={`${char}-${index}`}
          char={char}
          fallbackColor={textColorForBg}
        />
      ))}
    </span>
  );
}

/**
 * Props for internal ColoredCharacter component.
 */
interface ColoredCharacterProps {
  char: string;
  fallbackColor?: string;
}

/**
 * Individual colored character within a chord.
 */
function ColoredCharacter({ char, fallbackColor }: ColoredCharacterProps): React.ReactElement {
  const colorService = useColor();

  // Get color for this character
  const charColor = colorService.getCharacterColor(char);

  // Use character color if valid, otherwise fallback
  const displayColor = charColor !== '#808080' ? charColor : fallbackColor;

  const style: React.CSSProperties = {
    color: displayColor,
    fontWeight: 'bold',
  };

  return <span style={style}>{char}</span>;
}

/**
 * Extract text representation from a Chord object.
 */
function getChordText(chord: Chord): string {
  // The chord ID is sorted characters, so use that
  return chord.id;
}

export default ColoredChord;

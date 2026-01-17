/**
 * Character With Reference Component
 *
 * Displays a character with visual reference lines to help distinguish
 * similar-looking punctuation (like comma vs apostrophe).
 *
 * Shows:
 * - A baseline reference line (where letters normally sit)
 * - An x-height reference line (top of lowercase letters)
 * - The character positioned appropriately
 * - Optional character name label
 */

import React from 'react';
import { needsVisualReference, getCharacterName } from '../../../utils';

export interface CharacterWithReferenceProps {
  /** The character to display */
  char: string;
  /** Color for the character */
  color?: string;
  /** Whether to always show reference (default: only for confusable chars) */
  forceReference?: boolean;
  /** Whether to show the character name label */
  showLabel?: boolean;
  /** Font size in rem (default: 8) */
  fontSize?: number;
}

export function CharacterWithReference({
  char,
  color = '#fff',
  forceReference = false,
  showLabel = true,
  fontSize = 8,
}: CharacterWithReferenceProps): React.ReactElement {
  const shouldShowReference = forceReference || needsVisualReference(char);
  const charName = getCharacterName(char);

  if (!shouldShowReference) {
    // No reference needed - render simple display
    return (
      <span
        className="character-simple"
        style={{
          color,
          fontSize: `${fontSize}rem`,
          fontWeight: 700,
          lineHeight: 1,
          textShadow: `0 0 40px ${color}`,
        }}
      >
        {char.toUpperCase()}
      </span>
    );
  }

  // Calculate sizes based on font size
  const containerHeight = fontSize * 1.4; // Extra space for descenders
  const baselineOffset = fontSize * 0.2; // Distance from bottom to baseline
  const xHeightOffset = fontSize * 0.65; // Distance from bottom to x-height

  return (
    <div className="character-with-reference" style={{ textAlign: 'center' }}>
      <div
        className="character-reference-container"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: `${containerHeight}rem`,
          minWidth: `${fontSize * 0.8}rem`,
          padding: `0 ${fontSize * 0.3}rem`,
        }}
      >
        {/* X-height reference line (top of lowercase letters) */}
        <div
          className="reference-line reference-line--x-height"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${xHeightOffset}rem`,
            height: '2px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '1px',
          }}
          title="x-height (top of lowercase letters)"
        />

        {/* Baseline reference line */}
        <div
          className="reference-line reference-line--baseline"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${baselineOffset}rem`,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '1.5px',
          }}
          title="baseline (where letters sit)"
        />

        {/* Reference indicator lines at edges */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: `${baselineOffset - 0.3}rem`,
            width: '2px',
            height: `${xHeightOffset - baselineOffset + 0.6}rem`,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: `${baselineOffset - 0.3}rem`,
            width: '2px',
            height: `${xHeightOffset - baselineOffset + 0.6}rem`,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1px',
          }}
        />

        {/* The character itself */}
        <span
          style={{
            position: 'relative',
            color,
            fontSize: `${fontSize}rem`,
            fontWeight: 700,
            lineHeight: 1,
            textShadow: `0 0 40px ${color}`,
            marginBottom: `${baselineOffset}rem`,
            zIndex: 1,
          }}
        >
          {char}
        </span>
      </div>

      {/* Character name label */}
      {showLabel && charName && (
        <div
          className="character-name-label"
          style={{
            marginTop: '0.75rem',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {charName}
        </div>
      )}
    </div>
  );
}

export default CharacterWithReference;

/**
 * LegoVisualization Component
 *
 * Displays a visualization showing the chord keys needed to type a word.
 * Uses actual chord data from the Word entity (loaded from CSV).
 */

import React, { useMemo } from 'react';
import { Word, PowerChord } from '../../../domain';
import { ChordExtension, getRepositories } from '../../../data';
import { useColor } from '../../../hooks';
import './lego.css';

/**
 * Props for WordLegoVisualization component.
 * Uses actual Word entity with correct chord data.
 */
export interface WordLegoVisualizationProps {
  /** The word to visualize */
  word: Word;
  /** Whether to show animation */
  showAnimation?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional CSS class name */
  className?: string;
}

/**
 * WordLegoVisualization displays the chord keys needed to type a word.
 * Shows all keys that need to be pressed together.
 */
export function WordLegoVisualization({
  word,
  showAnimation = true,
  size = 'medium',
  className = '',
}: WordLegoVisualizationProps): React.ReactElement {
  const { powerChords } = getRepositories();

  // Get the chord characters from the word
  const chordChars = word.chord.characters;

  // Find power chord subsets within this word's chord (for educational display)
  const powerChordSubsets = useMemo(() => {
    const subsets: PowerChord[] = [];
    const chordCharSet = new Set(chordChars.map(c => c.char.toLowerCase()));

    // Check all power chords to see if they're subsets of this word's chord
    const allPowerChords = powerChords.getAll();
    for (const pc of allPowerChords) {
      const pcChars = pc.characters.map(c => c.char.toLowerCase());
      if (pcChars.every(c => chordCharSet.has(c))) {
        subsets.push(pc);
      }
    }

    // Sort by frequency rank (most common first)
    return subsets.sort((a, b) => a.frequencyRank - b.frequencyRank);
  }, [chordChars, powerChords]);

  // Get the primary power chord if there is one
  const primaryPowerChord = powerChordSubsets.length > 0 ? powerChordSubsets[0] : null;

  // Determine block widths based on content
  const chordBlockWidth = chordChars.length * 40 + 40;
  const resultBlockWidth = word.word.length * 15 + 60;

  return (
    <div
      className={`lego-visualization ${size} ${showAnimation ? 'animated' : ''} ${className}`}
    >
      {/* Row 1: Chord keys to press */}
      <div className="lego-row base-row">
        <div
          className="lego-block known"
          style={{ minWidth: `${chordBlockWidth}px` }}
        >
          <div className="block-label">Press Together</div>
          <div className="block-content">
            {chordChars.map((char, index) => (
              <span
                key={`${char.char}-${index}`}
                className="block-char"
                style={{ color: char.color }}
              >
                {char.displayChar}
              </span>
            ))}
          </div>
          {primaryPowerChord && (
            <div
              className="block-color-bar"
              style={{ backgroundColor: word.chord.blendedColor }}
            />
          )}
        </div>
      </div>

      {/* Row 2: Equals sign and result */}
      <div className="lego-row result-row">
        <span className="operator">=</span>
        <div
          className="lego-block result"
          style={{ minWidth: `${resultBlockWidth}px` }}
        >
          <div className="block-label">Word</div>
          <div className="block-content word">
            "{word.word}"
          </div>
        </div>
      </div>

      {/* Optional: Show power chord foundation if there is one */}
      {primaryPowerChord && powerChordSubsets.length > 0 && (
        <div className="lego-power-chord-note">
          <span className="note-label">Contains power chord: </span>
          <span className="note-chars">
            {primaryPowerChord.characters.map((char, index) => (
              <span
                key={`${char.char}-${index}`}
                style={{ color: char.color }}
              >
                {char.displayChar}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Props for LegoVisualization component (legacy - uses ChordExtension).
 * @deprecated Use WordLegoVisualization with Word entity instead.
 */
export interface LegoVisualizationProps {
  /** The chord extension to visualize */
  extension: ChordExtension;
  /** Whether to show animation */
  showAnimation?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional CSS class name */
  className?: string;
}

/**
 * LegoVisualization displays how a word is built from a power chord.
 * Shows: Base Chord + New Character(s) = Result Word
 * @deprecated Use WordLegoVisualization with Word entity instead.
 */
export function LegoVisualization({
  extension,
  showAnimation = true,
  size = 'medium',
  className = '',
}: LegoVisualizationProps): React.ReactElement {
  const colorService = useColor();
  const { powerChords, characters, words } = getRepositories();

  // Try to get the actual Word entity for correct chord data
  const wordEntity = words.getByWord(extension.resultWord);

  // If we have the Word entity, use the new visualization
  if (wordEntity) {
    return (
      <WordLegoVisualization
        word={wordEntity}
        showAnimation={showAnimation}
        size={size}
        className={className}
      />
    );
  }

  // Fallback to old behavior if Word entity not found (shouldn't happen)
  const baseChord = useMemo(
    () => powerChords.getById(extension.baseChordId),
    [powerChords, extension.baseChordId]
  );

  const baseChars = useMemo(() => {
    if (!baseChord) return [];
    return baseChord.characters;
  }, [baseChord]);

  const addedCharData = useMemo(() => {
    return extension.addedChars.map((char) => {
      const charEntity = characters.getByChar(char);
      return {
        char,
        color: charEntity?.color ?? colorService.getCharacterColor(char),
        fingerId: charEntity?.fingerId,
      };
    });
  }, [extension.addedChars, characters, colorService]);

  const baseBlockWidth = baseChars.length * 40 + 40;
  const addedBlockWidth = addedCharData.length * 40 + 40;
  const resultBlockWidth = extension.resultChordChars.length * 30 + 60;

  return (
    <div
      className={`lego-visualization ${size} ${showAnimation ? 'animated' : ''} ${className}`}
    >
      <div className="lego-row base-row">
        <div
          className="lego-block known"
          style={{ minWidth: `${baseBlockWidth}px` }}
        >
          <div className="block-label">Known</div>
          <div className="block-content">
            {baseChars.map((char, index) => (
              <span
                key={`${char.char}-${index}`}
                className="block-char"
                style={{ color: char.color }}
              >
                {char.displayChar}
              </span>
            ))}
          </div>
          {baseChord && (
            <div
              className="block-color-bar"
              style={{ backgroundColor: baseChord.blendedColor }}
            />
          )}
        </div>
      </div>

      <div className="lego-row addition-row">
        <span className="operator">+</span>
        <div
          className="lego-block new"
          style={{ minWidth: `${addedBlockWidth}px` }}
        >
          <div className="block-label">Add</div>
          <div className="block-content">
            {addedCharData.map((char, index) => (
              <span
                key={`${char.char}-${index}`}
                className="block-char"
                style={{ color: char.color }}
              >
                {char.char.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="lego-row result-row">
        <span className="operator">=</span>
        <div
          className="lego-block result"
          style={{ minWidth: `${resultBlockWidth}px` }}
        >
          <div className="block-label">Word</div>
          <div className="block-content word">
            "{extension.resultWord}"
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version using Word entity.
 */
export interface WordLegoCompactProps {
  /** The word to visualize */
  word: Word;
  /** Optional CSS class name */
  className?: string;
}

export function WordLegoCompact({
  word,
  className = '',
}: WordLegoCompactProps): React.ReactElement {
  const chordChars = word.chord.characters;

  return (
    <div className={`lego-compact ${className}`}>
      <span className="lego-compact-base">
        {chordChars.map((char, index) => (
          <span
            key={`${char.char}-${index}`}
            style={{ color: char.color }}
          >
            {char.displayChar}
          </span>
        ))}
      </span>
      <span className="lego-compact-equals">=</span>
      <span className="lego-compact-word">{word.word}</span>
    </div>
  );
}

/**
 * Compact version of LegoVisualization for inline display.
 * @deprecated Use WordLegoCompact with Word entity instead.
 */
export interface LegoCompactProps {
  /** The chord extension to visualize */
  extension: ChordExtension;
  /** Optional CSS class name */
  className?: string;
}

export function LegoCompact({
  extension,
  className = '',
}: LegoCompactProps): React.ReactElement {
  const colorService = useColor();
  const { powerChords, words } = getRepositories();

  // Try to get the actual Word entity for correct chord data
  const wordEntity = words.getByWord(extension.resultWord);

  // If we have the Word entity, use the new visualization
  if (wordEntity) {
    return <WordLegoCompact word={wordEntity} className={className} />;
  }

  // Fallback to old behavior
  const baseChord = powerChords.getById(extension.baseChordId);

  return (
    <div className={`lego-compact ${className}`}>
      <span className="lego-compact-base">
        {baseChord?.characters.map((char, index) => (
          <span
            key={`${char.char}-${index}`}
            style={{ color: char.color }}
          >
            {char.displayChar}
          </span>
        ))}
      </span>
      <span className="lego-compact-plus">+</span>
      <span className="lego-compact-added">
        {extension.addedChars.map((char, index) => (
          <span
            key={`${char}-${index}`}
            style={{ color: colorService.getCharacterColor(char) }}
          >
            {char.toUpperCase()}
          </span>
        ))}
      </span>
      <span className="lego-compact-equals">=</span>
      <span className="lego-compact-word">{extension.resultWord}</span>
    </div>
  );
}

/**
 * Multi-step visualization showing how to type a word.
 * Uses actual Word entity with correct chord data.
 */
export interface LegoPathProps {
  /** The word to build */
  word: string;
  /** Whether to show animation */
  showAnimation?: boolean;
  /** Optional CSS class name */
  className?: string;
}

export function LegoPath({
  word,
  showAnimation = true,
  className = '',
}: LegoPathProps): React.ReactElement {
  const { words, powerChords } = getRepositories();

  // Get the actual Word entity with correct chord data
  const wordEntity = words.getByWord(word);

  if (!wordEntity) {
    return (
      <div className={`lego-path ${className}`}>
        <p className="lego-path-error">Word "{word}" not found</p>
      </div>
    );
  }

  const chordChars = wordEntity.chord.characters;

  // Find any power chord subsets in this word's chord
  const chordCharSet = new Set(chordChars.map(c => c.char.toLowerCase()));
  const allPowerChords = powerChords.getAll();
  const powerChordSubsets = allPowerChords
    .filter(pc => {
      const pcChars = pc.characters.map(c => c.char.toLowerCase());
      return pcChars.every(c => chordCharSet.has(c));
    })
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  const primaryPowerChord = powerChordSubsets.length > 0 ? powerChordSubsets[0] : null;

  return (
    <div className={`lego-path ${showAnimation ? 'animated' : ''} ${className}`}>
      <div className="lego-path-title">Typing "{word}"</div>

      {/* Step 1: Show all chord keys */}
      <div className="lego-path-step">
        <div className="step-number">1</div>
        <div className="step-content">
          <div className="step-label">Press these keys together:</div>
          <div className="step-chars">
            {chordChars.map((char, index) => (
              <span
                key={`${char.char}-${index}`}
                className="path-char"
                style={{ color: char.color }}
              >
                {char.displayChar}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Show power chord foundation if any */}
      {primaryPowerChord && (
        <div className="lego-path-step add-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <div className="step-label">Contains power chord:</div>
            <div className="step-chars">
              {primaryPowerChord.characters.map((char, index) => (
                <span
                  key={`${char.char}-${index}`}
                  className="path-char"
                  style={{ color: char.color }}
                >
                  {char.displayChar}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final step: Result */}
      <div className="lego-path-step result-step">
        <div className="step-number">{primaryPowerChord ? '3' : '2'}</div>
        <div className="step-content">
          <div className="step-label">Release to output:</div>
          <div className="step-word">"{wordEntity.word}"</div>
        </div>
      </div>
    </div>
  );
}

export default LegoVisualization;

/**
 * Word Highlight Component
 *
 * Displays a word with status-based styling for sentence practice.
 * Shows chord hints when enabled.
 */

import React from 'react';
import './practice.css';

export type WordStatus = 'upcoming' | 'current' | 'completed' | 'error';

export interface WordHighlightProps {
  /** The word to display */
  word: string;
  /** Current status of the word */
  status: WordStatus;
  /** Whether to show chord hint for this word */
  showChordHint?: boolean;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Display a word with status-based highlighting.
 */
export function WordHighlight({
  word,
  status,
  showChordHint = false,
  onClick,
}: WordHighlightProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <span className="status-icon completed-icon">&#10003;</span>;
      case 'error':
        return <span className="status-icon error-icon">&#10007;</span>;
      default:
        return null;
    }
  };

  return (
    <span
      className={`word-highlight ${status}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="word-text">{word}</span>
      {getStatusIcon()}
      {showChordHint && status === 'current' && (
        <ChordHint word={word} />
      )}
    </span>
  );
}

/**
 * Props for the chord hint component.
 */
export interface ChordHintProps {
  word: string;
}

/**
 * Display a chord hint for a word.
 */
export function ChordHint({ word }: ChordHintProps) {
  // Note: In a full implementation, this would look up the chord
  // from the word repository and display the finger combination.
  // For now, we show a simple hint indicator.
  return (
    <span className="chord-hint" title={`Chord hint for "${word}"`}>
      <span className="chord-hint-icon">&#9889;</span>
    </span>
  );
}

export default WordHighlight;

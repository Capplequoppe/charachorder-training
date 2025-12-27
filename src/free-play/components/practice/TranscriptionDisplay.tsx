/**
 * Transcription Display Component
 *
 * Shows the target text with real-time diff highlighting
 * as the user types. Correct characters are green, errors are red.
 */

import React, { useMemo } from 'react';
import './practice.css';

export interface TranscriptionDisplayProps {
  /** Target text to transcribe */
  targetText: string;
  /** User's typed text */
  typedText: string;
  /** Current cursor position */
  cursorPosition: number;
}

/**
 * Character status for display.
 */
type CharStatus = 'upcoming' | 'correct' | 'incorrect';

/**
 * Character data for rendering.
 */
interface CharData {
  /** The target character */
  char: string;
  /** What was typed (if any) */
  typedChar: string | undefined;
  /** Status for styling */
  status: CharStatus;
  /** Whether this is the cursor position */
  isCursor: boolean;
  /** Index in the text */
  index: number;
}

/**
 * Display target text with diff highlighting.
 */
export function TranscriptionDisplay({
  targetText,
  typedText,
  cursorPosition,
}: TranscriptionDisplayProps) {
  // Analyze each character
  const characters = useMemo<CharData[]>(() => {
    return targetText.split('').map((char, index) => {
      const typedChar = typedText[index];
      let status: CharStatus = 'upcoming';

      if (typedChar !== undefined) {
        status = typedChar === char ? 'correct' : 'incorrect';
      }

      return {
        char,
        typedChar,
        status,
        isCursor: index === cursorPosition,
        index,
      };
    });
  }, [targetText, typedText, cursorPosition]);

  // Extra characters typed beyond target length
  const extraChars = useMemo(() => {
    if (typedText.length <= targetText.length) return [];
    return typedText.slice(targetText.length).split('');
  }, [typedText, targetText]);

  // Calculate progress
  const progress = useMemo(() => {
    return {
      typed: typedText.length,
      total: targetText.length,
      percentage: Math.min(100, (typedText.length / targetText.length) * 100),
    };
  }, [typedText.length, targetText.length]);

  // Render special characters
  const renderChar = (char: string) => {
    if (char === '\n') {
      return <span className="newline-indicator">&#8629;<br /></span>;
    }
    if (char === ' ') {
      return <span className="space-char">&nbsp;</span>;
    }
    if (char === '\t') {
      return <span className="tab-char">&nbsp;&nbsp;&nbsp;&nbsp;</span>;
    }
    return char;
  };

  return (
    <div className="transcription-display">
      <div className="display-content">
        {characters.map((c) => (
          <span
            key={c.index}
            className={`transcription-char ${c.status} ${c.isCursor ? 'cursor' : ''}`}
            data-typed={c.typedChar}
          >
            {renderChar(c.char)}
          </span>
        ))}
        {extraChars.map((char, index) => (
          <span
            key={`extra-${index}`}
            className="transcription-char extra"
          >
            {renderChar(char)}
          </span>
        ))}
      </div>

      <div className="display-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="progress-text">
          {progress.typed} / {progress.total} characters ({Math.round(progress.percentage)}%)
        </span>
      </div>
    </div>
  );
}

/**
 * Compact inline display for smaller viewports.
 */
export function TranscriptionDisplayCompact({
  targetText,
  typedText,
}: Omit<TranscriptionDisplayProps, 'cursorPosition'>) {
  // Show just the current line context
  const currentPosition = typedText.length;
  const contextSize = 40;

  const start = Math.max(0, currentPosition - contextSize);
  const end = Math.min(targetText.length, currentPosition + contextSize);

  const contextTarget = targetText.slice(start, end);
  const contextTyped = typedText.slice(start);

  return (
    <div className="transcription-display-compact">
      <div className="context-display">
        {contextTarget.split('').map((char, i) => {
          const typedChar = contextTyped[i];
          const status: CharStatus = typedChar === undefined
            ? 'upcoming'
            : typedChar === char
              ? 'correct'
              : 'incorrect';

          return (
            <span key={i} className={`compact-char ${status}`}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default TranscriptionDisplay;

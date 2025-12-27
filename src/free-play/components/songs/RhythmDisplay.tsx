/**
 * Rhythm Display Component
 *
 * Horizontal scrolling lane showing words moving right-to-left (Guitar Hero style).
 * Current word is highlighted in the center hit zone.
 * Words scroll smoothly based on elapsed time and BPM.
 */

import React, { useMemo } from 'react';
import { type BeatItem } from '@/data/static/songConfig';

export interface RhythmDisplayProps {
  words: BeatItem[];
  currentIndex: number;
  elapsedMs: number; // Total elapsed time in ms
  bpm: number;
  leadInBeats?: number; // How many beats of lead-in before first word
}

const PIXELS_PER_BEAT = 160; // How far a word travels per beat
const VISIBLE_AHEAD = 6; // How many words to show ahead
const VISIBLE_BEHIND = 2; // How many typed words to keep visible

export function RhythmDisplay({
  words,
  currentIndex,
  elapsedMs,
  bpm,
  leadInBeats = 0,
}: RhythmDisplayProps) {
  // Calculate timing values
  const beatDurationMs = (60 / bpm) * 1000;

  // Current position in beats (can be negative during lead-in)
  const currentBeatPosition = elapsedMs / beatDurationMs;

  // Filter to only non-rest words with their beat indices
  const wordItems = useMemo(() => {
    const items: Array<BeatItem & { beatIndex: number; originalIndex: number }> = [];
    words.forEach((word, idx) => {
      if (!word.isRest && word.word) {
        items.push({
          ...word,
          beatIndex: idx + leadInBeats, // Offset by lead-in beats
          originalIndex: idx,
        });
      }
    });
    return items;
  }, [words, leadInBeats]);

  // Calculate visible range based on current position
  const visibleWords = useMemo(() => {
    return wordItems.filter((item) => {
      const beatDiff = item.beatIndex - currentBeatPosition;
      // Show words that are within visible range
      return beatDiff >= -VISIBLE_BEHIND && beatDiff <= VISIBLE_AHEAD;
    });
  }, [wordItems, currentBeatPosition]);

  return (
    <div className="rhythm-display">
      <div className="rhythm-display__lane">
        {/* Hit zone indicator - center of the lane */}
        <div className="rhythm-display__hit-zone" />

        {/* Scrolling words container */}
        <div className="rhythm-display__words-container">
          {visibleWords.map((item) => {
            // Calculate position relative to hit zone (center)
            // Positive = to the right (upcoming), negative = to the left (passed)
            const beatDiff = item.beatIndex - currentBeatPosition;
            const xPosition = beatDiff * PIXELS_PER_BEAT;

            const isCurrent = item.originalIndex === currentIndex;
            const isTyped = item.originalIndex < currentIndex;
            const isUpcoming = item.originalIndex > currentIndex;

            return (
              <div
                key={`word-${item.originalIndex}`}
                className={`word-card ${isCurrent ? 'word-card--current' : ''} ${isTyped ? 'word-card--typed' : ''} ${isUpcoming ? 'word-card--upcoming' : ''}`}
                data-root={item.musicalRoot}
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: `translateX(calc(-50% + ${xPosition}px))`,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {item.word}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RhythmDisplay;

/**
 * Beat Indicator Component
 *
 * Visual metronome showing the current beat within a measure.
 * Displays 4 dots for 4/4 time, with the active beat highlighted.
 */

import React from 'react';

export interface BeatIndicatorProps {
  currentBeat: number; // 1-4
  beatsPerMeasure?: number;
  beatProgress?: number; // 0-1 progress within current beat
}

export function BeatIndicator({
  currentBeat,
  beatsPerMeasure = 4,
  beatProgress = 0,
}: BeatIndicatorProps) {
  return (
    <div className="beat-indicator" role="status" aria-label={`Beat ${currentBeat} of ${beatsPerMeasure}`}>
      {Array.from({ length: beatsPerMeasure }, (_, i) => {
        const beatNum = i + 1;
        const isActive = beatNum === currentBeat;
        const isDownbeat = beatNum === 1;

        return (
          <div
            key={beatNum}
            className={`beat-indicator__dot ${isActive ? 'beat-indicator__dot--active' : ''} ${isDownbeat ? 'beat-indicator__dot--downbeat' : ''}`}
            style={
              isActive
                ? {
                    opacity: 0.5 + beatProgress * 0.5,
                  }
                : undefined
            }
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export default BeatIndicator;

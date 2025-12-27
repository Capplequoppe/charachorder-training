/**
 * Song Results Component
 *
 * Displays end-of-song performance summary with grade, score, and accuracy breakdown.
 */

import React from 'react';
import { type SongResults as SongResultsData } from '@/data/static/songConfig';

/** Letter grades for performance rating */
export type LetterGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SongResultsProps {
  results: SongResultsData;
  onPlayAgain: () => void;
  onSelectSong: () => void;
}

export function SongResults({
  results,
  onPlayAgain,
  onSelectSong,
}: SongResultsProps) {
  // Calculate grade from results
  const grade: LetterGrade = calculateGradeFromResults(results);

  const accuracyPercent = Math.round(results.accuracy * 100);

  return (
    <div className="song-results">
      <h1 className="song-results__title">Song Complete!</h1>
      <p className="song-results__song-name">{results.songTitle}</p>

      <div className={`song-results__grade song-results__grade--${grade}`}>
        {grade}
      </div>

      <div className="song-results__score">{results.score.toLocaleString()}</div>

      <div className="song-results__stats">
        <div className="song-results__stat">
          <div className="song-results__stat-value">{accuracyPercent}%</div>
          <div className="song-results__stat-label">Accuracy</div>
        </div>
        <div className="song-results__stat">
          <div className="song-results__stat-value">{results.maxCombo}x</div>
          <div className="song-results__stat-label">Max Combo</div>
        </div>
        <div className="song-results__stat">
          <div className="song-results__stat-value">
            {results.totalWords - results.missCount}/{results.totalWords}
          </div>
          <div className="song-results__stat-label">Words Hit</div>
        </div>
      </div>

      <div className="song-results__accuracy-breakdown">
        <div className="song-results__accuracy-item song-results__accuracy-item--perfect">
          <span className="song-results__accuracy-count">{results.perfectCount}</span>
          <span className="song-results__accuracy-label">Perfect</span>
        </div>
        <div className="song-results__accuracy-item song-results__accuracy-item--good">
          <span className="song-results__accuracy-count">{results.goodCount}</span>
          <span className="song-results__accuracy-label">Good</span>
        </div>
        <div className="song-results__accuracy-item song-results__accuracy-item--early">
          <span className="song-results__accuracy-count">{results.earlyCount}</span>
          <span className="song-results__accuracy-label">Early</span>
        </div>
        <div className="song-results__accuracy-item song-results__accuracy-item--late">
          <span className="song-results__accuracy-count">{results.lateCount}</span>
          <span className="song-results__accuracy-label">Late</span>
        </div>
        <div className="song-results__accuracy-item song-results__accuracy-item--miss">
          <span className="song-results__accuracy-count">{results.missCount}</span>
          <span className="song-results__accuracy-label">Miss</span>
        </div>
      </div>

      <div className="song-results__actions">
        <button
          className="song-results__btn song-results__btn--primary"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        <button
          className="song-results__btn song-results__btn--secondary"
          onClick={onSelectSong}
        >
          Choose Song
        </button>
      </div>
    </div>
  );
}

function calculateGradeFromResults(results: SongResultsData): LetterGrade {
  const { accuracy } = results;
  const perfectRate = results.totalWords > 0 ? results.perfectCount / results.totalWords : 0;

  if (accuracy >= 0.95 && perfectRate >= 0.7) {
    return 'S';
  } else if (accuracy >= 0.9) {
    return 'A';
  } else if (accuracy >= 0.8) {
    return 'B';
  } else if (accuracy >= 0.7) {
    return 'C';
  } else if (accuracy >= 0.6) {
    return 'D';
  } else {
    return 'F';
  }
}

export default SongResults;

/**
 * Sentence Results Component
 *
 * Displays results after completing a sentence practice.
 * Shows accuracy, WPM, chord usage, and word-by-word breakdown.
 */

import React from 'react';
import { type PracticeSentence } from '@/data/static/sentences';
import { type WordResult } from '@/free-play/services/SentenceService';
import './practice.css';

export interface SentenceResultsDisplayProps {
  /** The practiced sentence */
  sentence: PracticeSentence;
  /** Results for each word */
  wordResults: WordResult[];
  /** Total time in milliseconds */
  totalTime: number;
  /** Handler for next sentence */
  onNext: () => void;
  /** Handler for retrying the sentence */
  onRetry: () => void;
}

/**
 * Format milliseconds to readable time string.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${seconds}.${tenths}s`;
}

/**
 * Get grade based on accuracy.
 */
function getGrade(accuracy: number): { grade: string; color: string } {
  if (accuracy >= 1.0) return { grade: 'S', color: '#FFD700' };
  if (accuracy >= 0.9) return { grade: 'A', color: '#00FF7F' };
  if (accuracy >= 0.8) return { grade: 'B', color: '#4DA6FF' };
  if (accuracy >= 0.7) return { grade: 'C', color: '#FFA500' };
  if (accuracy >= 0.6) return { grade: 'D', color: '#FF6B6B' };
  return { grade: 'F', color: '#FF0000' };
}

/**
 * Display results for a completed sentence.
 */
export function SentenceResultsDisplay({
  sentence,
  wordResults,
  totalTime,
  onNext,
  onRetry,
}: SentenceResultsDisplayProps) {
  // Calculate statistics
  const correctCount = wordResults.filter(r => r.isCorrect).length;
  const accuracy = wordResults.length > 0 ? correctCount / wordResults.length : 0;
  const chordCount = wordResults.filter(r => r.usedChord).length;
  const chordUsage = wordResults.length > 0 ? chordCount / wordResults.length : 0;
  const avgResponseTime = wordResults.length > 0
    ? wordResults.reduce((sum, r) => sum + r.responseTimeMs, 0) / wordResults.length
    : 0;
  const wpm = totalTime > 0 ? Math.round((wordResults.length / (totalTime / 1000)) * 60) : 0;

  const gradeInfo = getGrade(accuracy);

  return (
    <div className="sentence-results">
      <div className="results-header">
        <h2>Sentence Complete!</h2>
        <div className="grade-badge" style={{ backgroundColor: gradeInfo.color }}>
          {gradeInfo.grade}
        </div>
      </div>

      <div className="results-sentence">
        "{sentence.text}"
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{Math.round(accuracy * 100)}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{wpm}</span>
          <span className="stat-label">WPM</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{Math.round(chordUsage * 100)}%</span>
          <span className="stat-label">Chord Usage</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{Math.round(avgResponseTime)}ms</span>
          <span className="stat-label">Avg Response</span>
        </div>
      </div>

      <div className="word-breakdown">
        <h3>Word Breakdown</h3>
        <div className="word-results-list">
          {wordResults.map((result, index) => (
            <WordResultItem
              key={`${result.word}-${index}`}
              result={result}
              targetWord={sentence.words[index]}
            />
          ))}
        </div>
      </div>

      <div className="results-summary">
        <div className="summary-row">
          <span>Total Time:</span>
          <span>{formatTime(totalTime)}</span>
        </div>
        <div className="summary-row">
          <span>Words Correct:</span>
          <span>{correctCount} / {wordResults.length}</span>
        </div>
        <div className="summary-row">
          <span>Chords Used:</span>
          <span>{chordCount} / {wordResults.length}</span>
        </div>
      </div>

      <div className="results-actions">
        {accuracy < 1 && (
          <button className="secondary-button" onClick={onRetry}>
            Retry Sentence
          </button>
        )}
        <button className="primary-button" onClick={onNext}>
          Next Sentence
        </button>
      </div>
    </div>
  );
}

/**
 * Props for individual word result display.
 */
interface WordResultItemProps {
  result: WordResult;
  targetWord: string;
}

/**
 * Display result for a single word.
 */
function WordResultItem({ result, targetWord }: WordResultItemProps) {
  const responseClass = result.responseTimeMs < 500 ? 'fast' :
                        result.responseTimeMs < 1000 ? 'normal' : 'slow';

  return (
    <div className={`word-result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="word-result-main">
        <span className="word-target">{targetWord}</span>
        {!result.isCorrect && (
          <span className="word-typed">typed: "{result.typed}"</span>
        )}
      </div>
      <div className="word-result-meta">
        <span className={`response-time ${responseClass}`}>
          {result.responseTimeMs}ms
        </span>
        {result.usedChord && (
          <span className="chord-badge" title="Chord detected">
            &#9889;
          </span>
        )}
        <span className={`status-icon ${result.isCorrect ? 'correct' : 'incorrect'}`}>
          {result.isCorrect ? '✓' : '✗'}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact results display for inline use.
 */
export interface CompactResultsProps {
  accuracy: number;
  wpm: number;
  chordUsage: number;
}

export function CompactResults({ accuracy, wpm, chordUsage }: CompactResultsProps) {
  return (
    <div className="compact-results">
      <span className="compact-stat">
        <span className="label">Acc:</span>
        <span className="value">{Math.round(accuracy * 100)}%</span>
      </span>
      <span className="compact-stat">
        <span className="label">WPM:</span>
        <span className="value">{wpm}</span>
      </span>
      <span className="compact-stat">
        <span className="label">Chords:</span>
        <span className="value">{Math.round(chordUsage * 100)}%</span>
      </span>
    </div>
  );
}

export default SentenceResultsDisplay;

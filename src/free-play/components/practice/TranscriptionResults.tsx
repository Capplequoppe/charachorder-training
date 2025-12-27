/**
 * Transcription Results Component
 *
 * Displays comprehensive analysis after completing a transcription.
 * Shows WPM, accuracy, chord usage, and word-by-word breakdown.
 */

import React, { useMemo } from 'react';
import { type TranscriptionText } from '@/data/static/transcriptionTexts';
import { type TranscriptionAnalysis, type WordAnalysis } from '@/free-play/services/TranscriptionService';
import './practice.css';

export interface TranscriptionResultsProps {
  /** The transcribed text */
  text: TranscriptionText;
  /** Analysis of the transcription */
  analysis: TranscriptionAnalysis;
  /** Handler for retrying same text */
  onRetry: () => void;
  /** Handler for selecting new text */
  onNewText: () => void;
}

/**
 * Format milliseconds to readable time.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Get grade based on WPM and accuracy.
 */
function getGrade(wpm: number, accuracy: number): { grade: string; color: string } {
  const score = (wpm / 100) * 0.5 + accuracy * 0.5;

  if (score >= 0.9) return { grade: 'S', color: '#FFD700' };
  if (score >= 0.8) return { grade: 'A', color: '#00FF7F' };
  if (score >= 0.7) return { grade: 'B', color: '#4DA6FF' };
  if (score >= 0.6) return { grade: 'C', color: '#FFA500' };
  if (score >= 0.5) return { grade: 'D', color: '#FF6B6B' };
  return { grade: 'F', color: '#FF0000' };
}

/**
 * Get performance message based on results.
 */
function getPerformanceMessage(wpm: number, accuracy: number): string {
  if (accuracy >= 0.98 && wpm >= 80) {
    return 'Excellent! You\'re typing like a pro!';
  }
  if (accuracy >= 0.95 && wpm >= 60) {
    return 'Great work! Keep practicing to improve your speed.';
  }
  if (accuracy >= 0.90) {
    return 'Good job! Focus on accuracy and speed will follow.';
  }
  if (accuracy >= 0.80) {
    return 'Nice effort! Try to reduce errors for better accuracy.';
  }
  return 'Keep practicing! Accuracy improves with time.';
}

/**
 * Display transcription results and analysis.
 */
export function TranscriptionResults({
  text,
  analysis,
  onRetry,
  onNewText,
}: TranscriptionResultsProps) {
  const gradeInfo = useMemo(
    () => getGrade(analysis.wpm, analysis.accuracy),
    [analysis.wpm, analysis.accuracy]
  );

  const performanceMessage = useMemo(
    () => getPerformanceMessage(analysis.wpm, analysis.accuracy),
    [analysis.wpm, analysis.accuracy]
  );

  return (
    <div className="transcription-results">
      <div className="results-header">
        <h2>Transcription Complete!</h2>
        <div
          className="grade-badge large"
          style={{ backgroundColor: gradeInfo.color }}
        >
          {gradeInfo.grade}
        </div>
      </div>

      <p className="performance-message">{performanceMessage}</p>

      <div className="text-info">
        <span className="text-title">{text.title}</span>
        <span className="text-meta">
          {text.wordCount} words &bull; {text.category}
        </span>
      </div>

      <div className="main-stats">
        <div className="main-stat">
          <span className="stat-value large">{Math.round(analysis.wpm)}</span>
          <span className="stat-label">WPM</span>
        </div>
        <div className="main-stat">
          <span className="stat-value large">{Math.round(analysis.accuracy * 100)}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
      </div>

      <div className="detailed-stats">
        <div className="stat-row">
          <span className="stat-name">Raw WPM</span>
          <span className="stat-value">{Math.round(analysis.rawWpm)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Chord Usage</span>
          <span className="stat-value">{Math.round(analysis.chordUsageRate * 100)}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Errors per Minute</span>
          <span className="stat-value">{analysis.errorsPerMinute.toFixed(1)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Corrections Made</span>
          <span className="stat-value">{Math.round(analysis.correctionRate * 100)}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Consistency</span>
          <span className="stat-value">{Math.round(analysis.consistencyScore * 100)}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Total Time</span>
          <span className="stat-value">{formatTime(analysis.totalTimeMs)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Characters Typed</span>
          <span className="stat-value">{analysis.totalCharacters}</span>
        </div>
        <div className="stat-row">
          <span className="stat-name">Total Errors</span>
          <span className="stat-value">{analysis.totalErrors}</span>
        </div>
      </div>

      {analysis.wordAnalysis.length > 0 && (
        <WordAnalysisSection words={analysis.wordAnalysis} />
      )}

      <div className="results-actions">
        <button className="secondary-button" onClick={onRetry}>
          Retry Same Text
        </button>
        <button className="primary-button" onClick={onNewText}>
          Try New Text
        </button>
      </div>
    </div>
  );
}

/**
 * Word analysis section component.
 */
function WordAnalysisSection({ words }: { words: WordAnalysis[] }) {
  // Show only first 30 words and those with errors
  const displayWords = useMemo(() => {
    const errors = words.filter(w => !w.isCorrect);
    const first30 = words.slice(0, 30);

    // Combine unique words
    const shown = new Set<number>();
    const result: Array<{ word: WordAnalysis; index: number }> = [];

    // Add first 20
    first30.slice(0, 20).forEach((w, i) => {
      if (!shown.has(i)) {
        result.push({ word: w, index: i });
        shown.add(i);
      }
    });

    // Add errors
    errors.forEach((w) => {
      const idx = words.indexOf(w);
      if (!shown.has(idx)) {
        result.push({ word: w, index: idx });
        shown.add(idx);
      }
    });

    return result.sort((a, b) => a.index - b.index);
  }, [words]);

  const errorCount = words.filter(w => !w.isCorrect).length;
  const chordCount = words.filter(w => w.usedChord).length;

  return (
    <div className="word-analysis-section">
      <div className="section-header">
        <h3>Word Analysis</h3>
        <div className="section-summary">
          <span>{words.length} words</span>
          <span className="divider">&bull;</span>
          <span className={errorCount > 0 ? 'error-count' : ''}>
            {errorCount} errors
          </span>
          <span className="divider">&bull;</span>
          <span>{chordCount} chords</span>
        </div>
      </div>

      <div className="word-grid">
        {displayWords.map(({ word, index }) => (
          <WordAnalysisItem key={index} word={word} />
        ))}
      </div>

      {words.length > displayWords.length && (
        <p className="more-words">
          + {words.length - displayWords.length} more words
        </p>
      )}
    </div>
  );
}

/**
 * Individual word analysis item.
 */
function WordAnalysisItem({ word }: { word: WordAnalysis }) {
  return (
    <div className={`word-analysis-item ${word.isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="word-content">
        <span className="target-word">{word.word}</span>
        {!word.isCorrect && word.typed && (
          <span className="typed-word">typed: "{word.typed}"</span>
        )}
      </div>
      <div className="word-meta">
        <span className="response-time">{Math.round(word.responseTimeMs)}ms</span>
        {word.usedChord && (
          <span className="chord-indicator" title="Chord detected">&#9889;</span>
        )}
        <span className={`status-icon ${word.isCorrect ? 'correct' : 'incorrect'}`}>
          {word.isCorrect ? '✓' : '✗'}
        </span>
      </div>
    </div>
  );
}

export default TranscriptionResults;

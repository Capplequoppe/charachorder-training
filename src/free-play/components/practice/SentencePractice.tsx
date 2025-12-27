/**
 * Sentence Practice Component
 *
 * Main component for sentence-based typing practice.
 * Tracks word-by-word progress, timing, and chord usage.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  type PracticeSentence,
  type SentenceDifficulty,
  type SentenceCategory,
  SENTENCE_CATEGORIES,
} from '@/data/static/sentences';
import {
  type SentenceSelection,
  type WordResult,
  type SentenceResults,
  getSentenceService,
} from '@/free-play/services/SentenceService';
import {
  detectChordUsage,
  compareWords,
  normalizeWordInput,
} from '@/utils/chordDetection';
import { WordHighlight } from './WordHighlight';
import { SentenceResultsDisplay } from './SentenceResults';
import './practice.css';

export interface SentencePracticeProps {
  /** Called when practice session is complete */
  onComplete?: (results: SentenceResults[]) => void;
  /** Called when user exits practice */
  onExit?: () => void;
  /** Initial difficulty filter */
  difficulty?: SentenceDifficulty;
  /** Initial category filter */
  category?: SentenceCategory;
  /** Whether to show chord hints */
  showChordHints?: boolean;
  /** Number of sentences per session */
  sentenceCount?: number;
}

type Phase = 'setup' | 'ready' | 'typing' | 'results' | 'session-complete';

export function SentencePractice({
  onComplete,
  onExit,
  difficulty: initialDifficulty,
  category: initialCategory,
  showChordHints = false,
  sentenceCount = 5,
}: SentencePracticeProps) {
  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');
  const [currentSentence, setCurrentSentence] = useState<SentenceSelection | null>(null);
  const [completedSentenceIds, setCompletedSentenceIds] = useState<string[]>([]);
  const [sessionResults, setSessionResults] = useState<SentenceResults[]>([]);

  // Settings
  const [difficulty, setDifficulty] = useState<SentenceDifficulty | undefined>(initialDifficulty);
  const [category, setCategory] = useState<SentenceCategory | undefined>(initialCategory);
  const [hintsEnabled, setHintsEnabled] = useState(showChordHints);

  // Current sentence progress
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [sentenceStartTime, setSentenceStartTime] = useState<number | null>(null);
  const [wordStartTime, setWordStartTime] = useState<number | null>(null);

  // Current sentence result for display
  const [currentResult, setCurrentResult] = useState<SentenceResults | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const sentenceService = useMemo(() => {
    try {
      return getSentenceService();
    } catch {
      return null;
    }
  }, []);

  // Load next sentence
  const loadNextSentence = useCallback(() => {
    if (!sentenceService) return;

    const selection = sentenceService.selectAdaptiveSentence({
      difficulty,
      category,
      excludeIds: completedSentenceIds,
    });

    if (selection) {
      setCurrentSentence(selection);
      setCurrentWordIndex(0);
      setInput('');
      setWordResults([]);
      setSentenceStartTime(null);
      setWordStartTime(null);
      setPhase('ready');
    } else {
      // No more sentences available
      setPhase('session-complete');
    }
  }, [sentenceService, difficulty, category, completedSentenceIds]);

  // Start typing the current sentence
  const startTyping = useCallback(() => {
    const now = Date.now();
    setSentenceStartTime(now);
    setWordStartTime(now);
    setPhase('typing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle Enter key for setup and ready phases
  useEffect(() => {
    if (phase !== 'setup' && phase !== 'ready') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'setup') {
          // Trigger handleStart which is defined later, so we replicate the logic
          if (sentenceService) {
            const selected = sentenceService.getNextSentence(completedSentenceIds, { difficulty, category })
            if (selected) {
              setCurrentSentence(selected);
              setPhase('ready');
            }
          }
        } else if (phase === 'ready') {
          startTyping();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, startTyping, sentenceService, difficulty, category, completedSentenceIds]);

  // Handle word completion
  const handleWordComplete = useCallback((typedWord: string, isCorrect: boolean) => {
    if (!currentSentence) return;

    const now = Date.now();
    const responseTime = wordStartTime ? now - wordStartTime : 0;
    const currentWord = currentSentence.sentence.words[currentWordIndex];

    // Detect if chord was used
    const chordResult = detectChordUsage(currentWord, typedWord, responseTime);

    const result: WordResult = {
      word: currentWord,
      typed: typedWord,
      isCorrect,
      responseTimeMs: responseTime,
      usedChord: chordResult.usedChord,
      typingPattern: chordResult.typingPattern,
    };

    setWordResults(prev => [...prev, result]);
    setInput('');
    setWordStartTime(Date.now());

    // Check if sentence is complete
    if (currentWordIndex >= currentSentence.sentence.words.length - 1) {
      completeSentence();
    } else {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentSentence, currentWordIndex, wordStartTime]);

  // Complete the current sentence
  const completeSentence = useCallback(() => {
    if (!currentSentence || !sentenceStartTime || !sentenceService) return;

    const now = Date.now();
    const totalTime = now - sentenceStartTime;
    const allResults = [...wordResults];

    // Include the last word result
    if (allResults.length < currentSentence.sentence.words.length) {
      const lastWordResponse = wordStartTime ? now - wordStartTime : 0;
      const lastWord = currentSentence.sentence.words[currentWordIndex];
      const chordResult = detectChordUsage(lastWord, input, lastWordResponse);

      allResults.push({
        word: lastWord,
        typed: normalizeWordInput(input),
        isCorrect: compareWords(input, lastWord),
        responseTimeMs: lastWordResponse,
        usedChord: chordResult.usedChord,
        typingPattern: chordResult.typingPattern,
      });
    }

    const result: SentenceResults = {
      sentence: currentSentence.sentence,
      wordResults: allResults,
      totalTimeMs: totalTime,
      wpm: sentenceService.calculateWpm(currentSentence.sentence.words.length, totalTime),
      accuracy: sentenceService.calculateAccuracy(allResults),
      chordUsage: sentenceService.calculateChordUsage(allResults),
      avgResponseTimeMs: allResults.reduce((sum, r) => sum + r.responseTimeMs, 0) / allResults.length,
      completedAt: new Date(),
    };

    setCurrentResult(result);
    setSessionResults(prev => [...prev, result]);
    setCompletedSentenceIds(prev => [...prev, currentSentence.sentence.id]);
    setPhase('results');
  }, [currentSentence, sentenceStartTime, wordStartTime, wordResults, currentWordIndex, input, sentenceService]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (!currentSentence) return;

    const currentWord = currentSentence.sentence.words[currentWordIndex];

    // Check for word completion (space or at end of sentence)
    if (value.endsWith(' ')) {
      const typedWord = value.trimEnd();
      const isCorrect = compareWords(typedWord, currentWord);
      handleWordComplete(typedWord, isCorrect);
    }
  };

  // Handle key press for special keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!currentSentence) return;

    const currentWord = currentSentence.sentence.words[currentWordIndex];
    const isLastWord = currentWordIndex === currentSentence.sentence.words.length - 1;

    // Enter key completes the current word (useful for last word)
    if (e.key === 'Enter' && input.trim().length > 0) {
      e.preventDefault();
      const typedWord = input.trim();
      const isCorrect = compareWords(typedWord, currentWord);
      handleWordComplete(typedWord, isCorrect);
    }

    // Escape to exit
    if (e.key === 'Escape') {
      onExit?.();
    }
  };

  // Handle retry
  const handleRetry = () => {
    // Remove from completed to allow retry
    setCompletedSentenceIds(prev =>
      prev.filter(id => id !== currentSentence?.sentence.id)
    );
    // Remove result from session
    setSessionResults(prev => prev.slice(0, -1));
    // Reset current sentence
    setCurrentWordIndex(0);
    setInput('');
    setWordResults([]);
    setSentenceStartTime(null);
    setWordStartTime(null);
    setPhase('ready');
  };

  // Handle next sentence
  const handleNext = () => {
    if (sessionResults.length >= sentenceCount) {
      setPhase('session-complete');
      onComplete?.(sessionResults);
    } else {
      loadNextSentence();
    }
  };

  // Start practice session
  const handleStart = () => {
    setCompletedSentenceIds([]);
    setSessionResults([]);
    loadNextSentence();
  };

  // Render setup screen
  const renderSetup = () => (
    <div className="sentence-practice-setup">
      <h2>Sentence Practice</h2>
      <p>Practice typing complete sentences to build fluency and speed.</p>

      <div className="setup-options">
        <div className="option-group">
          <label>Difficulty</label>
          <div className="button-group">
            {(['beginner', 'intermediate', 'advanced'] as SentenceDifficulty[]).map(d => (
              <button
                key={d}
                className={`option-button ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(difficulty === d ? undefined : d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>Category</label>
          <div className="button-group">
            {SENTENCE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`option-button ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(category === cat.id ? undefined : cat.id)}
                title={cat.description}
              >
                <span className="icon">{cat.icon}</span>
                {cat.displayName}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>Options</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hintsEnabled}
                onChange={(e) => setHintsEnabled(e.target.checked)}
              />
              Show chord hints
            </label>
          </div>
        </div>
      </div>

      <div className="setup-actions">
        <button className="primary-button" onClick={handleStart}>
          Start Practice
        </button>
        {onExit && (
          <button className="secondary-button" onClick={onExit}>
            Back
          </button>
        )}
      </div>
    </div>
  );

  // Render ready screen
  const renderReady = () => (
    <div className="sentence-practice-ready">
      <div className="ready-content">
        <h3>Ready?</h3>
        <div className="sentence-preview">
          {currentSentence?.sentence.text}
        </div>
        <p className="ready-hint">Press Start or click below to begin</p>
        <button className="primary-button" onClick={startTyping} autoFocus>
          Start Typing
        </button>
      </div>
      <div className="ready-stats">
        <span>{currentSentence?.sentence.words.length} words</span>
        <span className={`difficulty ${currentSentence?.sentence.difficulty}`}>
          {currentSentence?.sentence.difficulty}
        </span>
      </div>
    </div>
  );

  // Render typing phase
  const renderTyping = () => (
    <div className="sentence-practice-typing">
      <div className="sentence-display">
        {currentSentence?.sentence.words.map((word, index) => (
          <WordHighlight
            key={`${word}-${index}`}
            word={word}
            status={
              index < currentWordIndex
                ? wordResults[index]?.isCorrect
                  ? 'completed'
                  : 'error'
                : index === currentWordIndex
                ? 'current'
                : 'upcoming'
            }
            showChordHint={hintsEnabled && index === currentWordIndex}
          />
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="sentence-input"
        placeholder="Type the highlighted word..."
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <div className="typing-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(currentWordIndex / (currentSentence?.sentence.words.length || 1)) * 100}%`,
            }}
          />
        </div>
        <span className="progress-text">
          {currentWordIndex + 1} / {currentSentence?.sentence.words.length}
        </span>
      </div>

      <div className="typing-stats">
        {wordResults.length > 0 && (
          <>
            <div className="stat">
              <span className="stat-value">
                {Math.round((wordResults.filter(r => r.isCorrect).length / wordResults.length) * 100)}%
              </span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {wordResults.filter(r => r.usedChord).length}
              </span>
              <span className="stat-label">Chords</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render results phase
  const renderResults = () => {
    if (!currentResult || !currentSentence) return null;

    return (
      <SentenceResultsDisplay
        sentence={currentSentence.sentence}
        wordResults={currentResult.wordResults}
        totalTime={currentResult.totalTimeMs}
        onNext={handleNext}
        onRetry={handleRetry}
      />
    );
  };

  // Render session complete
  const renderSessionComplete = () => {
    const totalWords = sessionResults.reduce((sum, r) => sum + r.wordResults.length, 0);
    const totalCorrect = sessionResults.reduce(
      (sum, r) => sum + r.wordResults.filter(w => w.isCorrect).length,
      0
    );
    const avgWpm = sessionResults.reduce((sum, r) => sum + r.wpm, 0) / sessionResults.length;
    const avgAccuracy = totalCorrect / totalWords;
    const totalChords = sessionResults.reduce(
      (sum, r) => sum + r.wordResults.filter(w => w.usedChord).length,
      0
    );

    return (
      <div className="session-complete">
        <h2>Session Complete!</h2>

        <div className="session-stats-grid">
          <div className="session-stat">
            <span className="stat-value">{sessionResults.length}</span>
            <span className="stat-label">Sentences</span>
          </div>
          <div className="session-stat">
            <span className="stat-value">{totalWords}</span>
            <span className="stat-label">Words</span>
          </div>
          <div className="session-stat">
            <span className="stat-value">{Math.round(avgWpm)}</span>
            <span className="stat-label">Avg WPM</span>
          </div>
          <div className="session-stat">
            <span className="stat-value">{Math.round(avgAccuracy * 100)}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="session-stat">
            <span className="stat-value">{totalChords}</span>
            <span className="stat-label">Chords Used</span>
          </div>
        </div>

        <div className="session-actions">
          <button className="primary-button" onClick={handleStart}>
            Practice More
          </button>
          {onExit && (
            <button className="secondary-button" onClick={onExit}>
              Exit
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render based on phase
  return (
    <div className="sentence-practice">
      {phase === 'setup' && renderSetup()}
      {phase === 'ready' && renderReady()}
      {phase === 'typing' && renderTyping()}
      {phase === 'results' && renderResults()}
      {phase === 'session-complete' && renderSessionComplete()}
    </div>
  );
}

export default SentencePractice;

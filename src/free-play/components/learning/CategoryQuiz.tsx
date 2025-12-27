/**
 * CategoryQuiz Component
 *
 * Quiz mode focused on words from a specific semantic category.
 * Tests user knowledge of word chords within a category context.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  SemanticCategory,
  getCategoryDefinition,
  getWordsByCategory,
} from '../../data/static/semanticCategories';
import { getRepositories } from '../../data';
import './learning.css';

/**
 * Props for CategoryQuiz component.
 */
export interface CategoryQuizProps {
  /** Category to quiz */
  category: SemanticCategory;
  /** Number of words to quiz (default: 10) */
  wordCount?: number;
  /** Callback when quiz is complete */
  onComplete?: (results: QuizResults) => void;
  /** Callback to exit quiz */
  onExit?: () => void;
}

/**
 * Quiz results summary.
 */
export interface QuizResults {
  category: SemanticCategory;
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  averageTimeMs: number;
  wordResults: WordResult[];
}

/**
 * Result for a single word.
 */
interface WordResult {
  word: string;
  correct: boolean;
  timeMs: number;
  attempts: number;
}

/**
 * Quiz phase states.
 */
type QuizPhase = 'intro' | 'quiz' | 'results';

/**
 * Shuffle array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * CategoryQuiz - quiz focused on a single category.
 */
export function CategoryQuiz({
  category,
  wordCount = 10,
  onComplete,
  onExit,
}: CategoryQuizProps): React.ReactElement {
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Use ref for timing to avoid effect-based setState
  const startTimeRef = useRef<number>(0);

  // Get category definition
  const categoryDef = useMemo(
    () => getCategoryDefinition(category),
    [category]
  );

  // Get and shuffle words for this category
  const quizWords = useMemo(() => {
    const words = getWordsByCategory(category);
    const shuffled = shuffleArray(words);
    return shuffled.slice(0, Math.min(wordCount, shuffled.length));
  }, [category, wordCount]);

  const currentWord = quizWords[currentIndex];
  const progress = ((currentIndex) / quizWords.length) * 100;

  // Reset timing when quiz phase changes or word changes
  useEffect(() => {
    if (phase === 'quiz') {
      startTimeRef.current = Date.now();
    }
  }, [phase, currentIndex]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  // Check answer
  const checkAnswer = useCallback(() => {
    const isCorrect = userInput.toLowerCase().trim() === currentWord.toLowerCase();
    const timeMs = Date.now() - startTimeRef.current;

    if (isCorrect) {
      // Record result
      const result: WordResult = {
        word: currentWord,
        correct: true,
        timeMs,
        attempts: attempts + 1,
      };
      setWordResults((prev) => [...prev, result]);

      // Show feedback
      setShowFeedback('correct');

      // Update progress in repository
      try {
        const { progress: progressRepo } = getRepositories();
        const wordProgress = progressRepo.getOrCreate(currentWord, 'word');
        wordProgress.totalAttempts++;
        wordProgress.correctAttempts++;
        wordProgress.lastAttemptDate = new Date();
        wordProgress.averageResponseTimeMs = Math.round(
          (wordProgress.averageResponseTimeMs * (wordProgress.totalAttempts - 1) + timeMs) /
            wordProgress.totalAttempts
        );
        progressRepo.saveWordProgress(wordProgress);
      } catch {
        // Ignore repository errors
      }

      // Move to next word after delay
      setTimeout(() => {
        setShowFeedback(null);
        setUserInput('');
        setAttempts(0);
        if (currentIndex + 1 >= quizWords.length) {
          setPhase('results');
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 800);
    } else {
      setAttempts((prev) => prev + 1);
      setShowFeedback('incorrect');

      // If 3 wrong attempts, show answer and move on
      if (attempts >= 2) {
        const result: WordResult = {
          word: currentWord,
          correct: false,
          timeMs,
          attempts: attempts + 1,
        };
        setWordResults((prev) => [...prev, result]);

        setTimeout(() => {
          setShowFeedback(null);
          setUserInput('');
          setAttempts(0);
          if (currentIndex + 1 >= quizWords.length) {
            setPhase('results');
          } else {
            setCurrentIndex((prev) => prev + 1);
          }
        }, 1500);
      } else {
        setTimeout(() => setShowFeedback(null), 500);
      }
    }
  }, [userInput, currentWord, attempts, currentIndex, quizWords.length]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.trim()) {
      checkAnswer();
    }
  };

  // Calculate results
  const results = useMemo<QuizResults>(() => {
    const correctCount = wordResults.filter((r) => r.correct).length;
    const totalTime = wordResults.reduce((sum, r) => sum + r.timeMs, 0);

    return {
      category,
      totalWords: wordResults.length,
      correctCount,
      incorrectCount: wordResults.length - correctCount,
      accuracy: wordResults.length > 0 ? correctCount / wordResults.length : 0,
      averageTimeMs: wordResults.length > 0 ? totalTime / wordResults.length : 0,
      wordResults,
    };
  }, [category, wordResults]);

  // Handle quiz completion
  useEffect(() => {
    if (phase === 'results') {
      onComplete?.(results);
    }
  }, [phase, results, onComplete]);

  // Render intro phase
  const renderIntro = () => (
    <div className="quiz-intro">
      <div
        className="intro-header"
        style={{ backgroundColor: categoryDef?.color || '#888' }}
      >
        <span className="intro-icon">{categoryDef?.icon}</span>
        <h2>{categoryDef?.displayName} Quiz</h2>
      </div>

      <p className="intro-description">{categoryDef?.description}</p>

      <div className="intro-info">
        <div className="info-item">
          <span className="info-value">{quizWords.length}</span>
          <span className="info-label">Words</span>
        </div>
        <div className="info-item">
          <span className="info-value">Type</span>
          <span className="info-label">Input Method</span>
        </div>
      </div>

      <div className="intro-tip">
        <strong>Tip:</strong> {categoryDef?.learningTip}
      </div>

      <div className="intro-actions">
        <button className="btn primary large" onClick={() => setPhase('quiz')}>
          Start Quiz
        </button>
        <button className="btn secondary" onClick={onExit}>
          Back
        </button>
      </div>
    </div>
  );

  // Render quiz phase
  const renderQuiz = () => (
    <div className="quiz-active">
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: categoryDef?.color || '#3498db',
              }}
            />
          </div>
          <span className="progress-text">
            {currentIndex + 1} / {quizWords.length}
          </span>
        </div>
        <button className="btn-icon" onClick={onExit} title="Exit Quiz">
          &#10005;
        </button>
      </div>

      <div className="quiz-prompt">
        <span className="category-badge" style={{ backgroundColor: categoryDef?.color }}>
          {categoryDef?.icon} {categoryDef?.displayName}
        </span>
        <p className="prompt-text">Type the word:</p>
        <div className="word-display">
          {currentWord.split('').map((char, i) => (
            <span key={i} className="word-char hidden">
              {char}
            </span>
          ))}
        </div>
        <p className="word-hint">
          {currentWord.length} letters • Starts with "{currentWord[0]}"
        </p>
      </div>

      <div className={`quiz-input-container ${showFeedback || ''}`}>
        <input
          type="text"
          className="quiz-input"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type the word..."
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          className="btn primary"
          onClick={checkAnswer}
          disabled={!userInput.trim()}
        >
          Check
        </button>
      </div>

      {showFeedback === 'correct' && (
        <div className="feedback correct">
          <span className="feedback-icon">&#10003;</span>
          Correct!
        </div>
      )}

      {showFeedback === 'incorrect' && attempts < 3 && (
        <div className="feedback incorrect">
          <span className="feedback-icon">&#10007;</span>
          Try again! ({3 - attempts - 1} attempts left)
        </div>
      )}

      {showFeedback === 'incorrect' && attempts >= 3 && (
        <div className="feedback incorrect">
          <span className="feedback-icon">&#10007;</span>
          The answer was: <strong>{currentWord}</strong>
        </div>
      )}
    </div>
  );

  // Render results phase
  const renderResults = () => {
    const grade = results.accuracy >= 0.9 ? 'A' :
                  results.accuracy >= 0.8 ? 'B' :
                  results.accuracy >= 0.7 ? 'C' :
                  results.accuracy >= 0.6 ? 'D' : 'F';

    const gradeColor = results.accuracy >= 0.9 ? '#2ecc71' :
                       results.accuracy >= 0.8 ? '#3498db' :
                       results.accuracy >= 0.7 ? '#f1c40f' :
                       results.accuracy >= 0.6 ? '#e67e22' : '#e74c3c';

    return (
      <div className="quiz-results">
        <div
          className="results-header"
          style={{ backgroundColor: categoryDef?.color || '#888' }}
        >
          <span className="results-icon">{categoryDef?.icon}</span>
          <h2>Quiz Complete!</h2>
        </div>

        <div className="results-grade" style={{ color: gradeColor }}>
          {grade}
        </div>

        <div className="results-stats">
          <div className="stat">
            <span className="stat-value">{Math.round(results.accuracy * 100)}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat">
            <span className="stat-value">{results.correctCount}</span>
            <span className="stat-label">Correct</span>
          </div>
          <div className="stat">
            <span className="stat-value">{results.incorrectCount}</span>
            <span className="stat-label">Incorrect</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(results.averageTimeMs / 1000)}s</span>
            <span className="stat-label">Avg Time</span>
          </div>
        </div>

        <div className="results-breakdown">
          <h3>Word Breakdown</h3>
          <div className="word-results">
            {results.wordResults.map((result, i) => (
              <div
                key={i}
                className={`word-result ${result.correct ? 'correct' : 'incorrect'}`}
              >
                <span className="word-text">{result.word}</span>
                <span className="word-status">
                  {result.correct ? '✓' : '✗'}
                </span>
                <span className="word-time">{Math.round(result.timeMs / 1000)}s</span>
              </div>
            ))}
          </div>
        </div>

        <div className="results-actions">
          <button
            className="btn primary"
            onClick={() => {
              setPhase('intro');
              setCurrentIndex(0);
              setWordResults([]);
              setUserInput('');
            }}
          >
            Try Again
          </button>
          <button className="btn secondary" onClick={onExit}>
            Back to Categories
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="category-quiz">
      {phase === 'intro' && renderIntro()}
      {phase === 'quiz' && renderQuiz()}
      {phase === 'results' && renderResults()}
    </div>
  );
}

export default CategoryQuiz;

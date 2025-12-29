/**
 * QuizMode Component
 *
 * Quiz mode for testing chord knowledge.
 * Business logic extracted to useQuizMode hook.
 */

import { useState, useEffect, useRef } from 'react';
import type { WordEntry } from '../data/types';
import { ColoredChord } from './ColoredLetter';
import { FingerIndicator, HandVisualization } from './FingerIndicator';
import { useAudio } from '../hooks/useAudio';
import {
  getFingersForChord,
  Finger,
  getFingerForChar,
  getDirectionForChar,
  getDirectionSymbol,
  getColorForChar,
  FINGER_NAMES,
  FINGERS_IN_ORDER,
} from '../config/fingerMapping';
import { Finger as FingerEntity } from '../domain';
import type { WordStats } from '../services';
import {
  useQuizMode,
  type Difficulty,
  type DifficultySettings,
  type QuizResult,
  DIFFICULTY_SETTINGS,
  getDifficultyColor,
  calculateScore,
} from '../hooks/useQuizMode';

// ============================================================================
// Main Component
// ============================================================================

export function QuizMode() {
  const quiz = useQuizMode();

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Quiz Mode</h2>

      {/* Stats bar */}
      <QuizStatsBar progress={quiz.progress} />

      {!quiz.quizStarted ? (
        <QuizSetup
          difficulty={quiz.difficulty}
          setDifficulty={quiz.setDifficulty}
          quizSize={quiz.quizSize}
          setQuizSize={quiz.setQuizSize}
          onStart={quiz.startQuiz}
          onResetStats={quiz.handleResetStats}
          hasStats={Object.keys(quiz.progress.wordStats).length > 0}
          learnedWordsCount={quiz.learnedWordsCount}
        />
      ) : quiz.isQuizComplete ? (
        <QuizComplete
          results={quiz.quizResults}
          totalScore={quiz.sessionScore}
          highScore={quiz.progress.highScore}
          onPlayAgain={quiz.endQuiz}
        />
      ) : (
        <QuizActiveSession
          currentWord={quiz.currentWord}
          currentIndex={quiz.currentIndex}
          quizWords={quiz.quizWords}
          upcomingWords={quiz.upcomingWords}
          sessionScore={quiz.sessionScore}
          settings={quiz.settings}
          wordStats={quiz.currentWord ? quiz.progress.wordStats[quiz.currentWord.word] : undefined}
          onComplete={quiz.handleWordComplete}
        />
      )}
    </div>
  );
}

// ============================================================================
// Stats Bar Component
// ============================================================================

interface QuizStatsBarProps {
  progress: {
    highScore: number;
    totalScore: number;
    quizzesCompleted: number;
    wordStats: Record<string, WordStats>;
  };
}

function QuizStatsBar({ progress }: QuizStatsBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#121212',
        borderRadius: '12px',
      }}
    >
      <div>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>High Score</div>
        <div style={{ color: '#f1c40f', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {progress.highScore}
        </div>
      </div>
      <div>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>Total Score</div>
        <div style={{ color: '#4a9eff', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {progress.totalScore}
        </div>
      </div>
      <div>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>Quizzes Completed</div>
        <div style={{ color: '#2ecc71', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {progress.quizzesCompleted}
        </div>
      </div>
      <div>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>Words Practiced</div>
        <div style={{ color: '#9b59b6', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {Object.keys(progress.wordStats).length}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Active Session Component
// ============================================================================

interface QuizActiveSessionProps {
  currentWord: WordEntry | undefined;
  currentIndex: number;
  quizWords: WordEntry[];
  upcomingWords: WordEntry[];
  sessionScore: number;
  settings: DifficultySettings;
  wordStats?: WordStats;
  onComplete: (result: QuizResult) => void;
}

function QuizActiveSession({
  currentWord,
  currentIndex,
  quizWords,
  upcomingWords,
  sessionScore,
  settings,
  wordStats,
  onComplete,
}: QuizActiveSessionProps) {
  return (
    <div>
      {/* Session progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#888' }}>
            Question {currentIndex + 1} of {quizWords.length}
          </span>
          <span style={{ color: '#4a9eff', fontWeight: 'bold' }}>Score: {sessionScore}</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(currentIndex / quizWords.length) * 100}%`,
              height: '100%',
              backgroundColor: '#4a9eff',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Main quiz area */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Current word */}
        <div style={{ flex: 1 }}>
          {currentWord && (
            <QuizQuestion
              word={currentWord}
              settings={settings}
              wordStats={wordStats}
              onComplete={onComplete}
            />
          )}
        </div>

        {/* Upcoming words preview */}
        <UpcomingWordsPanel upcomingWords={upcomingWords} />
      </div>
    </div>
  );
}

// ============================================================================
// Upcoming Words Panel
// ============================================================================

interface UpcomingWordsPanelProps {
  upcomingWords: WordEntry[];
}

function UpcomingWordsPanel({ upcomingWords }: UpcomingWordsPanelProps) {
  return (
    <div
      style={{
        width: '200px',
        backgroundColor: '#121212',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ color: '#888', marginBottom: '12px', fontSize: '0.875rem' }}>Coming Up:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {upcomingWords.map((word, index) => (
          <div
            key={word.word}
            style={{
              padding: '8px 12px',
              backgroundColor: '#222',
              borderRadius: '6px',
              borderLeft: `3px solid ${index === 0 ? '#4a9eff' : '#444'}`,
            }}
          >
            <div style={{ color: '#fff', fontWeight: index === 0 ? 'bold' : 'normal' }}>
              {word.word}
            </div>
            {word.rank && (
              <div style={{ color: '#666', fontSize: '0.75rem' }}>Rank #{word.rank}</div>
            )}
          </div>
        ))}
        {upcomingWords.length === 0 && (
          <div style={{ color: '#666', fontStyle: 'italic' }}>Last question!</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Setup Component
// ============================================================================

interface QuizSetupProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  quizSize: number;
  setQuizSize: (s: number) => void;
  onStart: () => void;
  onResetStats: () => void;
  hasStats: boolean;
  learnedWordsCount: number;
}

function QuizSetup({
  difficulty,
  setDifficulty,
  quizSize,
  setQuizSize,
  onStart,
  onResetStats,
  hasStats,
  learnedWordsCount,
}: QuizSetupProps) {
  const canStartQuiz = learnedWordsCount > 0;

  return (
    <div
      style={{
        backgroundColor: '#121212',
        borderRadius: '16px',
        padding: '32px',
      }}
    >
      <h3 style={{ color: '#fff', marginBottom: '24px' }}>Quiz Settings</h3>

      {/* Learned words count */}
      <div
        style={{
          padding: '16px',
          backgroundColor: canStartQuiz ? '#1a3a1a' : '#3a1a1a',
          borderRadius: '8px',
          marginBottom: '24px',
          border: `1px solid ${canStartQuiz ? '#2ecc71' : '#e74c3c'}`,
        }}
      >
        <div
          style={{
            color: canStartQuiz ? '#2ecc71' : '#e74c3c',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}
        >
          {canStartQuiz ? `${learnedWordsCount} words available for quiz` : 'No words learned yet'}
        </div>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>
          {canStartQuiz
            ? "Quiz will test you on words you've learned in Practice mode."
            : 'Go to the Learn tab and complete a practice session first to unlock the quiz.'}
        </div>
      </div>

      {/* Difficulty selection */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#888', marginBottom: '12px' }}>Difficulty:</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((d) => {
            const s = DIFFICULTY_SETTINGS[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: '16px 24px',
                  backgroundColor: difficulty === d ? getDifficultyColor(d) : '#222',
                  color: difficulty === d ? '#000' : '#fff',
                  border: `2px solid ${getDifficultyColor(d)}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: '180px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{s.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiz size */}
      <div style={{ marginBottom: '32px', opacity: canStartQuiz ? 1 : 0.5 }}>
        <div style={{ color: '#888', marginBottom: '12px' }}>
          Number of words:{' '}
          {learnedWordsCount > 0 && quizSize > learnedWordsCount && (
            <span style={{ color: '#f1c40f' }}>(max {learnedWordsCount} available)</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[5, 10, 20, 30, 50].map((size) => {
            const isAvailable = size <= learnedWordsCount;
            const isSelected =
              quizSize === size ||
              (quizSize > learnedWordsCount &&
                size ===
                  Math.max(...[5, 10, 20, 30, 50].filter((s) => s <= learnedWordsCount)));
            return (
              <button
                key={size}
                onClick={() => canStartQuiz && setQuizSize(size)}
                disabled={!canStartQuiz}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isSelected ? '#4a9eff' : '#222',
                  color: isAvailable ? '#fff' : '#666',
                  border: isSelected ? '2px solid #4a9eff' : '2px solid #444',
                  borderRadius: '8px',
                  cursor: canStartQuiz ? 'pointer' : 'not-allowed',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  opacity: isAvailable ? 1 : 0.5,
                }}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info box */}
      <div
        style={{
          backgroundColor: '#222',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ color: '#4a9eff', fontWeight: 'bold', marginBottom: '8px' }}>
          How scoring works:
        </div>
        <ul style={{ color: '#888', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Base score: 100 points per correct answer</li>
          <li>-20 points for each additional attempt</li>
          <li>Up to +50 bonus points for quick answers</li>
          <li>Failed words appear more frequently to help you practice</li>
        </ul>
      </div>

      {/* Start button */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={onStart}
          disabled={!canStartQuiz}
          style={{
            padding: '16px 48px',
            fontSize: '1.25rem',
            backgroundColor: canStartQuiz ? '#2ecc71' : '#444',
            color: canStartQuiz ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            cursor: canStartQuiz ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          {canStartQuiz ? 'Start Quiz' : 'Learn Words First'}
        </button>

        {hasStats && (
          <button
            onClick={onResetStats}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#888',
              border: '1px solid #444',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Reset All Stats
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Question Component
// ============================================================================

interface QuizQuestionProps {
  word: WordEntry;
  settings: DifficultySettings;
  wordStats?: WordStats;
  onComplete: (result: QuizResult) => void;
}

function QuizQuestion({ word, settings, wordStats, onComplete }: QuizQuestionProps) {
  const [typedText, setTypedText] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const { playFingerNote, playChordFromString, SUCCESS_DURATION, DEFAULT_DURATION } = useAudio();

  const primaryChord = word.chords[0];
  const fingers = getFingersForChord(primaryChord);
  const leftFingers = fingers.filter((f) => FingerEntity.isLeftHandId(f));
  const rightFingers = fingers.filter((f) => FingerEntity.isRightHandId(f));

  // Reset when word changes
  useEffect(() => {
    setTypedText('');
    setAttempts(0);
    setTimeLeft(settings.timeLimit);
    setIsComplete(false);
    setLastResult(null);
    isTransitioningRef.current = false;
    inputRef.current?.focus();
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, [word.word, settings.timeLimit]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (settings.timeLimit === 0 || isComplete) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.word, settings.timeLimit, isComplete]);

  const handleTimeout = () => {
    if (isComplete) return;
    setIsComplete(true);
    setLastResult('timeout');
    const result: QuizResult = {
      word: word.word,
      correct: false,
      timeMs: settings.timeLimit * 1000,
      attempts: attempts + 1,
      score: 0,
    };
    setTimeout(() => onComplete(result), 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase();
    const prevLength = typedText.length;

    // Play notes for new characters
    if (newValue.length > prevLength) {
      const newChar = newValue[newValue.length - 1];
      const finger = getFingerForChar(newChar);
      const isLastCharOfWord = newValue.trim() === word.word.toLowerCase();
      if (finger) {
        playFingerNote(finger, isLastCharOfWord ? SUCCESS_DURATION : DEFAULT_DURATION);
      }
    }

    setTypedText(newValue);

    // Clear any existing timeouts
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    // Check for chord completion when input ends with space
    if (newValue.endsWith(' ')) {
      if (isTransitioningRef.current) {
        return;
      }

      const typedWord = newValue.trim();
      const isCorrectWord = typedWord === word.word.toLowerCase();

      if (isCorrectWord) {
        isTransitioningRef.current = true;
        setIsComplete(true);
        setLastResult('correct');
        playChordFromString(primaryChord);

        const timeMs = Date.now() - startTime;
        const score = calculateScore(
          timeMs,
          attempts + 1,
          settings.maxAttempts,
          settings.timeLimit,
          true
        );

        const result: QuizResult = {
          word: word.word,
          correct: true,
          timeMs,
          attempts: attempts + 1,
          score,
        };
        setTimeout(() => onComplete(result), 800);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setLastResult('wrong');

        if (newAttempts >= settings.maxAttempts) {
          setIsComplete(true);
          const result: QuizResult = {
            word: word.word,
            correct: false,
            timeMs: Date.now() - startTime,
            attempts: newAttempts,
            score: 0,
          };
          setTimeout(() => onComplete(result), 1500);
        } else {
          clearTimeoutRef.current = window.setTimeout(() => {
            setTypedText('');
            setLastResult(null);
            inputRef.current?.focus();
            clearTimeoutRef.current = null;
          }, 500);
        }
      }
    }
  };

  const handleSubmit = () => {
    if (typedText.toLowerCase() !== word.word.toLowerCase()) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setTypedText('');
      setLastResult('wrong');

      if (newAttempts >= settings.maxAttempts) {
        setIsComplete(true);
        const result: QuizResult = {
          word: word.word,
          correct: false,
          timeMs: Date.now() - startTime,
          attempts: newAttempts,
          score: 0,
        };
        setTimeout(() => onComplete(result), 1500);
      } else {
        setTimeout(() => {
          setLastResult(null);
          inputRef.current?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComplete) {
      handleSubmit();
    }
  };

  const handleContainerClick = () => {
    if (!isComplete) {
      inputRef.current?.focus();
    }
  };

  const timerColor = timeLeft > 10 ? '#2ecc71' : timeLeft > 5 ? '#f1c40f' : '#e74c3c';

  return (
    <div
      onClick={handleContainerClick}
      style={{
        backgroundColor: '#121212',
        borderRadius: '16px',
        padding: '32px',
        position: 'relative',
        cursor: !isComplete ? 'text' : 'default',
      }}
    >
      {/* Timer */}
      {settings.timeLimit > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: `4px solid ${timerColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: timerColor,
            }}
          >
            {timeLeft}
          </div>
        </div>
      )}

      {/* Attempts indicator */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          gap: '4px',
        }}
      >
        {Array.from({ length: settings.maxAttempts }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: i < attempts ? '#e74c3c' : '#333',
              border: '2px solid #444',
            }}
          />
        ))}
      </div>

      {/* Word to type */}
      <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '8px' }}>{word.word}</h1>
        {word.rank && (
          <span
            style={{
              padding: '4px 12px',
              backgroundColor:
                word.rank <= 50 ? '#2ecc71' : word.rank <= 100 ? '#f1c40f' : '#666',
              color: word.rank <= 100 ? '#000' : '#fff',
              borderRadius: '12px',
              fontSize: '0.875rem',
            }}
          >
            Rank #{word.rank}
          </span>
        )}

        {wordStats && (
          <div style={{ marginTop: '8px', color: '#888', fontSize: '0.875rem' }}>
            Your accuracy:{' '}
            {Math.round(
              (wordStats.correct / Math.max(1, wordStats.correct + wordStats.failed)) * 100
            )}
            %
          </div>
        )}
      </div>

      {/* Feedback message */}
      {lastResult && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '16px',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color:
              lastResult === 'correct'
                ? '#2ecc71'
                : lastResult === 'timeout'
                ? '#f1c40f'
                : '#e74c3c',
          }}
        >
          {lastResult === 'correct' && 'Correct!'}
          {lastResult === 'wrong' && `Wrong! ${settings.maxAttempts - attempts} attempts left`}
          {lastResult === 'timeout' && "Time's up!"}
        </div>
      )}

      {/* Hidden input + Chord keys display */}
      {!isComplete && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isComplete}
            style={{
              position: 'absolute',
              left: '-9999px',
              opacity: 0,
            }}
          />

          {/* Chord keys with directions */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: '#888', marginBottom: '12px' }}>Chord Keys:</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              {primaryChord
                .split('')
                .filter((c) => c.match(/[a-z]/i))
                .sort((a, b) => {
                  const fingerA = getFingerForChar(a);
                  const fingerB = getFingerForChar(b);
                  const indexA = fingerA ? FINGERS_IN_ORDER.indexOf(fingerA) : 999;
                  const indexB = fingerB ? FINGERS_IN_ORDER.indexOf(fingerB) : 999;
                  return indexA - indexB;
                })
                .map((char, idx) => {
                  const direction = getDirectionForChar(char);
                  const color = getColorForChar(char);
                  const finger = getFingerForChar(char);
                  const fingerName = finger ? FINGER_NAMES[finger] : '';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#222',
                        borderRadius: '12px',
                        border: `2px solid ${color}`,
                        minWidth: '80px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {char}
                      </span>
                      <span
                        style={{
                          fontSize: '1.5rem',
                          color: '#fff',
                          marginTop: '4px',
                        }}
                      >
                        {getDirectionSymbol(direction)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#888',
                          marginTop: '4px',
                          textAlign: 'center',
                        }}
                      >
                        {fingerName}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* Reveal chord on failure */}
      {isComplete && !lastResult?.includes('correct') && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ color: '#888', marginBottom: '8px' }}>The chord was:</div>
          <div style={{ fontSize: '2rem' }}>
            <ColoredChord chord={primaryChord} size="large" />
          </div>
        </div>
      )}

      {/* Finger hints */}
      {settings.showFingerHints && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '16px',
            }}
          >
            <HandVisualization activeFingers={leftFingers as Finger[]} hand="left" />
            <HandVisualization activeFingers={rightFingers as Finger[]} hand="right" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <FingerIndicator activeFingers={fingers} size="medium" />
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Complete Component
// ============================================================================

interface QuizCompleteProps {
  results: QuizResult[];
  totalScore: number;
  highScore: number;
  onPlayAgain: () => void;
}

function QuizComplete({ results, totalScore, highScore, onPlayAgain }: QuizCompleteProps) {
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = Math.round((correctCount / results.length) * 100);
  const isNewHighScore = totalScore >= highScore && totalScore > 0;

  const avgTime =
    results.length > 0
      ? Math.round((results.reduce((sum, r) => sum + r.timeMs, 0) / results.length / 1000) * 10) /
        10
      : 0;

  return (
    <div
      style={{
        backgroundColor: '#121212',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <style>
        {`
          @keyframes celebratePop {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes shine {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}
      </style>

      <div
        style={{
          fontSize: '4rem',
          marginBottom: '16px',
          animation: 'celebratePop 0.5s ease-out',
        }}
      >
        {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}
      </div>

      <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '8px' }}>Quiz Complete!</h2>

      {isNewHighScore && (
        <div
          style={{
            color: '#f1c40f',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #f1c40f, #e74c3c, #f1c40f)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shine 2s linear infinite',
          }}
        >
          New High Score!
        </div>
      )}

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div style={{ backgroundColor: '#222', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '2rem', color: '#4a9eff', fontWeight: 'bold' }}>{totalScore}</div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Total Score</div>
        </div>
        <div style={{ backgroundColor: '#222', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '2rem', color: '#2ecc71', fontWeight: 'bold' }}>{accuracy}%</div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Accuracy</div>
        </div>
        <div style={{ backgroundColor: '#222', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '2rem', color: '#f1c40f', fontWeight: 'bold' }}>
            {correctCount}/{results.length}
          </div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Correct</div>
        </div>
        <div style={{ backgroundColor: '#222', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '2rem', color: '#9b59b6', fontWeight: 'bold' }}>{avgTime}s</div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Avg Time</div>
        </div>
      </div>

      {/* Results breakdown */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#888', marginBottom: '16px', textAlign: 'left' }}>
          Results Breakdown:
        </h3>
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#222',
                borderRadius: '8px',
                borderLeft: `4px solid ${result.correct ? '#2ecc71' : '#e74c3c'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: result.correct ? '#2ecc71' : '#e74c3c' }}>
                  {result.correct ? '✓' : '✗'}
                </span>
                <span style={{ color: '#fff' }}>{result.word}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#888', fontSize: '0.875rem' }}>
                  {(result.timeMs / 1000).toFixed(1)}s
                </span>
                <span style={{ color: '#888', fontSize: '0.875rem' }}>
                  {result.attempts} attempt{result.attempts > 1 ? 's' : ''}
                </span>
                <span
                  style={{
                    color: result.score > 100 ? '#f1c40f' : '#4a9eff',
                    fontWeight: 'bold',
                  }}
                >
                  +{result.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Play again button */}
      <button
        onClick={onPlayAgain}
        style={{
          padding: '16px 48px',
          fontSize: '1.25rem',
          backgroundColor: '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Play Again
      </button>
    </div>
  );
}

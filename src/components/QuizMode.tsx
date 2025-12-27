import { useState, useEffect, useRef } from 'react';
import { getWordsByRank } from '../data/chords';
import type { WordEntry } from '../data/types';
import { ColoredChord } from './ColoredLetter';
import { FingerIndicator, HandVisualization } from './FingerIndicator';
import { useAudio } from '../hooks/useAudio';
import { getFingersForChord, Finger, getFingerForChar, getDirectionForChar, getDirectionSymbol, getColorForChar, FINGER_NAMES, FINGERS_IN_ORDER } from '../config/fingerMapping';
import { Finger as FingerEntity } from '../domain';
import { getQuizProgressService, type QuizProgress, type WordStats } from '../services';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface DifficultySettings {
  timeLimit: number; // seconds, 0 = no limit
  maxAttempts: number; // number of attempts before fail
  showFingerHints: boolean;
  label: string;
  description: string;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    timeLimit: 0,
    maxAttempts: 5,
    showFingerHints: true,
    label: 'Easy',
    description: 'No time limit, 5 attempts, finger hints shown',
  },
  medium: {
    timeLimit: 30,
    maxAttempts: 3,
    showFingerHints: true,
    label: 'Medium',
    description: '30 seconds, 3 attempts, finger hints shown',
  },
  hard: {
    timeLimit: 15,
    maxAttempts: 2,
    showFingerHints: false,
    label: 'Hard',
    description: '15 seconds, 2 attempts, no hints',
  },
  expert: {
    timeLimit: 8,
    maxAttempts: 1,
    showFingerHints: false,
    label: 'Expert',
    description: '8 seconds, 1 attempt, no hints',
  },
};

// Local interface for quiz results (used internally)
interface QuizResult {
  word: string;
  correct: boolean;
  timeMs: number;
  attempts: number;
  score: number;
}

// Calculate score based on time and attempts
function calculateScore(
  timeMs: number,
  attempts: number,
  maxAttempts: number,
  timeLimit: number,
  correct: boolean
): number {
  if (!correct) return 0;

  // Base score
  let score = 100;

  // Attempt penalty (scaled by max attempts - more penalty if you have more attempts available)
  const attemptPenalty = (attempts - 1) * Math.floor(60 / maxAttempts);
  score -= attemptPenalty;

  // Time bonus (if time limit is set)
  if (timeLimit > 0) {
    const timeLimitMs = timeLimit * 1000;
    const timeRatio = 1 - timeMs / timeLimitMs;
    const timeBonus = Math.floor(timeRatio * 50); // Up to 50 bonus points
    score += Math.max(0, timeBonus);
  } else {
    // Small time bonus for quick answers even without limit
    if (timeMs < 2000) score += 30;
    else if (timeMs < 5000) score += 15;
    else if (timeMs < 10000) score += 5;
  }

  return Math.max(0, Math.min(150, score)); // Cap between 0-150
}

// Weighted random selection - failed words appear more often
function selectWeightedWords(
  allWords: WordEntry[],
  wordStats: Record<string, WordStats>,
  count: number
): WordEntry[] {
  // Calculate weights for each word
  const weights: { word: WordEntry; weight: number }[] = allWords.map((entry) => {
    const stats = wordStats[entry.word];
    let weight = 1;

    if (stats) {
      // Failed words get higher weight
      const failRatio = stats.failed / Math.max(1, stats.correct + stats.failed);
      weight += failRatio * 4; // Up to 5x weight for always-failed words

      // Words not seen recently get higher weight
      const hoursSinceLastAttempt = (Date.now() - stats.lastAttempt) / (1000 * 60 * 60);
      if (hoursSinceLastAttempt > 24) weight += 1;
      if (hoursSinceLastAttempt > 72) weight += 1;

      // Words with fewer attempts get slightly higher weight
      if (stats.totalAttempts < 3) weight += 0.5;
    } else {
      // Never seen words get moderate weight
      weight = 2;
    }

    // Higher ranked (more common) words get slightly higher weight
    if (entry.rank && entry.rank <= 50) weight += 0.5;
    else if (entry.rank && entry.rank <= 100) weight += 0.25;

    return { word: entry, weight };
  });

  // Weighted random selection
  const selected: WordEntry[] = [];
  const remaining = [...weights];

  while (selected.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < remaining.length; i++) {
      random -= remaining[i].weight;
      if (random <= 0) {
        selected.push(remaining[i].word);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

export function QuizMode() {
  const quizProgressService = getQuizProgressService();
  const [progress, setProgress] = useState<QuizProgress>(() => quizProgressService.loadProgress());
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [quizWords, setQuizWords] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [quizSize, setQuizSize] = useState(10);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  const allWords = getWordsByRank();
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // Load learned words from Practice mode
  useEffect(() => {
    setLearnedWords(quizProgressService.getLearnedWords());
  }, [quizStarted, quizProgressService]); // Re-check when quiz state changes

  // Filter to only learned words
  const availableWords = allWords.filter((w) => learnedWords.includes(w.word));

  const startQuiz = () => {
    // Refresh learned words before starting
    const currentLearnedWords = quizProgressService.getLearnedWords();
    setLearnedWords(currentLearnedWords);

    const learnedWordEntries = allWords.filter((w) => currentLearnedWords.includes(w.word));
    const words = selectWeightedWords(learnedWordEntries, progress.wordStats, Math.min(quizSize, learnedWordEntries.length));
    setQuizWords(words);
    setCurrentIndex(0);
    setQuizStarted(true);
    setQuizResults([]);
    setSessionScore(0);
  };

  const handleWordComplete = (result: QuizResult) => {
    // Update results
    setQuizResults((prev) => [...prev, result]);
    setSessionScore((prev) => prev + result.score);

    // Update progress via service
    quizProgressService.updateWordStats({
      word: result.word,
      correct: result.correct,
      timeMs: result.timeMs,
      attempts: result.attempts,
      score: result.score,
    });

    // Refresh progress state from service
    setProgress(quizProgressService.loadProgress());

    // Move to next word or end quiz
    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Quiz complete
      const finalScore = sessionScore + result.score;
      quizProgressService.recordQuizCompletion(finalScore);
      setProgress(quizProgressService.loadProgress());
    }
  };

  const handleResetStats = () => {
    quizProgressService.resetProgress();
    setProgress(quizProgressService.loadProgress());
  };

  const currentWord = quizWords[currentIndex];
  const upcomingWords = quizWords.slice(currentIndex + 1, currentIndex + 6);
  const isQuizComplete = quizStarted && currentIndex >= quizWords.length - 1 && quizResults.length === quizWords.length;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Quiz Mode</h2>

      {/* Stats bar */}
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

      {!quizStarted ? (
        <QuizSetup
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          quizSize={quizSize}
          setQuizSize={setQuizSize}
          onStart={startQuiz}
          onResetStats={handleResetStats}
          hasStats={Object.keys(progress.wordStats).length > 0}
          learnedWordsCount={availableWords.length}
        />
      ) : isQuizComplete ? (
        <QuizComplete
          results={quizResults}
          totalScore={sessionScore}
          highScore={progress.highScore}
          onPlayAgain={() => {
            setQuizStarted(false);
          }}
        />
      ) : (
        <div>
          {/* Session progress */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#888' }}>
                Question {currentIndex + 1} of {quizWords.length}
              </span>
              <span style={{ color: '#4a9eff', fontWeight: 'bold' }}>
                Score: {sessionScore}
              </span>
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
                  width: `${((currentIndex) / quizWords.length) * 100}%`,
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
                  wordStats={progress.wordStats[currentWord.word]}
                  onComplete={handleWordComplete}
                />
              )}
            </div>

            {/* Upcoming words preview */}
            <div
              style={{
                width: '200px',
                backgroundColor: '#121212',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ color: '#888', marginBottom: '12px', fontSize: '0.875rem' }}>
                Coming Up:
              </div>
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
                      <div style={{ color: '#666', fontSize: '0.75rem' }}>
                        Rank #{word.rank}
                      </div>
                    )}
                  </div>
                ))}
                {upcomingWords.length === 0 && (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>
                    Last question!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        <div style={{ color: canStartQuiz ? '#2ecc71' : '#e74c3c', fontWeight: 'bold', marginBottom: '4px' }}>
          {canStartQuiz ? `${learnedWordsCount} words available for quiz` : 'No words learned yet'}
        </div>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>
          {canStartQuiz
            ? 'Quiz will test you on words you\'ve learned in Practice mode.'
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
          Number of words: {learnedWordsCount > 0 && quizSize > learnedWordsCount && (
            <span style={{ color: '#f1c40f' }}>(max {learnedWordsCount} available)</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[5, 10, 20, 30, 50].map((size) => {
            const isAvailable = size <= learnedWordsCount;
            const isSelected = quizSize === size || (quizSize > learnedWordsCount && size === Math.max(...[5, 10, 20, 30, 50].filter(s => s <= learnedWordsCount)));
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
    // Clear any pending timeouts
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
          // Time's up!
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
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

    // Check for chord completion when input ends with space (same as PracticeMode)
    if (newValue.endsWith(' ')) {
      // Guard against processing if already transitioning
      if (isTransitioningRef.current) {
        return;
      }

      const typedWord = newValue.trim();
      const isCorrectWord = typedWord === word.word.toLowerCase();

      if (isCorrectWord) {
        // Correct word with trailing space = success!
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
        // Wrong word
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setLastResult('wrong');

        if (newAttempts >= settings.maxAttempts) {
          // Out of attempts
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
          // Clear for next attempt
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
      // Wrong answer
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setTypedText('');
      setLastResult('wrong');

      if (newAttempts >= settings.maxAttempts) {
        // Out of attempts
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
        // Clear wrong indicator after a moment
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

  // Click handler to refocus hidden input
  const handleContainerClick = () => {
    if (!isComplete) {
      inputRef.current?.focus();
    }
  };

  const timerColor =
    timeLeft > 10 ? '#2ecc71' : timeLeft > 5 ? '#f1c40f' : '#e74c3c';

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
        <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '8px' }}>
          {word.word}
        </h1>
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

        {/* Word difficulty indicator based on past performance */}
        {wordStats && (
          <div style={{ marginTop: '8px', color: '#888', fontSize: '0.875rem' }}>
            Your accuracy: {Math.round((wordStats.correct / Math.max(1, wordStats.correct + wordStats.failed)) * 100)}%
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
          {/* Hidden input to capture CharaChorder output */}
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

          {/* Chord keys with directions - same as learning/practice mode */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: '#888', marginBottom: '12px' }}>Chord Keys:</div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {primaryChord
                .split('')
                .filter(c => c.match(/[a-z]/i))
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
                      <span style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: color,
                        textTransform: 'uppercase'
                      }}>
                        {char}
                      </span>
                      <span style={{
                        fontSize: '1.5rem',
                        color: '#fff',
                        marginTop: '4px'
                      }}>
                        {getDirectionSymbol(direction)}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#888',
                        marginTop: '4px',
                        textAlign: 'center'
                      }}>
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
      ? Math.round(results.reduce((sum, r) => sum + r.timeMs, 0) / results.length / 1000 * 10) / 10
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

      <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '8px' }}>
        Quiz Complete!
      </h2>

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
        <div
          style={{
            backgroundColor: '#222',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '2rem', color: '#4a9eff', fontWeight: 'bold' }}>
            {totalScore}
          </div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Total Score</div>
        </div>
        <div
          style={{
            backgroundColor: '#222',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '2rem', color: '#2ecc71', fontWeight: 'bold' }}>
            {accuracy}%
          </div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Accuracy</div>
        </div>
        <div
          style={{
            backgroundColor: '#222',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '2rem', color: '#f1c40f', fontWeight: 'bold' }}>
            {correctCount}/{results.length}
          </div>
          <div style={{ color: '#888', fontSize: '0.875rem' }}>Correct</div>
        </div>
        <div
          style={{
            backgroundColor: '#222',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '2rem', color: '#9b59b6', fontWeight: 'bold' }}>
            {avgTime}s
          </div>
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

function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '#2ecc71';
    case 'medium':
      return '#f1c40f';
    case 'hard':
      return '#e67e22';
    case 'expert':
      return '#e74c3c';
  }
}

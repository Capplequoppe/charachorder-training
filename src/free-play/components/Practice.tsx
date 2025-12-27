import { useState, useEffect, useCallback, useRef } from 'react';
import { getWordsByRank } from '@/data/chords';
import type { WordEntry } from '@/data/types';
import { ColoredChord } from '@/components/ColoredLetter';
import { FingerIndicator, HandVisualization } from '@/components/FingerIndicator';
import { useAudio } from '@/hooks/useAudio';
import { getFingersForChord, Finger, getFingerForChar, FINGER_NOTES, getDirectionForChar, getDirectionSymbol, getColorForChar, FINGER_NAMES, FINGERS_IN_ORDER } from '@/config/fingerMapping';
import { Finger as FingerEntity } from '@/domain';
import { ContinueButton } from '@/components/campaign/ContinueButton';
import { getPracticeProgressService, type PracticeProgress } from '@/services';

const WORDS_PER_SESSION = 5;

type PracticeMode = 'intro' | 'practice' | 'review' | 'complete';

interface PracticeProps {
  /** Whether this is being used in campaign mode */
  inCampaignMode?: boolean;
  /** Callback when user clicks continue to next chapter (campaign mode) */
  onChapterComplete?: () => void;
  /** Whether user is revisiting a completed chapter */
  isRevisiting?: boolean;
}

export function Practice({
  inCampaignMode = false,
  onChapterComplete,
  isRevisiting = false,
}: PracticeProps = {}) {
  const progressService = getPracticeProgressService();
  const [progress, setProgress] = useState<PracticeProgress>(() => progressService.loadProgress());
  const [mode, setMode] = useState<PracticeMode>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const [sessionWords, setSessionWords] = useState<WordEntry[]>([]);
  const [batchSize, setBatchSize] = useState(WORDS_PER_SESSION);
  const { playChordFromString } = useAudio();

  // Refs to track current values for use in callbacks (avoids stale closures)
  const currentWordIndexRef = useRef(currentWordIndex);
  const sessionWordsRef = useRef(sessionWords);
  const modeRef = useRef(mode);
  const transitionInProgressRef = useRef(false); // Global transition guard

  // Keep refs in sync with state
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    sessionWordsRef.current = sessionWords;
  }, [sessionWords]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const allWords = getWordsByRank();

  // Get next batch of words to learn
  const getNextBatch = useCallback(() => {
    const learned = new Set(progress.learnedWords);
    const nextWords: WordEntry[] = [];

    for (const word of allWords) {
      if (!learned.has(word.word) && nextWords.length < batchSize) {
        nextWords.push(word);
      }
    }

    return nextWords;
  }, [allWords, progress.learnedWords, batchSize]);

  // Track if session has been initialized to prevent re-initialization
  const sessionInitializedRef = useRef(false);

  // Initialize session
  useEffect(() => {
    if (mode === 'intro' && sessionWords.length === 0 && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      const batch = getNextBatch();
      setSessionWords(batch);
    }
  }, [mode, sessionWords.length, getNextBatch]);

  const currentWord = sessionWords[currentWordIndex];

  const handleStartSession = () => {
    sessionInitializedRef.current = true;
    const batch = getNextBatch();
    setSessionWords(batch);
    setCurrentWordIndex(0);
    setMode('intro');
    setShowChords(true);
  };

  const handleNextWord = useCallback(() => {
    const currentMode = modeRef.current;
    const currentIdx = currentWordIndexRef.current;
    const words = sessionWordsRef.current;

    // Safety check: only proceed if we're in intro mode
    if (currentMode !== 'intro') {
      return;
    }

    if (currentIdx < words.length - 1) {
      setCurrentWordIndex(currentIdx + 1);
      setShowChords(true);
    } else {
      // Move to practice mode
      setMode('practice');
      setCurrentWordIndex(0);
      setShowChords(false);
    }
  }, []);

  const handlePreviousWord = useCallback(() => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1);
      setShowChords(true);
    }
  }, [currentWordIndex]);

  const handlePracticeNext = useCallback(() => {
    // Global guard against duplicate transitions
    if (transitionInProgressRef.current) {
      return;
    }

    const currentMode = modeRef.current;
    const words = sessionWordsRef.current;

    // Safety check: only proceed if we're in practice mode
    if (currentMode !== 'practice') {
      return;
    }

    // Set global transition guard
    transitionInProgressRef.current = true;

    // Use functional state update to ensure we're working with latest state
    setCurrentWordIndex(prevIndex => {
      if (prevIndex < words.length - 1) {
        const nextIdx = prevIndex + 1;
        currentWordIndexRef.current = nextIdx;

        // Clear transition guard after state update is processed
        setTimeout(() => {
          transitionInProgressRef.current = false;
        }, 100);

        return nextIdx;
      } else {
        // Schedule completion for after render
        setTimeout(() => {
          const newProgress = {
            ...progress,
            learnedWords: [
              ...progress.learnedWords,
              ...words.map((w) => w.word),
            ],
          };
          setProgress(newProgress);
          progressService.saveProgress(newProgress);
          setMode('complete');
          transitionInProgressRef.current = false;
        }, 0);

        return prevIndex;
      }
    });

    setShowChords(false);
  }, [progress, progressService]);

  const handleRevealChord = () => {
    setShowChords(true);
    if (currentWord) {
      playChordFromString(currentWord.chords[0]);
    }
  };

  const handlePlayChord = (chord: string) => {
    playChordFromString(chord);
  };

  const handleResetProgress = () => {
    const newProgress = { learnedWords: [], currentSession: [], masteredWords: {} };
    setProgress(newProgress);
    progressService.saveProgress(newProgress);
    setSessionWords([]);
    setMode('intro');
    setCurrentWordIndex(0);
    sessionInitializedRef.current = false;
    transitionInProgressRef.current = false;
  };

  // Stats
  const totalWords = allWords.length;
  const learnedCount = progress.learnedWords.length;
  const remainingCount = totalWords - learnedCount;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Practice Chords</h2>

      {/* Progress bar */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#888' }}>Progress</span>
          <span style={{ color: '#888' }}>
            {learnedCount} / {totalWords} words learned
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
              width: `${(learnedCount / totalWords) * 100}%`,
              height: '100%',
              backgroundColor: '#2ecc71',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Batch size selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#888', marginRight: '10px' }}>
          Words per session:
        </label>
        <select
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '4px',
          }}
        >
          {[3, 5, 10, 15, 20].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Main content based on mode */}
      {mode === 'intro' && currentWord && (
        <IntroMode
          word={currentWord}
          wordIndex={currentWordIndex}
          totalWords={sessionWords.length}
          onNext={handleNextWord}
          onPrevious={handlePreviousWord}
          onPlayChord={handlePlayChord}
        />
      )}

      {mode === 'practice' && currentWord && (
        <PracticeMode
          word={currentWord}
          wordIndex={currentWordIndex}
          totalWords={sessionWords.length}
          showChords={showChords}
          onReveal={handleRevealChord}
          onNext={handlePracticeNext}
          onPlayChord={handlePlayChord}
        />
      )}

      {mode === 'complete' && (
        <CompleteMode
          wordsLearned={sessionWords.length}
          totalLearned={learnedCount}
          remaining={remainingCount}
          onStartNew={handleStartSession}
          onReset={handleResetProgress}
          inCampaignMode={inCampaignMode}
          onChapterComplete={onChapterComplete}
          isRevisiting={isRevisiting}
        />
      )}

      {/* Start new session button (when not in intro) */}
      {sessionWords.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          {remainingCount > 0 ? (
            <>
              <p style={{ color: '#888', marginBottom: '20px' }}>
                Ready to learn {Math.min(batchSize, remainingCount)} new words?
              </p>
              <button
                onClick={handleStartSession}
                style={{
                  padding: '16px 32px',
                  fontSize: '1.25rem',
                  backgroundColor: '#4a9eff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Start Learning Session
              </button>
            </>
          ) : (
            <div>
              <p style={{ color: '#2ecc71', fontSize: '1.5rem', marginBottom: '20px' }}>
                Congratulations! You've learned all available chords!
              </p>
              <button
                onClick={handleResetProgress}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reset Progress and Start Over
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reset button */}
      {learnedCount > 0 && mode !== 'complete' && (
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button
            onClick={handleResetProgress}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Reset All Progress
          </button>
        </div>
      )}
    </div>
  );
}

interface IntroModeProps {
  word: WordEntry;
  wordIndex: number;
  totalWords: number;
  onNext: () => void;
  onPrevious: () => void;
  onPlayChord: (chord: string) => void;
}

const ENCOURAGING_MESSAGES = [
  'Good!',
  'Excellent!',
  'Nice!',
  'Great job!',
  'Perfect!',
  'Well done!',
  'Awesome!',
  'Fantastic!',
];

function IntroMode({ word, wordIndex, totalWords, onNext, onPrevious, onPlayChord }: IntroModeProps) {
  const primaryChord = word.chords[0];
  const fingers = getFingersForChord(primaryChord);
  const leftFingers = fingers.filter((f) => FingerEntity.isLeftHandId(f));
  const rightFingers = fingers.filter((f) => FingerEntity.isRightHandId(f));

  const [typedChars, setTypedChars] = useState<Set<string>>(new Set());
  const [pressedFingers, setPressedFingers] = useState<Finger[]>([]);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const { playFingerNote, SUCCESS_DURATION, DEFAULT_DURATION } = useAudio();

  // Refs to track state without causing re-renders or stale closures
  const typedCharsRef = useRef<Set<string>>(new Set());
  const clearTimeoutRef = useRef<number | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const spaceTimeoutRef = useRef<number | null>(null);
  const cooldownRef = useRef<boolean>(false); // Prevents counting during CharaChorder output
  const waitingForSpaceRef = useRef<boolean>(false); // Waiting for trailing space to confirm chord

  // Required characters for the chord (unique, lowercase)
  const requiredCharsArray = Array.from(new Set(primaryChord.toLowerCase().split('').filter(c => c.match(/[a-z]/))));
  const requiredCharsCount = requiredCharsArray.length;

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      onPlayChord(primaryChord);
    }, 300);
    return () => clearTimeout(timer);
  }, [primaryChord, onPlayChord]);

  // Reset state when word changes
  useEffect(() => {
    setTypedChars(new Set());
    typedCharsRef.current = new Set();
    setPressedFingers([]);
    setEncouragement(null);
    setSuccessCount(0);
    cooldownRef.current = false;
    waitingForSpaceRef.current = false;
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (spaceTimeoutRef.current) {
      clearTimeout(spaceTimeoutRef.current);
      spaceTimeoutRef.current = null;
    }
  }, [word.word]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (spaceTimeoutRef.current) clearTimeout(spaceTimeoutRef.current);
    };
  }, []);

  // Handle keyboard input for practice
  useEffect(() => {
    const requiredChars = new Set(requiredCharsArray);

    const triggerSuccess = () => {
      // Success! Show encouragement
      const message = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
      setEncouragement(message);
      setSuccessCount(c => c + 1);

      // Enter cooldown to ignore remaining CharaChorder output
      cooldownRef.current = true;
      waitingForSpaceRef.current = false;

      // Clear space timeout if pending
      if (spaceTimeoutRef.current) {
        clearTimeout(spaceTimeoutRef.current);
        spaceTimeoutRef.current = null;
      }

      // Reset after showing success (and end cooldown)
      successTimeoutRef.current = window.setTimeout(() => {
        typedCharsRef.current = new Set();
        setTypedChars(new Set());
        setEncouragement(null);
        cooldownRef.current = false;
        successTimeoutRef.current = null;
      }, 1500);
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore input during cooldown (CharaChorder is outputting the word)
      if (cooldownRef.current) {
        return;
      }

      const char = event.key.toLowerCase();

      // Check for trailing space when we're waiting for it
      if (waitingForSpaceRef.current && (event.key === ' ' || char === ' ')) {
        triggerSuccess();
        return;
      }

      const finger = getFingerForChar(char);

      if (finger && requiredChars.has(char)) {
        // Clear any pending auto-clear timeout since we got new input
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
          clearTimeoutRef.current = null;
        }

        // Add to typed chars using ref for accurate tracking
        typedCharsRef.current.add(char);
        const newSet = new Set(typedCharsRef.current);
        setTypedChars(newSet);

        // Check if this completes the chord (all required chars present)
        const hasAllChars = typedCharsRef.current.size === requiredCharsCount;

        // Play the note - longer duration when all chars are present
        playFingerNote(finger, hasAllChars ? SUCCESS_DURATION : DEFAULT_DURATION);

        // Add to pressed fingers for animation
        setPressedFingers(prev => [...prev, finger]);
        setTimeout(() => {
          setPressedFingers(prev => prev.filter(f => f !== finger));
        }, 300);

        // Check if all required chars have been typed
        if (hasAllChars) {
          // All chars typed - now wait for trailing space to confirm it's a chord
          waitingForSpaceRef.current = true;

          // Set timeout - if space doesn't arrive within 100ms, it's not a chord
          spaceTimeoutRef.current = window.setTimeout(() => {
            // No trailing space - reset without counting as success
            waitingForSpaceRef.current = false;
            typedCharsRef.current = new Set();
            setTypedChars(new Set());
            spaceTimeoutRef.current = null;
          }, 100);
        } else {
          // Set auto-clear timeout (300ms) - chord must be pressed together
          clearTimeoutRef.current = window.setTimeout(() => {
            typedCharsRef.current = new Set();
            setTypedChars(new Set());
            waitingForSpaceRef.current = false;
            clearTimeoutRef.current = null;
          }, 300);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [requiredCharsArray.join(','), requiredCharsCount, playFingerNote, onPlayChord, primaryChord]);

  // Handle Enter/Arrow keys for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'ArrowRight') {
        onNext();
      } else if (event.key === 'ArrowLeft' && wordIndex > 0) {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, onPrevious, wordIndex]);

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
          @keyframes encouragementPop {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>

      <div style={{ color: '#888', marginBottom: '8px' }}>
        New Word {wordIndex + 1} of {totalWords}
      </div>

      {/* Word display */}
      <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '8px' }}>
        {word.word}
      </h1>

      {/* Rank badge */}
      {word.rank && (
        <div
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor:
              word.rank <= 50 ? '#2ecc71' : word.rank <= 100 ? '#f1c40f' : '#666',
            color: word.rank <= 100 ? '#000' : '#fff',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '24px',
          }}
        >
          Frequency Rank: #{word.rank}
        </div>
      )}

      {/* Primary chord with directions - sorted by finger position (left to right) */}
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

      {/* Encouragement message */}
      {encouragement && (
        <div
          style={{
            fontSize: '2rem',
            color: '#2ecc71',
            fontWeight: 'bold',
            marginBottom: '16px',
            animation: 'encouragementPop 0.3s ease-out',
          }}
        >
          {encouragement}
        </div>
      )}

      {/* Success counter */}
      {successCount > 0 && (
        <div style={{ color: '#2ecc71', fontSize: '1rem', marginBottom: '16px' }}>
          Practiced {successCount} time{successCount > 1 ? 's' : ''}!
        </div>
      )}

      {/* Hand visualizations */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          marginBottom: '24px',
        }}
      >
        <HandVisualization
          activeFingers={leftFingers as Finger[]}
          pressedFingers={pressedFingers}
          hand="left"
        />
        <HandVisualization
          activeFingers={rightFingers as Finger[]}
          pressedFingers={pressedFingers}
          hand="right"
        />
      </div>

      {/* Finger indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <FingerIndicator
          activeFingers={fingers}
          pressedFingers={pressedFingers}
          size="large"
        />
      </div>

      {/* Play button */}
      <button
        onClick={() => onPlayChord(primaryChord)}
        style={{
          padding: '12px 32px',
          fontSize: '1.25rem',
          backgroundColor: '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '0 auto 16px',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>♪</span> Play Chord Sound
      </button>

      {/* Alternative chords */}
      {word.chords.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: '#666', marginBottom: '8px', fontSize: '0.875rem' }}>
            Alternative chords:
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {word.chords.slice(1).map((chord, index) => (
              <button
                key={index}
                onClick={() => onPlayChord(chord)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ColoredChord chord={chord} size="small" />
                <span style={{ color: '#888' }}>♪</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        style={{
          padding: '16px 48px',
          fontSize: '1.125rem',
          backgroundColor: '#2ecc71',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {wordIndex < totalWords - 1 ? 'Next Word →' : 'Start Practice →'}
      </button>
    </div>
  );
}

interface PracticeModeProps {
  word: WordEntry;
  wordIndex: number;
  totalWords: number;
  showChords: boolean;
  onReveal: () => void;
  onNext: () => void;
  onPlayChord: (chord: string) => void;
}

function PracticeMode({
  word,
  wordIndex,
  totalWords,
  showChords,
  onReveal,
  onNext,
  onPlayChord,
}: PracticeModeProps) {
  const primaryChord = word.chords[0];
  const fingers = getFingersForChord(primaryChord);
  const leftFingers = fingers.filter((f) => FingerEntity.isLeftHandId(f));
  const rightFingers = fingers.filter((f) => FingerEntity.isRightHandId(f));
  const [typedText, setTypedText] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false); // Guard against double-triggers
  const { playFingerNote, SUCCESS_DURATION, DEFAULT_DURATION } = useAudio();

  // Store latest onNext in a ref to avoid stale closure issues
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Reset state when word changes and focus input
  useEffect(() => {
    setTypedText('');
    setIsCorrect(null);
    isTransitioningRef.current = false; // Reset transition guard
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, [word.word]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  // Always focus input when not showing chords (practice mode)
  useEffect(() => {
    if (!showChords && !isCorrect) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showChords, isCorrect, word.word]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase();
    const prevLength = typedText.length;

    // Play note for new characters
    if (newValue.length > prevLength) {
      const newChar = newValue.at(-1);
      if (newChar) {
        const finger = getFingerForChar(newChar);
        if (finger) {
          const isLastCharOfWord = newValue.trim() === word.word.toLowerCase();
          playFingerNote(finger, isLastCharOfWord ? SUCCESS_DURATION : DEFAULT_DURATION);
        }
      }
    }

    setTypedText(newValue);

    // Clear any existing timeouts
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    // Check for chord completion when input ends with space (same as IntroMode)
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
        setIsCorrect(true);
        setTimeout(() => {
          onNextRef.current();
        }, 600);
      } else {
        // Wrong word
        setIsCorrect(false);
        clearTimeoutRef.current = globalThis.setTimeout(() => {
          setTypedText('');
          setIsCorrect(null);
          clearTimeoutRef.current = null;
        }, 800);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only allow Enter to continue after revealing chord or successful completion
    // Also check transition guard to prevent double-triggers
    if (e.key === 'Enter' && (showChords || isCorrect) && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      onNext();
    }
  };

  // Click handler to refocus hidden input
  const handleContainerClick = () => {
    if (!showChords && !isCorrect) {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      style={{
        backgroundColor: '#121212',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        cursor: !showChords && !isCorrect ? 'text' : 'default',
      }}
    >
      <div style={{ color: '#888', marginBottom: '8px' }}>
        Practice {wordIndex + 1} of {totalWords}
      </div>

      {/* Word display */}
      <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '8px' }}>
        {word.word}
      </h1>

      {/* Rank badge */}
      {word.rank && (
        <div
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor:
              word.rank <= 50 ? '#2ecc71' : word.rank <= 100 ? '#f1c40f' : '#666',
            color: word.rank <= 100 ? '#000' : '#fff',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '24px',
          }}
        >
          Frequency Rank: #{word.rank}
        </div>
      )}

      {!showChords && !isCorrect && (
        <>
          {/* Hidden input to capture CharaChorder output */}
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              position: 'absolute',
              left: '-9999px',
              opacity: 0,
            }}
          />

          {/* Chord keys with directions - same as intro mode */}
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

          {/* Hand visualizations */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '24px',
            }}
          >
            <HandVisualization activeFingers={leftFingers as Finger[]} hand="left" />
            <HandVisualization activeFingers={rightFingers as Finger[]} hand="right" />
          </div>

          {/* Finger indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <FingerIndicator activeFingers={fingers} size="large" />
          </div>

          {/* Feedback message */}
          {isCorrect === false && (
            <div style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '1.1rem' }}>
              Not quite right. Try again.
            </div>
          )}

          {/* Reveal button */}
          <button
            onClick={onReveal}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#f1c40f',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reveal Chord
          </button>
        </>
      )}

      {(showChords || isCorrect) && (
        <>
          {/* Success message */}
          {isCorrect && (
            <div
              style={{
                fontSize: '1.5rem',
                color: '#2ecc71',
                marginBottom: '16px',
                fontWeight: 'bold',
              }}
            >
              ✓ Correct!
            </div>
          )}

          {/* Show chord */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: '#888', marginBottom: '8px' }}>Chord:</div>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
              <ColoredChord chord={primaryChord} size="large" />
            </div>
          </div>

          {/* Hand visualizations */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '24px',
            }}
          >
            <HandVisualization activeFingers={leftFingers as Finger[]} hand="left" />
            <HandVisualization activeFingers={rightFingers as Finger[]} hand="right" />
          </div>

          {/* Finger indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <FingerIndicator activeFingers={fingers} size="large" />
          </div>

          {/* Play button */}
          <button
            onClick={() => onPlayChord(primaryChord)}
            style={{
              padding: '12px 32px',
              fontSize: '1.125rem',
              backgroundColor: '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '24px',
            }}
          >
            ♪ Play Sound
          </button>

          {/* Next button */}
          <div>
            <button
              onClick={onNext}
              style={{
                padding: '16px 48px',
                fontSize: '1.125rem',
                backgroundColor: '#2ecc71',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {wordIndex < totalWords - 1 ? 'Next Word →' : 'Complete Session →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface CompleteModeProps {
  wordsLearned: number;
  totalLearned: number;
  remaining: number;
  onStartNew: () => void;
  onReset: () => void;
  inCampaignMode?: boolean;
  onChapterComplete?: () => void;
  isRevisiting?: boolean;
}

function CompleteMode({
  wordsLearned,
  totalLearned,
  remaining,
  onStartNew,
  onReset,
  inCampaignMode = false,
  onChapterComplete,
  isRevisiting = false,
}: CompleteModeProps) {
  return (
    <div
      style={{
        backgroundColor: '#121212',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ color: '#2ecc71', fontSize: '2rem', marginBottom: '16px' }}>
        Session Complete!
      </h2>

      <p style={{ color: '#888', marginBottom: '24px' }}>
        You've practiced {wordsLearned} words in this session.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          marginBottom: '32px',
        }}
      >
        <div>
          <div style={{ fontSize: '2.5rem', color: '#2ecc71', fontWeight: 'bold' }}>
            {totalLearned}
          </div>
          <div style={{ color: '#888' }}>Words Learned</div>
        </div>
        <div>
          <div style={{ fontSize: '2.5rem', color: '#f1c40f', fontWeight: 'bold' }}>
            {remaining}
          </div>
          <div style={{ color: '#888' }}>Remaining</div>
        </div>
      </div>

      {inCampaignMode && onChapterComplete && !isRevisiting ? (
        <ContinueButton
          onContinue={onChapterComplete}
          message="You've mastered word chords!"
          buttonText="Complete Campaign"
          isFinalChapter={true}
          unlocksFeatures={['Songs', 'Categories']}
        />
      ) : (
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {remaining > 0 && (
            <button
              onClick={onStartNew}
              style={{
                padding: '16px 32px',
                fontSize: '1.125rem',
                backgroundColor: '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Learn More Words
            </button>
          )}

          <button
            onClick={onReset}
            style={{
              padding: '16px 32px',
              fontSize: '1.125rem',
              backgroundColor: 'transparent',
              color: '#888',
              border: '1px solid #444',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Reset Progress
          </button>
        </div>
      )}
    </div>
  );
}

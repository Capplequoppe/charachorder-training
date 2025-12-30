/**
 * Power Chord Learning Component
 *
 * Structured learning for 2-key power chords. This comes after character learning
 * and before word learning in the progression:
 *
 * Characters -> Power Chords -> Words
 *
 * Features:
 * - Browse power chords by hand (left, right, cross-hand)
 * - See which words each power chord enables
 * - Practice individual power chords with immediate feedback
 * - Supports both raw key detection and CharaChorder chorded output
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getRepositories } from '../../../data';
import { PowerChord, FingerId, Finger } from '../../../domain';
import { CHORD_MAX_DURATION_MS } from '../../../services';
import { useAudio } from '../../../hooks/useAudio';
import { ColoredFinger } from '../../ui/atoms/ColoredFinger';
import { SurvivalGame, SurvivalItemType } from '../training/SurvivalGame';
import './PowerChordLearning.css';

type HandFilter = 'all' | 'left' | 'right' | 'cross';
type ViewMode = 'browse' | 'practice' | 'survival';

interface PowerChordProgress {
  id: string;
  attempts: number;
  successes: number;
  lastPracticed: number | null;
}

// Storage key for power chord progress
const STORAGE_KEY = 'charachorder-powerchord-progress';

function loadProgress(): Record<string, PowerChordProgress> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, PowerChordProgress>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function PowerChordLearning() {
  const { playPowerChordNote, playFingerNote, playChordNotes } = useAudio();

  // Get all power chords from repository
  const allPowerChords = useMemo(() => {
    const { powerChords } = getRepositories();
    return powerChords.getAll();
  }, []);

  // State
  const [handFilter, setHandFilter] = useState<HandFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedChord, setSelectedChord] = useState<PowerChord | null>(null);
  const [practiceQueue, setPracticeQueue] = useState<PowerChord[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, PowerChordProgress>>(loadProgress);

  // Practice state
  const [textInput, setTextInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [practiceSuccesses, setPracticeSuccesses] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Survival mode state
  const [survivalItemType, setSurvivalItemType] = useState<SurvivalItemType>('all-power-chords');
  const charTimestamps = useRef<number[]>([]);
  const lastProcessedInput = useRef<string>('');
  const practiceStartTime = useRef<number>(Date.now());

  // Filter power chords by hand
  const filteredChords = useMemo(() => {
    if (handFilter === 'all') return allPowerChords;
    return allPowerChords.filter((pc) => pc.hand === handFilter);
  }, [allPowerChords, handFilter]);

  // Group by hand for display
  const chordsByHand = useMemo(() => {
    return {
      left: allPowerChords.filter((pc) => pc.hand === 'left'),
      right: allPowerChords.filter((pc) => pc.hand === 'right'),
      cross: allPowerChords.filter((pc) => pc.hand === 'cross'),
    };
  }, [allPowerChords]);

  // Current practice chord
  const currentPracticeChord = practiceQueue[currentPracticeIndex] || null;

  // Expected characters and valid words for current practice chord
  const expectedChars = useMemo(() => {
    if (!currentPracticeChord) return new Set<string>();
    return new Set([
      currentPracticeChord.characters[0].char.toLowerCase(),
      currentPracticeChord.characters[1].char.toLowerCase(),
    ]);
  }, [currentPracticeChord]);

  const validChordedWords = useMemo(() => {
    if (!currentPracticeChord) return new Set<string>();
    return new Set(currentPracticeChord.producesWords.map((w) => w.toLowerCase()));
  }, [currentPracticeChord]);

  // Play power chord sound
  const playChordSound = useCallback(
    (chord: PowerChord) => {
      const [freq1, freq2] = chord.noteFrequencies;
      if (freq1 > 0) playPowerChordNote(freq1, 0.5);
      setTimeout(() => {
        if (freq2 > 0) playPowerChordNote(freq2, 0.5);
      }, 50);
    },
    [playPowerChordNote]
  );

  // Start practice mode for selected chord(s)
  const startPractice = useCallback((chords: PowerChord[]) => {
    setPracticeQueue(chords);
    setCurrentPracticeIndex(0);
    setPracticeSuccesses(0);
    setViewMode('practice');
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';
    practiceStartTime.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle correct power chord execution
  const handleCorrect = useCallback(() => {
    if (!currentPracticeChord) return;

    setFeedback('correct');
    playChordSound(currentPracticeChord);

    const newSuccesses = practiceSuccesses + 1;
    setPracticeSuccesses(newSuccesses);

    // Update progress
    setProgress((prev) => {
      const chordProgress = prev[currentPracticeChord.id] || {
        id: currentPracticeChord.id,
        attempts: 0,
        successes: 0,
        lastPracticed: null,
      };

      const updated = {
        ...prev,
        [currentPracticeChord.id]: {
          ...chordProgress,
          attempts: chordProgress.attempts + 1,
          successes: chordProgress.successes + 1,
          lastPracticed: Date.now(),
        },
      };

      saveProgress(updated);
      return updated;
    });

    // Clear input
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';

    // Check if done with this chord (5 successes)
    if (newSuccesses >= 5) {
      setTimeout(() => {
        if (currentPracticeIndex < practiceQueue.length - 1) {
          setCurrentPracticeIndex((i) => i + 1);
          setPracticeSuccesses(0);
          setFeedback(null);
          practiceStartTime.current = Date.now();
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
          // Done with all chords - reset all practice state
          setViewMode('browse');
          setSelectedChord(null);
          setPracticeQueue([]);
          setCurrentPracticeIndex(0);
          setPracticeSuccesses(0);
          setFeedback(null);
        }
      }, 500);
    } else {
      setTimeout(() => setFeedback(null), 300);
    }
  }, [currentPracticeChord, practiceSuccesses, practiceQueue.length, currentPracticeIndex, playChordSound]);

  // Handle incorrect input
  const handleIncorrect = useCallback(() => {
    if (!currentPracticeChord) return;

    setFeedback('incorrect');

    // Update progress
    setProgress((prev) => {
      const chordProgress = prev[currentPracticeChord.id] || {
        id: currentPracticeChord.id,
        attempts: 0,
        successes: 0,
        lastPracticed: null,
      };

      const updated = {
        ...prev,
        [currentPracticeChord.id]: {
          ...chordProgress,
          attempts: chordProgress.attempts + 1,
          lastPracticed: Date.now(),
        },
      };

      saveProgress(updated);
      return updated;
    });

    // Clear input
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';

    setTimeout(() => setFeedback(null), 300);
  }, [currentPracticeChord]);

  // Handle text input change (for CharaChorder detection)
  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (viewMode !== 'practice' || !currentPracticeChord) return;

      const newValue = e.target.value;
      const now = Date.now();

      // Track timestamps
      if (newValue.length > textInput.length) {
        const addedCount = newValue.length - textInput.length;
        for (let i = 0; i < addedCount; i++) {
          charTimestamps.current.push(now);
        }
      } else if (newValue.length < textInput.length) {
        charTimestamps.current = charTimestamps.current.slice(0, newValue.length);
      }

      setTextInput(newValue);

      // Check on space (completion signal)
      if (newValue.endsWith(' ')) {
        const word = newValue.trim().toLowerCase();

        if (word === lastProcessedInput.current) return;
        lastProcessedInput.current = word;

        // Calculate duration
        let durationMs = 0;
        const timestamps = charTimestamps.current;
        if (timestamps.length >= 2) {
          durationMs = timestamps[timestamps.length - 1] - timestamps[0];
        }

        // Check if valid
        const rawCharsMatch =
          word.length === 2 && [...expectedChars].every((c) => word.includes(c));
        const chordedWordMatch = validChordedWords.has(word);
        const isChordTiming = durationMs <= CHORD_MAX_DURATION_MS * 2 || word.length <= 2;

        if ((rawCharsMatch || chordedWordMatch) && isChordTiming) {
          handleCorrect();
        } else if (word.length > 0) {
          handleIncorrect();
        }
      }
    },
    [
      viewMode,
      currentPracticeChord,
      textInput,
      expectedChars,
      validChordedWords,
      handleCorrect,
      handleIncorrect,
    ]
  );

  // Auto-switch to browse mode if in practice mode with no chord
  useEffect(() => {
    if (viewMode === 'practice' && !currentPracticeChord) {
      setViewMode('browse');
      setPracticeQueue([]);
      setCurrentPracticeIndex(0);
      setPracticeSuccesses(0);
      setFeedback(null);
    }
  }, [viewMode, currentPracticeChord]);

  // Handle keyboard for simultaneous press detection
  useEffect(() => {
    if (viewMode !== 'practice' || !currentPracticeChord) return;

    const pressedKeys = new Set<string>();
    let lastPressTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const now = Date.now();

      // Only track expected characters
      if (expectedChars.has(key)) {
        pressedKeys.add(key);
        lastPressTime = now;

        // Check if both expected keys are pressed within threshold
        if (pressedKeys.size === 2 && [...expectedChars].every((c) => pressedKeys.has(c))) {
          handleCorrect();
          pressedKeys.clear();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewMode, currentPracticeChord, expectedChars, handleCorrect]);

  // Get mastery level for a chord
  const getMasteryLevel = (chordId: string): 'new' | 'learning' | 'familiar' | 'mastered' => {
    const p = progress[chordId];
    if (!p || p.attempts === 0) return 'new';
    const accuracy = p.successes / p.attempts;
    if (accuracy >= 0.9 && p.successes >= 10) return 'mastered';
    if (accuracy >= 0.7 && p.successes >= 5) return 'familiar';
    return 'learning';
  };

  // Render power chord card
  const renderChordCard = (chord: PowerChord) => {
    const mastery = getMasteryLevel(chord.id);
    const chordProgress = progress[chord.id];
    const char1 = chord.characters[0];
    const char2 = chord.characters[1];

    return (
      <div
        key={chord.id}
        className={`power-chord-card ${mastery} ${selectedChord?.id === chord.id ? 'selected' : ''}`}
        onClick={() => setSelectedChord(chord)}
      >
        <div className="chord-chars">
          <span className="chord-char" style={{ color: char1.color }}>
            {char1.displayChar}
          </span>
          <span className="chord-plus">+</span>
          <span className="chord-char" style={{ color: char2.color }}>
            {char2.displayChar}
          </span>
        </div>

        <div className="chord-color-bar" style={{ backgroundColor: chord.blendedColor }} />

        <div className="chord-meta">
          <span className="chord-rank">#{chord.frequencyRank}</span>
          <span className={`mastery-badge ${mastery}`}>
            {mastery === 'new' && 'New'}
            {mastery === 'learning' && 'Learning'}
            {mastery === 'familiar' && 'Familiar'}
            {mastery === 'mastered' && 'Mastered'}
          </span>
        </div>

        {chordProgress && chordProgress.attempts > 0 && (
          <div className="chord-stats">
            {Math.round((chordProgress.successes / chordProgress.attempts) * 100)}% accuracy
          </div>
        )}
      </div>
    );
  };

  // Render browse mode
  const renderBrowseMode = () => (
    <div className="power-chord-browse">
      {/* Filter tabs */}
      <div className="hand-filter-tabs">
        <button
          className={`filter-tab ${handFilter === 'all' ? 'active' : ''}`}
          onClick={() => setHandFilter('all')}
        >
          All ({allPowerChords.length})
        </button>
        <button
          className={`filter-tab ${handFilter === 'right' ? 'active' : ''}`}
          onClick={() => setHandFilter('right')}
        >
          Right Hand ({chordsByHand.right.length})
        </button>
        <button
          className={`filter-tab ${handFilter === 'left' ? 'active' : ''}`}
          onClick={() => setHandFilter('left')}
        >
          Left Hand ({chordsByHand.left.length})
        </button>
        <button
          className={`filter-tab ${handFilter === 'cross' ? 'active' : ''}`}
          onClick={() => setHandFilter('cross')}
        >
          Cross-Hand ({chordsByHand.cross.length})
        </button>
      </div>

      {/* Quick practice buttons */}
      <div className="quick-practice-buttons">
        <button
          className="quick-practice-btn"
          onClick={() => startPractice(chordsByHand.right.slice(0, 5))}
        >
          Practice Top 5 Right Hand
        </button>
        <button
          className="quick-practice-btn"
          onClick={() => startPractice(chordsByHand.left.slice(0, 5))}
        >
          Practice Top 5 Left Hand
        </button>
        <button
          className="quick-practice-btn"
          onClick={() => startPractice(chordsByHand.cross.slice(0, 5))}
        >
          Practice Top 5 Cross-Hand
        </button>
      </div>

      {/* Survival mode buttons */}
      <div className="survival-mode-section">
        <h3 className="survival-section-title">🎮 Survival Mode</h3>
        <p className="survival-section-desc">Test your speed! Answer correctly before time runs out.</p>
        <div className="survival-buttons">
          <button
            className="survival-btn"
            onClick={() => {
              setSurvivalItemType('all-power-chords');
              setViewMode('survival');
            }}
          >
            All Power Chords
          </button>
          <button
            className="survival-btn"
            onClick={() => {
              setSurvivalItemType('right-hand');
              setViewMode('survival');
            }}
          >
            Right Hand
          </button>
          <button
            className="survival-btn"
            onClick={() => {
              setSurvivalItemType('left-hand');
              setViewMode('survival');
            }}
          >
            Left Hand
          </button>
          <button
            className="survival-btn"
            onClick={() => {
              setSurvivalItemType('cross-hand');
              setViewMode('survival');
            }}
          >
            Cross-Hand
          </button>
        </div>
      </div>

      {/* Power chord grid */}
      <div className="power-chord-grid">
        {filteredChords.map(renderChordCard)}
      </div>

      {/* Selected chord detail */}
      {selectedChord && (
        <div className="chord-detail-panel">
          <div className="detail-header">
            <h3>
              {selectedChord.characters[0].displayChar} + {selectedChord.characters[1].displayChar}
            </h3>
            <button className="close-btn" onClick={() => setSelectedChord(null)}>
              ×
            </button>
          </div>

          <div className="detail-content">
            {/* Fingers */}
            <div className="detail-fingers">
              <ColoredFinger
                fingerId={selectedChord.fingerIds[0]}
                isActive
                size="large"
                showLabel
              />
              <span className="detail-plus">+</span>
              <ColoredFinger
                fingerId={selectedChord.fingerIds[1]}
                isActive
                size="large"
                showLabel
              />
            </div>

            {/* Color preview */}
            <div
              className="detail-color-preview"
              style={{ backgroundColor: selectedChord.blendedColor }}
            />

            {/* Hand type */}
            <div className="detail-hand-type">
              {selectedChord.hand === 'left' && 'Left Hand Only'}
              {selectedChord.hand === 'right' && 'Right Hand Only'}
              {selectedChord.hand === 'cross' && 'Both Hands (Cross-Hand)'}
            </div>

            {/* Words this chord produces */}
            {selectedChord.producesWords.length > 0 && (
              <div className="detail-words">
                <h4>Words using this chord:</h4>
                <div className="word-chips">
                  {selectedChord.producesWords.slice(0, 10).map((word) => (
                    <span key={word} className="word-chip">
                      {word}
                    </span>
                  ))}
                  {selectedChord.producesWords.length > 10 && (
                    <span className="word-chip more">
                      +{selectedChord.producesWords.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="detail-actions">
              <button
                className="btn secondary"
                onClick={() => playChordSound(selectedChord)}
              >
                Play Sound
              </button>
              <button
                className="btn primary"
                onClick={() => startPractice([selectedChord])}
              >
                Practice This
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render practice mode
  const renderPracticeMode = () => {
    if (!currentPracticeChord) {
      // No chord to practice - this shouldn't happen, but return to browse if it does
      return null;
    }

    const char1 = currentPracticeChord.characters[0];
    const char2 = currentPracticeChord.characters[1];

    return (
      <div className={`power-chord-practice ${feedback ?? ''}`}>
        <div className="practice-header">
          <button className="back-btn" onClick={() => setViewMode('browse')}>
            ← Back to Browse
          </button>
          <span className="practice-progress">
            Chord {currentPracticeIndex + 1} of {practiceQueue.length}
          </span>
        </div>

        <h2>Press Both Keys Together</h2>

        <div className="practice-chord-display">
          <div className="practice-char" style={{ color: char1.color }}>
            {char1.displayChar}
          </div>
          <span className="practice-plus">+</span>
          <div className="practice-char" style={{ color: char2.color }}>
            {char2.displayChar}
          </div>
        </div>

        <div
          className="practice-color-bar"
          style={{ backgroundColor: currentPracticeChord.blendedColor }}
        />

        {/* Finger indicators */}
        <div className="practice-fingers">
          <ColoredFinger
            fingerId={currentPracticeChord.fingerIds[0]}
            isActive
            size="large"
            showLabel
          />
          <ColoredFinger
            fingerId={currentPracticeChord.fingerIds[1]}
            isActive
            size="large"
            showLabel
          />
        </div>

        {/* Progress dots */}
        <div className="practice-dots">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`practice-dot ${i < practiceSuccesses ? 'filled' : ''}`}
              style={{
                backgroundColor:
                  i < practiceSuccesses ? currentPracticeChord.blendedColor : undefined,
              }}
            />
          ))}
        </div>
        <p className="practice-count">{practiceSuccesses} / 5 successful</p>

        {/* Text input for CharaChorder */}
        <input
          ref={inputRef}
          type="text"
          value={textInput}
          onChange={handleTextInputChange}
          className="chord-input"
          placeholder="Type here or press keys..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* Feedback */}
        {feedback === 'correct' && <div className="practice-feedback correct">Correct!</div>}
        {feedback === 'incorrect' && <div className="practice-feedback incorrect">Try again</div>}

        {/* Hints */}
        <p className="practice-hint">
          Press <strong>{char1.displayChar}</strong> and <strong>{char2.displayChar}</strong>{' '}
          at the same time
        </p>

        {currentPracticeChord.producesWords.length > 0 && (
          <p className="practice-hint secondary">
            CharaChorder: chord outputs like "{currentPracticeChord.producesWords[0]}" also count!
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="power-chord-learning">
      <h2 className="page-title">Power Chord Learning</h2>
      <p className="page-subtitle">
        Learn 2-key combinations before tackling full words. Power chords are the building blocks
        of efficient typing.
      </p>

      {viewMode === 'browse' && renderBrowseMode()}
      {viewMode === 'practice' && renderPracticeMode()}
      {viewMode === 'survival' && (
        <SurvivalGame
          itemType={survivalItemType}
          onBack={() => setViewMode('browse')}
        />
      )}
    </div>
  );
}

export default PowerChordLearning;

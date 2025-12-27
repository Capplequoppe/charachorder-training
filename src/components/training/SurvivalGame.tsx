/**
 * Survival Game Component
 *
 * Time-based challenge mode where the user must answer correctly on the first try
 * within a time limit. Game over on the first miss.
 *
 * Difficulty levels:
 * - Beginner: 10 seconds
 * - Intermediate: 3 seconds
 * - Expert: 500ms
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { PowerChord, Word, FingerId, Finger, ALL_FINGER_IDS, MasteryLevel } from '../../domain';
import { useInput, useAudio, useProgress } from '../../hooks';
import { getServiceRepositories } from '../../services';
import { SimultaneousPressEvent, CHORD_MAX_DURATION_MS, getHighScoreService, type HighScoreCategory } from '../../services';
import { getCharsForFinger, getConfigForChar, FINGER_NAMES, FINGER_COLORS } from '../../config/fingerMapping';
import { getFingerColor } from '../../data/static/colorConfig';
import { ColoredFinger } from '../common/ColoredFinger';
import './training.css';

// ==================== Types ====================

export type SurvivalDifficulty = 'beginner' | 'intermediate' | 'expert';

export type SurvivalItemType =
  | 'left-hand'
  | 'right-hand'
  | 'cross-hand'
  | 'all-power-chords'
  | 'word-chords'
  | 'fingers'
  | 'characters';

// A character challenge: user must press the specific character
interface CharacterChallenge {
  type: 'character';
  char: string;
  color: string;
}

// A finger challenge: user must press one of the valid chars for this finger
interface FingerChallenge {
  type: 'finger';
  fingerId: FingerId;
  validChars: string[];
}

// A power chord challenge: user must press both chars simultaneously
interface PowerChordChallenge {
  type: 'power-chord';
  powerChord: PowerChord;
  /** Randomly reverse display order to train recognition regardless of letter order */
  reverseDisplay: boolean;
}

// A word chord challenge: user must type the word or chord it
interface WordChallenge {
  type: 'word';
  word: Word;
}

type SurvivalChallenge = CharacterChallenge | FingerChallenge | PowerChordChallenge | WordChallenge;

interface DifficultySettings {
  label: string;
  description: string;
  timeLimitMs: number;
}

const DIFFICULTY_SETTINGS: Record<SurvivalDifficulty, DifficultySettings> = {
  beginner: {
    label: 'Beginner',
    description: '10 seconds per chord',
    timeLimitMs: 10000,
  },
  intermediate: {
    label: 'Intermediate',
    description: '3 seconds per chord',
    timeLimitMs: 3000,
  },
  expert: {
    label: 'Expert',
    description: '1 second per chord',
    timeLimitMs: 1000,
  },
};

/** Number of lives (mistakes allowed) in boss mode */
const BOSS_LIVES = 3;

// Helper to convert item type to high score category
function toHighScoreCategory(itemType: SurvivalItemType): HighScoreCategory {
  return `survival-${itemType}` as HighScoreCategory;
}

// ==================== Props ====================

/** Boss mode configuration */
export interface BossModeConfig {
  /** Target score percentage to pass (0-100) */
  targetScorePercent: number;
  /** Maximum number of items to quiz */
  itemCount: number;
  /** Title for the boss challenge */
  title?: string;
}

/** Result of a boss challenge */
export interface BossResult {
  /** Whether the boss was defeated */
  passed: boolean;
  /** Score achieved (percentage) */
  scorePercent: number;
  /** Number of correct answers */
  correctCount: number;
  /** Total items attempted */
  totalItems: number;
}

export interface SurvivalGameProps {
  /** Type of items to quiz */
  itemType: SurvivalItemType;
  /** Only include items with this mastery level (default: no filter, include all) */
  masteryFilter?: MasteryLevel;
  /** Boss mode configuration (fixed difficulty, limited items, pass/fail) */
  bossMode?: BossModeConfig;
  /** Current best score for boss mode (to display after attempts) */
  bossBestScore?: number;
  /** Callback when game ends (normal survival) */
  onComplete?: (score: number, isNewHighScore: boolean) => void;
  /** Callback when boss challenge ends */
  onBossComplete?: (result: BossResult) => void;
  /** Callback to go back */
  onBack?: () => void;
}

// ==================== Helper Functions ====================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ==================== Component ====================

export function SurvivalGame({
  itemType,
  masteryFilter,
  bossMode,
  bossBestScore = 0,
  onComplete,
  onBossComplete,
  onBack,
}: SurvivalGameProps): React.ReactElement {
  const inputService = useInput();
  const audioService = useAudio();
  const progressService = useProgress();

  // Game state - boss mode skips difficulty selection
  const [phase, setPhase] = useState<'select-difficulty' | 'countdown' | 'playing' | 'game-over'>(
    bossMode ? 'select-difficulty' : 'select-difficulty'
  );
  const [countdownValue, setCountdownValue] = useState(3);
  const [difficulty, setDifficulty] = useState<SurvivalDifficulty>(
    bossMode ? 'intermediate' : 'beginner'
  );
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Boss mode tracking
  const [bossItemsCompleted, setBossItemsCompleted] = useState(0);
  const [lives, setLives] = useState(BOSS_LIVES);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Input state
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const charTimestamps = useRef<number[]>([]);
  const lastProcessedInput = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // Get challenges based on type, optionally filtered by mastery
  const items = useMemo((): SurvivalChallenge[] => {
    const { powerChords, words, progress } = getServiceRepositories();

    // Helper to filter by mastery level
    const filterByMastery = <T extends SurvivalChallenge>(
      challenges: T[],
      getItemId: (c: T) => string,
      itemType: 'character' | 'powerChord' | 'word'
    ): T[] => {
      if (!masteryFilter) return challenges;
      return challenges.filter((c) => {
        const p = progress.getProgress(getItemId(c), itemType);
        return p?.masteryLevel === masteryFilter;
      });
    };

    let result: SurvivalChallenge[];

    switch (itemType) {
      case 'left-hand': {
        let challenges = powerChords.getByHand('left').map(pc => ({
          type: 'power-chord' as const,
          powerChord: pc,
          reverseDisplay: Math.random() < 0.5,
        }));
        challenges = filterByMastery(challenges, c => c.powerChord.id, 'powerChord');
        // In boss mode, repeat each power chord 3 times
        if (bossMode) {
          const repeated: typeof challenges = [];
          for (let i = 0; i < 3; i++) {
            // Re-randomize display order for each repetition
            repeated.push(...challenges.map(c => ({ ...c, reverseDisplay: Math.random() < 0.5 })));
          }
          challenges = repeated;
        }
        result = shuffleArray(challenges);
        break;
      }
      case 'right-hand': {
        let challenges = powerChords.getByHand('right').map(pc => ({
          type: 'power-chord' as const,
          powerChord: pc,
          reverseDisplay: Math.random() < 0.5,
        }));
        challenges = filterByMastery(challenges, c => c.powerChord.id, 'powerChord');
        // In boss mode, repeat each power chord 3 times
        if (bossMode) {
          const repeated: typeof challenges = [];
          for (let i = 0; i < 3; i++) {
            // Re-randomize display order for each repetition
            repeated.push(...challenges.map(c => ({ ...c, reverseDisplay: Math.random() < 0.5 })));
          }
          challenges = repeated;
        }
        result = shuffleArray(challenges);
        break;
      }
      case 'cross-hand': {
        let challenges = powerChords.getByHand('cross').map(pc => ({
          type: 'power-chord' as const,
          powerChord: pc,
          reverseDisplay: Math.random() < 0.5,
        }));
        challenges = filterByMastery(challenges, c => c.powerChord.id, 'powerChord');
        // In boss mode, repeat each power chord 3 times
        if (bossMode) {
          const repeated: typeof challenges = [];
          for (let i = 0; i < 3; i++) {
            // Re-randomize display order for each repetition
            repeated.push(...challenges.map(c => ({ ...c, reverseDisplay: Math.random() < 0.5 })));
          }
          challenges = repeated;
        }
        result = shuffleArray(challenges);
        break;
      }
      case 'all-power-chords': {
        let challenges = powerChords.getAll().map(pc => ({
          type: 'power-chord' as const,
          powerChord: pc,
          reverseDisplay: Math.random() < 0.5,
        }));
        challenges = filterByMastery(challenges, c => c.powerChord.id, 'powerChord');
        // In boss mode, repeat each power chord 3 times
        if (bossMode) {
          const repeated: typeof challenges = [];
          for (let i = 0; i < 3; i++) {
            // Re-randomize display order for each repetition
            repeated.push(...challenges.map(c => ({ ...c, reverseDisplay: Math.random() < 0.5 })));
          }
          challenges = repeated;
        }
        result = shuffleArray(challenges);
        break;
      }
      case 'word-chords': {
        // Get all words from the word repository (300+ words)
        const challenges = words.getAll().map(w => ({ type: 'word' as const, word: w }));
        result = shuffleArray(filterByMastery(challenges, c => c.word.word, 'word'));
        break;
      }
      case 'fingers': {
        // Create finger challenges - each finger appears multiple times for variety
        const fingerChallenges: FingerChallenge[] = [];
        for (const fingerId of ALL_FINGER_IDS) {
          const chars = getCharsForFinger(fingerId);
          if (chars.length > 0) {
            // Add each finger 3 times for a longer game
            for (let i = 0; i < 3; i++) {
              fingerChallenges.push({
                type: 'finger',
                fingerId,
                validChars: chars.map(c => c.toLowerCase()),
              });
            }
          }
        }
        // For fingers, filter by mastery using character progress
        if (masteryFilter) {
          const filteredFingers = fingerChallenges.filter((c) => {
            // Check if any character for this finger is at the mastery level
            return c.validChars.some((char) => {
              const p = progress.getProgress(char, 'character');
              return p?.masteryLevel === masteryFilter;
            });
          });
          result = shuffleArray(filteredFingers);
        } else {
          result = shuffleArray(fingerChallenges);
        }
        break;
      }
      case 'characters': {
        // Create character challenges - each character is its own challenge
        let charChallenges: CharacterChallenge[] = [];
        for (const fingerId of ALL_FINGER_IDS) {
          const chars = getCharsForFinger(fingerId);
          for (const char of chars) {
            const config = getConfigForChar(char);
            const color = config ? getFingerColor(config.fingerId, config.direction) : '#888';
            charChallenges.push({
              type: 'character',
              char: char.toLowerCase(),
              color,
            });
          }
        }
        // Filter by mastery
        if (masteryFilter) {
          charChallenges = charChallenges.filter((c) => {
            const p = progress.getProgress(c.char, 'character');
            return p?.masteryLevel === masteryFilter;
          });
        }
        // In boss mode, repeat each character 3 times
        if (bossMode) {
          const repeated: typeof charChallenges = [];
          for (let i = 0; i < 3; i++) {
            repeated.push(...charChallenges);
          }
          charChallenges = repeated;
        }
        result = shuffleArray(charChallenges);
        break;
      }
      default:
        result = [];
    }

    // Limit items for boss mode
    if (bossMode && result.length > bossMode.itemCount) {
      result = result.slice(0, bossMode.itemCount);
    }

    return result;
  }, [itemType, masteryFilter, bossMode]);

  const currentItem = items[currentIndex];
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const highScoreService = getHighScoreService();
  const highScore = highScoreService.getHighScore(toHighScoreCategory(itemType), difficulty);

  // Expected characters for current challenge
  const expectedChars = useMemo(() => {
    if (!currentItem) return new Set<string>();
    if (currentItem.type === 'character') {
      return new Set([currentItem.char]);
    }
    if (currentItem.type === 'finger') {
      return new Set(currentItem.validChars);
    }
    if (currentItem.type === 'word') {
      // For word challenges, expected chars are the chord characters
      return new Set(currentItem.word.chord.characters.map(
        (c: { displayChar: string }) => c.displayChar.toLowerCase()
      ));
    }
    return new Set([
      currentItem.powerChord.characters[0].char.toLowerCase(),
      currentItem.powerChord.characters[1].char.toLowerCase(),
    ]);
  }, [currentItem]);

  // Valid words that this challenge produces
  const validChordedWords = useMemo(() => {
    if (!currentItem) return new Set<string>();
    if (currentItem.type === 'character') return new Set<string>();
    if (currentItem.type === 'finger') return new Set<string>();
    if (currentItem.type === 'word') {
      // For word challenges, the valid word is the word itself
      return new Set([currentItem.word.word.toLowerCase()]);
    }
    return new Set(currentItem.powerChord.producesWords.map((w) => w.toLowerCase()));
  }, [currentItem]);

  // Start the game with countdown
  const startGame = useCallback((selectedDifficulty: SurvivalDifficulty) => {
    setDifficulty(selectedDifficulty);
    setScore(0);
    setCurrentIndex(0);
    setFeedback(null);
    setIsNewHighScore(false);
    setBossItemsCompleted(0);
    setLives(BOSS_LIVES);
    setCountdownValue(3);
    setPhase('countdown');
  }, []);

  // Handle Enter key to start challenge in boss mode selection
  useEffect(() => {
    if (phase !== 'select-difficulty' || !bossMode || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        startGame('intermediate');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, bossMode, items.length, startGame]);

  // Handle Enter key to retry on boss game over screen
  useEffect(() => {
    if (phase !== 'game-over' || !bossMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        startGame('intermediate');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, bossMode, startGame]);

  // Handle countdown
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownValue <= 0) {
      setPhase('playing');
      return;
    }

    const timer = setTimeout(() => {
      setCountdownValue((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdownValue]);

  // End the game
  const endGame = useCallback((reason: 'incorrect' | 'timeout' | 'boss-complete') => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (reason === 'boss-complete') {
      setFeedback(null);
    } else {
      setFeedback(reason);
    }

    // Handle boss mode completion
    if (bossMode) {
      const totalItems = Math.min(bossMode.itemCount, items.length);
      const correctCount = reason === 'boss-complete' ? score + 1 : score;
      const scorePercent = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;
      const passed = scorePercent >= bossMode.targetScorePercent;

      setPhase('game-over');

      if (onBossComplete) {
        onBossComplete({
          passed,
          scorePercent,
          correctCount,
          totalItems,
        });
      }
      return;
    }

    // Normal survival mode
    const isNew = highScoreService.setHighScore(toHighScoreCategory(itemType), difficulty, score);
    setIsNewHighScore(isNew);
    setPhase('game-over');

    if (onComplete) {
      onComplete(score, isNew);
    }
  }, [itemType, difficulty, score, bossMode, items.length, onComplete, onBossComplete]);

  // Handle boss mode mistake (incorrect or timeout) - uses lives system
  const handleBossMistake = useCallback((reason: 'incorrect' | 'timeout') => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    audioService.playErrorSound?.();
    setFeedback(reason);

    const newLives = lives - 1;
    setLives(newLives);

    // Check if out of lives
    if (newLives <= 0) {
      // Game over - no lives left
      setTimeout(() => {
        endGame(reason);
        isProcessingRef.current = false;
      }, 500);
      return;
    }

    // Still have lives - continue to next item
    const newCompleted = bossItemsCompleted + 1;
    const totalItems = Math.min(bossMode!.itemCount, items.length);

    if (newCompleted >= totalItems) {
      // All items attempted - end game (with current score)
      setTimeout(() => {
        endGame('boss-complete');
        isProcessingRef.current = false;
      }, 500);
      return;
    }

    // Move to next item
    setBossItemsCompleted(newCompleted);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
      isProcessingRef.current = false;
    }, 500);
  }, [lives, bossItemsCompleted, bossMode, items.length, audioService, endGame]);

  // Handle correct answer
  const handleCorrect = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setFeedback('correct');

    if (currentItem) {
      if (currentItem.type === 'power-chord') {
        audioService.playPowerChord(currentItem.powerChord);
        progressService.recordPowerChordAttempt(currentItem.powerChord.id, true, Date.now() - startTimeRef.current);
      } else if (currentItem.type === 'word') {
        // Word challenge - play word resolution sound
        audioService.playWordResolution(currentItem.word);
        progressService.recordWordAttempt(currentItem.word.word, true, Date.now() - startTimeRef.current, 1);
      } else {
        // Finger challenge - just play success sound
        audioService.playSuccessSound?.();
      }
    }

    // Clear input
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';

    // Boss mode: check if we've completed all items
    if (bossMode) {
      const newCompleted = bossItemsCompleted + 1;
      const totalItems = Math.min(bossMode.itemCount, items.length);

      if (newCompleted >= totalItems) {
        // Boss challenge complete!
        setScore((prev) => prev + 1);
        setTimeout(() => {
          endGame('boss-complete');
        }, 300);
        return;
      }

      // Move to next item sequentially in boss mode
      setBossItemsCompleted(newCompleted);
      setScore((prev) => prev + 1);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setFeedback(null);
        isProcessingRef.current = false;
      }, 300);
      return;
    }

    // Normal survival mode: pick random next item
    setScore((prev) => prev + 1);
    setTimeout(() => {
      const nextIndex = Math.floor(Math.random() * items.length);
      setCurrentIndex(nextIndex);
      setFeedback(null);
      isProcessingRef.current = false;
    }, 300);
  }, [currentItem, items.length, bossMode, bossItemsCompleted, audioService, progressService, endGame]);

  // Handle incorrect answer
  const handleIncorrect = useCallback(() => {
    // In boss mode, use the lives system
    if (bossMode) {
      handleBossMistake('incorrect');
      return;
    }

    // Normal survival mode - game over immediately
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    audioService.playErrorSound?.();
    endGame('incorrect');
    isProcessingRef.current = false;
  }, [bossMode, handleBossMistake, audioService, endGame]);

  // Handle single key press (for finger and character challenges)
  const handleSingleKeyPress = useCallback(
    (key: string) => {
      if (phase !== 'playing') return;
      if (!currentItem || (currentItem.type !== 'finger' && currentItem.type !== 'character')) return;
      if (isProcessingRef.current) return;

      const lowerKey = key.toLowerCase();

      // Check if the pressed key matches
      if (expectedChars.has(lowerKey)) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    },
    [phase, currentItem, expectedChars, handleCorrect, handleIncorrect]
  );

  // Handle simultaneous press (for power chords and word chords on regular keyboards)
  // In survival mode, we ONLY handle correct matches here - never call handleIncorrect
  // from simultaneous press, because CharaChorder's word output can cause false negatives.
  const handleSimultaneousPress = useCallback(
    (event: SimultaneousPressEvent) => {
      if (phase !== 'playing') return;
      // Handle power chords and word chords (not finger challenges)
      if (!currentItem || currentItem.type === 'finger') return;
      if (isProcessingRef.current) return;

      const pressedKeys = event.keys.map((k) => k.toLowerCase());
      const pressedSet = new Set(pressedKeys);

      // For power chords, expect exactly 2 keys
      // For word chords, expect the exact number of chord characters
      const expectedCount = expectedChars.size;
      const isValidKeyCount = pressedKeys.length === expectedCount &&
        pressedKeys.every(k => k.length === 1 && /[a-z]/.test(k));

      if (!isValidKeyCount) return;

      const isMatch = [...expectedChars].every((c) => pressedSet.has(c)) &&
        pressedSet.size === expectedChars.size;

      if (isMatch) {
        handleCorrect();
      }
      // NOTE: We do NOT call handleIncorrect here for survival mode!
      // Wrong key combinations will be handled by timeout.
    },
    [phase, currentItem, expectedChars, handleCorrect]
  );

  // Handle text input change (for CharaChorder chord detection)
  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (phase !== 'playing') return;
      if (isProcessingRef.current) return;

      const newValue = e.target.value;
      const now = Date.now();

      // Track timestamps for new characters
      if (newValue.length > textInput.length) {
        const addedCount = newValue.length - textInput.length;
        for (let i = 0; i < addedCount; i++) {
          charTimestamps.current.push(now);
        }
      } else if (newValue.length < textInput.length) {
        charTimestamps.current = charTimestamps.current.slice(0, newValue.length);
      }

      setTextInput(newValue);

      // Check if input ends with space (CharaChorder completion signal)
      if (newValue.endsWith(' ')) {
        const word = newValue.trim().toLowerCase();

        if (word === lastProcessedInput.current) return;
        lastProcessedInput.current = word;

        // Check for valid input
        // Raw chars match: the input characters match the expected chord characters
        const inputChars = new Set(word.split(''));
        const rawCharsMatch = word.length === expectedChars.size &&
          [...expectedChars].every((c) => inputChars.has(c));
        const chordedWordMatch = validChordedWords.has(word);

        if (rawCharsMatch || chordedWordMatch) {
          handleCorrect();
        } else {
          // No match - don't call handleIncorrect, may be partial CharaChorder output
          // Clear input and let user try again or timeout
          setTextInput('');
          charTimestamps.current = [];
          lastProcessedInput.current = '';
        }
      }
    },
    [phase, textInput, expectedChars, validChordedWords, handleCorrect]
  );

  // Listen for simultaneous presses
  useEffect(() => {
    const unsubscribe = inputService.onSimultaneousPress(handleSimultaneousPress);
    return unsubscribe;
  }, [inputService, handleSimultaneousPress]);

  // Process key events through input service
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // For finger and character challenges, handle single key presses directly
      if ((currentItem?.type === 'finger' || currentItem?.type === 'character') && e.key.length === 1) {
        handleSingleKeyPress(e.key);
        return;
      }
      // For power chords and word chords, use the input service for simultaneous detection
      inputService.processKeyDown(e);
    };
    const handleKeyUp = (e: KeyboardEvent) => inputService.processKeyUp(e);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inputService, currentItem, handleSingleKeyPress]);

  // Ref to store current timeout handler (avoids stale closure in timer)
  const handleTimeoutRef = useRef<() => void>(() => {});

  // Update the timeout handler ref when dependencies change
  useEffect(() => {
    handleTimeoutRef.current = () => {
      if (bossMode) {
        handleBossMistake('timeout');
      } else {
        endGame('timeout');
      }
    };
  }, [bossMode, handleBossMistake, endGame]);

  // Start/reset timer when current item changes
  useEffect(() => {
    if (phase !== 'playing') return;

    isProcessingRef.current = false;
    startTimeRef.current = Date.now();
    setTimeRemaining(settings.timeLimitMs);
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    // Start countdown timer
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, settings.timeLimitMs - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        handleTimeoutRef.current();
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, currentIndex, settings.timeLimitMs]);

  // Get title for item type
  const getTitle = () => {
    switch (itemType) {
      case 'left-hand':
        return 'Left Hand Survival';
      case 'right-hand':
        return 'Right Hand Survival';
      case 'cross-hand':
        return 'Cross-Hand Survival';
      case 'all-power-chords':
        return 'All Power Chords Survival';
      case 'word-chords':
        return 'Word Chords Survival';
      case 'fingers':
        return 'Finger Fundamentals Survival';
      default:
        return 'Survival Game';
    }
  };

  // Render difficulty selection (or boss mode start)
  const renderDifficultySelect = () => {
    // Boss mode: single start button at intermediate difficulty
    if (bossMode) {
      const totalItems = Math.min(bossMode.itemCount, items.length);
      return (
        <div className="training-phase survival-select boss-select">
          <h2>🏆 {bossMode.title || 'Boss Challenge'}</h2>
          <p className="subtitle">Prove your mastery!</p>

          <div className="boss-requirements">
            <div className="boss-req-item">
              <span className="boss-req-label">Items</span>
              <span className="boss-req-value">{totalItems}</span>
            </div>
            <div className="boss-req-item">
              <span className="boss-req-label">Time per item</span>
              <span className="boss-req-value">3 seconds</span>
            </div>
            <div className="boss-req-item">
              <span className="boss-req-label">Lives</span>
              <span className="boss-req-value">{'❤️'.repeat(BOSS_LIVES)}</span>
            </div>
            <div className="boss-req-item">
              <span className="boss-req-label">Target Score</span>
              <span className="boss-req-value">{bossMode.targetScorePercent}%</span>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="boss-no-items">No mastered items available for this challenge yet!</p>
          ) : (
            <button
              className="btn primary boss-start-btn"
              onClick={() => startGame('intermediate')}
            >
              Start Challenge
            </button>
          )}

          {onBack && (
            <button className="btn secondary back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
        </div>
      );
    }

    // Normal survival mode: difficulty selection
    return (
      <div className="training-phase survival-select">
        <h2>{getTitle()}</h2>
        <p className="subtitle">Choose your difficulty</p>

        {items.length === 0 ? (
          <div className="survival-no-items">
            <p className="survival-no-items-text">
              {masteryFilter === MasteryLevel.MASTERED
                ? 'No mastered items available yet! Complete some review sessions to master characters first.'
                : 'No items available for this challenge.'}
            </p>
          </div>
        ) : (
          <div className="difficulty-options">
            {(Object.keys(DIFFICULTY_SETTINGS) as SurvivalDifficulty[]).map((diff) => {
              const setting = DIFFICULTY_SETTINGS[diff];
              const hs = highScoreService.getHighScore(toHighScoreCategory(itemType), diff);
              return (
                <button
                  key={diff}
                  className={`difficulty-option ${diff}`}
                  onClick={() => startGame(diff)}
                >
                  <span className="difficulty-label">{setting.label}</span>
                  <span className="difficulty-desc">{setting.description}</span>
                  {hs > 0 && <span className="difficulty-highscore">Best: {hs}</span>}
                </button>
              );
            })}
          </div>
        )}

      {onBack && (
        <button className="btn secondary back-btn" onClick={onBack}>
          ← Back
        </button>
      )}
    </div>
    );
  };

  // Render countdown phase
  const renderCountdown = () => {
    return (
      <div className="training-phase survival-countdown">
        <p className="countdown-label">Get Ready!</p>
        <div className="countdown-number">
          {countdownValue > 0 ? countdownValue : 'GO!'}
        </div>
        <p className="countdown-hint">Position your hands...</p>
      </div>
    );
  };

  // Render playing phase
  const renderPlaying = () => {
    if (!currentItem) return null;

    const timePercent = (timeRemaining / settings.timeLimitMs) * 100;
    const isLow = timePercent < 25;

    return (
      <div className={`training-phase survival-playing ${feedback ?? ''}`}>
        <div className={`survival-header ${bossMode ? 'survival-header--boss' : ''}`}>
          {bossMode ? (
            <>
              <span className="survival-progress">Progress: {bossItemsCompleted + 1}/{Math.min(bossMode.itemCount, items.length)}</span>
              <span className="survival-lives">
                {'❤️'.repeat(lives)}{'🖤'.repeat(BOSS_LIVES - lives)}
              </span>
              <span className="survival-score">Score: {score}</span>
            </>
          ) : (
            <>
              <span className="survival-score">Score: {score}</span>
              <span className="survival-high">Best: {highScore}</span>
            </>
          )}
        </div>

        <div className={`survival-timer ${isLow ? 'low' : ''}`}>
          <div
            className="survival-timer-bar"
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* Power chord display - randomize character order to train recognition */}
        {currentItem.type === 'power-chord' && (() => {
          const chars = currentItem.powerChord.characters;
          const first = currentItem.reverseDisplay ? chars[1] : chars[0];
          const second = currentItem.reverseDisplay ? chars[0] : chars[1];
          return (
            <div className="power-chord-display survival-target">
              <span className="character large" style={{ color: first.color }}>
                {first.displayChar}
              </span>
              <span className="plus">+</span>
              <span className="character large" style={{ color: second.color }}>
                {second.displayChar}
              </span>
            </div>
          );
        })()}

        {/* Character challenge display */}
        {currentItem.type === 'character' && (
          <div className="character-challenge-display survival-target">
            <p className="character-prompt">Press:</p>
            <h1 className="character-display" style={{ color: currentItem.color }}>
              {currentItem.char.toUpperCase()}
            </h1>
          </div>
        )}

        {/* Finger challenge display */}
        {currentItem.type === 'finger' && (
          <div className="finger-challenge-display survival-target">
            <div className="finger-indicator-large">
              <ColoredFinger
                fingerId={currentItem.fingerId}
                isActive
                size="large"
                showLabel
              />
            </div>
            <p className="finger-hint">
              Press any key for <strong style={{ color: FINGER_COLORS[currentItem.fingerId] }}>
                {FINGER_NAMES[currentItem.fingerId]}
              </strong>
            </p>
            <p className="finger-chars-hint">
              ({currentItem.validChars.map(c => c.toUpperCase()).join(', ')})
            </p>
          </div>
        )}

        {/* Word challenge display */}
        {currentItem.type === 'word' && (
          <div className="word-challenge-display survival-target">
            {/* Show the word */}
            <h1 className="word-display survival-word">
              {currentItem.word.word}
            </h1>
            {/* Show the chord characters */}
            <div className="power-chord-display">
              {currentItem.word.chord.characters.map((char: { color: string; displayChar: string }, idx: number) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="plus">+</span>}
                  <span className="character large" style={{ color: char.color }}>
                    {char.displayChar}
                  </span>
                </React.Fragment>
              ))}
            </div>
            {currentItem.word.rank && (
              <p className="word-rank-hint">#{currentItem.word.rank} most common</p>
            )}
          </div>
        )}

        {/* Visually hidden input for CharaChorder */}
        <input
          ref={inputRef}
          type="text"
          value={textInput}
          onChange={handleTextInputChange}
          className="chord-input chord-input--hidden"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-hidden="true"
        />

        {feedback === 'correct' && <div className="feedback correct">Correct!</div>}
      </div>
    );
  };

  // Render game over
  const renderGameOver = () => {
    // Boss mode game over
    if (bossMode) {
      const totalItems = Math.min(bossMode.itemCount, items.length);
      const scorePercent = totalItems > 0 ? Math.round((score / totalItems) * 100) : 0;
      const passed = scorePercent >= bossMode.targetScorePercent;
      const isNewBest = scorePercent > bossBestScore;
      const displayBestScore = Math.max(bossBestScore, scorePercent);

      return (
        <div className={`training-phase survival-game-over boss-game-over ${passed ? 'boss-victory' : 'boss-defeat'}`}>
          <h2>{passed ? '🏆 Victory!' : '💀 Defeated'}</h2>

          {isNewBest && scorePercent > 0 && (
            <div className="new-high-score-banner">New Best Score!</div>
          )}

          <div className="boss-result">
            <div className="boss-score-circle">
              <span className="boss-score-percent">{scorePercent}%</span>
              <span className="boss-score-detail">{score}/{totalItems}</span>
            </div>
            <p className="boss-target">Target: {bossMode.targetScorePercent}%</p>
            {displayBestScore > 0 && displayBestScore !== scorePercent && (
              <p className="boss-best-score">Best: {displayBestScore}%</p>
            )}
          </div>

          {feedback === 'timeout' && (
            <p className="game-over-reason">Time ran out!</p>
          )}
          {feedback === 'incorrect' && (
            <p className="game-over-reason">Wrong answer!</p>
          )}

          <div className="complete-actions">
            <button className="btn primary" onClick={() => startGame('intermediate')}>
              Try Again
            </button>
            {onBack && (
              <button className="btn secondary" onClick={onBack}>
                Back
              </button>
            )}
          </div>
        </div>
      );
    }

    // Normal survival game over
    return (
      <div className="training-phase survival-game-over">
        <h2>Game Over!</h2>

        {isNewHighScore && (
          <div className="new-high-score-banner">New High Score!</div>
        )}

        <div className="survival-final-score">
          <span className="score-label">Final Score</span>
          <span className="score-value">{score}</span>
        </div>

        {feedback === 'timeout' && (
          <p className="game-over-reason">Time ran out!</p>
        )}
        {feedback === 'incorrect' && (
          <p className="game-over-reason">Wrong answer!</p>
        )}

        <div className="survival-stats">
          <div className="stat-item">
            <span className="stat-label">Difficulty</span>
            <span className="stat-value">{DIFFICULTY_SETTINGS[difficulty].label}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">High Score</span>
            <span className="stat-value">{highScoreService.getHighScore(toHighScoreCategory(itemType), difficulty)}</span>
          </div>
        </div>

        <div className="complete-actions">
          <button className="btn primary" onClick={() => startGame(difficulty)}>
            Play Again
          </button>
          <button className="btn secondary" onClick={() => setPhase('select-difficulty')}>
            Change Difficulty
          </button>
          {onBack && (
            <button className="btn secondary" onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="survival-game">
      {phase === 'select-difficulty' && renderDifficultySelect()}
      {phase === 'countdown' && renderCountdown()}
      {phase === 'playing' && renderPlaying()}
      {phase === 'game-over' && renderGameOver()}
    </div>
  );
}

export default SurvivalGame;

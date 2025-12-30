/**
 * useSurvivalGame Hook
 *
 * Manages state and game logic for the Survival Game component.
 * Extracted from SurvivalGame.tsx to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Game phase management (select-difficulty, countdown, playing, game-over)
 * - Timer/countdown logic
 * - Score and lives tracking
 * - Challenge generation and progression
 * - Input handling for various challenge types
 * - Boss mode integration
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { PowerChord, Word, FingerId, ALL_FINGER_IDS, MasteryLevel } from '../domain';
import { useInput, useAudio, useProgress } from '../hooks';
import { getServiceRepositories } from '../services';
import {
  SimultaneousPressEvent,
  getHighScoreService,
  type HighScoreCategory,
} from '../services';
import { getCharsForFinger, getConfigForChar } from '../config/fingerMapping';
import { getFingerColor } from '../data/static/colorConfig';

// ============================================================================
// Types
// ============================================================================

export type SurvivalPhase = 'select-difficulty' | 'countdown' | 'playing' | 'game-over';

export type SurvivalDifficulty = 'beginner' | 'intermediate' | 'expert';

export type SurvivalItemType =
  | 'left-hand'
  | 'right-hand'
  | 'cross-hand'
  | 'all-power-chords'
  | 'word-chords'
  | 'fingers'
  | 'characters';

export interface CharacterChallenge {
  type: 'character';
  char: string;
  color: string;
}

export interface FingerChallenge {
  type: 'finger';
  fingerId: FingerId;
  validChars: string[];
}

export interface PowerChordChallenge {
  type: 'power-chord';
  powerChord: PowerChord;
  reverseDisplay: boolean;
}

export interface WordChallenge {
  type: 'word';
  word: Word;
}

export type SurvivalChallenge =
  | CharacterChallenge
  | FingerChallenge
  | PowerChordChallenge
  | WordChallenge;

export interface DifficultySettings {
  label: string;
  description: string;
  timeLimitMs: number;
}

export interface BossModeConfig {
  targetScorePercent: number;
  itemCount: number;
  title?: string;
}

export interface BossResult {
  passed: boolean;
  scorePercent: number;
  correctCount: number;
  totalItems: number;
}

export interface UseSurvivalGameOptions {
  itemType: SurvivalItemType;
  masteryFilter?: MasteryLevel;
  bossMode?: BossModeConfig;
  bossBestScore?: number;
  onComplete?: (score: number, isNewHighScore: boolean) => void;
  onBossComplete?: (result: BossResult) => void;
}

export interface UseSurvivalGameResult {
  // State
  phase: SurvivalPhase;
  difficulty: SurvivalDifficulty;
  countdownValue: number;
  score: number;
  currentIndex: number;
  feedback: 'correct' | 'incorrect' | 'timeout' | null;
  isNewHighScore: boolean;
  timeRemaining: number;
  lives: number;
  bossItemsCompleted: number;

  // Derived data
  items: SurvivalChallenge[];
  currentItem: SurvivalChallenge | undefined;
  settings: DifficultySettings;
  highScore: number;
  expectedChars: Set<string>;
  validChordedWords: Set<string>;
  totalBossItems: number;

  // Input state (for text input field)
  textInput: string;
  inputRef: React.RefObject<HTMLInputElement | null>;

  // Actions
  startGame: (selectedDifficulty: SurvivalDifficulty) => void;
  setPhase: (phase: SurvivalPhase) => void;
  handleTextInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const DIFFICULTY_SETTINGS: Record<SurvivalDifficulty, DifficultySettings> = {
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

export const BOSS_LIVES = 3;

// ============================================================================
// Pure Utility Functions
// ============================================================================

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function toHighScoreCategory(itemType: SurvivalItemType): HighScoreCategory {
  return `survival-${itemType}` as HighScoreCategory;
}

/**
 * Generate challenges based on item type and filters.
 */
export function generateChallenges(
  itemType: SurvivalItemType,
  masteryFilter?: MasteryLevel,
  bossMode?: BossModeConfig
): SurvivalChallenge[] {
  const { powerChords, words, progress } = getServiceRepositories();

  const filterByMastery = <T extends SurvivalChallenge>(
    challenges: T[],
    getItemId: (c: T) => string,
    itemTypeForProgress: 'character' | 'powerChord' | 'word'
  ): T[] => {
    if (!masteryFilter) return challenges;
    return challenges.filter((c) => {
      const p = progress.getProgress(getItemId(c), itemTypeForProgress);
      return p?.masteryLevel === masteryFilter;
    });
  };

  let result: SurvivalChallenge[];

  switch (itemType) {
    case 'left-hand':
    case 'right-hand':
    case 'cross-hand':
    case 'all-power-chords': {
      const hand =
        itemType === 'left-hand'
          ? 'left'
          : itemType === 'right-hand'
          ? 'right'
          : itemType === 'cross-hand'
          ? 'cross'
          : undefined;

      let challenges = (hand ? powerChords.getByHand(hand) : powerChords.getAll()).map(
        (pc) => ({
          type: 'power-chord' as const,
          powerChord: pc,
          reverseDisplay: Math.random() < 0.5,
        })
      );
      challenges = filterByMastery(challenges, (c) => c.powerChord.id, 'powerChord');

      if (bossMode) {
        const repeated: typeof challenges = [];
        for (let i = 0; i < 3; i++) {
          repeated.push(
            ...challenges.map((c) => ({ ...c, reverseDisplay: Math.random() < 0.5 }))
          );
        }
        challenges = repeated;
      }
      result = shuffleArray(challenges);
      break;
    }
    case 'word-chords': {
      const challenges = words.getAll().map((w) => ({ type: 'word' as const, word: w }));
      result = shuffleArray(filterByMastery(challenges, (c) => c.word.word, 'word'));
      break;
    }
    case 'fingers': {
      const fingerChallenges: FingerChallenge[] = [];
      for (const fingerId of ALL_FINGER_IDS) {
        const chars = getCharsForFinger(fingerId);
        if (chars.length > 0) {
          for (let i = 0; i < 3; i++) {
            fingerChallenges.push({
              type: 'finger',
              fingerId,
              validChars: chars.map((c) => c.toLowerCase()),
            });
          }
        }
      }
      if (masteryFilter) {
        const filtered = fingerChallenges.filter((c) => {
          return c.validChars.some((char) => {
            const p = progress.getProgress(char, 'character');
            return p?.masteryLevel === masteryFilter;
          });
        });
        result = shuffleArray(filtered);
      } else {
        result = shuffleArray(fingerChallenges);
      }
      break;
    }
    case 'characters': {
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
      if (masteryFilter) {
        charChallenges = charChallenges.filter((c) => {
          const p = progress.getProgress(c.char, 'character');
          return p?.masteryLevel === masteryFilter;
        });
      }
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

  if (bossMode && result.length > bossMode.itemCount) {
    result = result.slice(0, bossMode.itemCount);
  }

  return result;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSurvivalGame({
  itemType,
  masteryFilter,
  bossMode,
  bossBestScore = 0,
  onComplete,
  onBossComplete,
}: UseSurvivalGameOptions): UseSurvivalGameResult {
  const inputService = useInput();
  const audioService = useAudio();
  const progressService = useProgress();

  // Game state
  const [phase, setPhase] = useState<SurvivalPhase>('select-difficulty');
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const charTimestamps = useRef<number[]>([]);
  const lastProcessedInput = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // Generate challenges
  const items = useMemo(
    () => generateChallenges(itemType, masteryFilter, bossMode),
    [itemType, masteryFilter, bossMode]
  );

  const currentItem = items[currentIndex];
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const highScoreService = getHighScoreService();
  const highScore = highScoreService.getHighScore(toHighScoreCategory(itemType), difficulty);
  const totalBossItems = bossMode ? Math.min(bossMode.itemCount, items.length) : 0;

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
      return new Set(
        currentItem.word.chord.characters.map(
          (c: { displayChar: string }) => c.displayChar.toLowerCase()
        )
      );
    }
    return new Set([
      currentItem.powerChord.characters[0].char.toLowerCase(),
      currentItem.powerChord.characters[1].char.toLowerCase(),
    ]);
  }, [currentItem]);

  // Valid words for current challenge
  const validChordedWords = useMemo(() => {
    if (!currentItem) return new Set<string>();
    if (currentItem.type === 'character') return new Set<string>();
    if (currentItem.type === 'finger') return new Set<string>();
    if (currentItem.type === 'word') {
      return new Set([currentItem.word.word.toLowerCase()]);
    }
    return new Set(currentItem.powerChord.producesWords.map((w) => w.toLowerCase()));
  }, [currentItem]);

  // End the game
  const endGame = useCallback(
    (reason: 'incorrect' | 'timeout' | 'boss-complete') => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (reason === 'boss-complete') {
        setFeedback(null);
      } else {
        setFeedback(reason);
      }

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

      const isNew = highScoreService.setHighScore(
        toHighScoreCategory(itemType),
        difficulty,
        score
      );
      setIsNewHighScore(isNew);
      setPhase('game-over');

      if (onComplete) {
        onComplete(score, isNew);
      }
    },
    [itemType, difficulty, score, bossMode, items.length, onComplete, onBossComplete]
  );

  // Handle boss mode mistake
  const handleBossMistake = useCallback(
    (reason: 'incorrect' | 'timeout') => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      audioService.playErrorSound?.();
      setFeedback(reason);

      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setTimeout(() => {
          endGame(reason);
          isProcessingRef.current = false;
        }, 500);
        return;
      }

      const newCompleted = bossItemsCompleted + 1;
      const totalItems = Math.min(bossMode!.itemCount, items.length);

      if (newCompleted >= totalItems) {
        setTimeout(() => {
          endGame('boss-complete');
          isProcessingRef.current = false;
        }, 500);
        return;
      }

      setBossItemsCompleted(newCompleted);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setFeedback(null);
        isProcessingRef.current = false;
      }, 500);
    },
    [lives, bossItemsCompleted, bossMode, items.length, audioService, endGame]
  );

  // Handle correct answer
  const handleCorrect = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setFeedback('correct');

    if (currentItem) {
      if (currentItem.type === 'power-chord') {
        audioService.playPowerChord(currentItem.powerChord);
        progressService.recordPowerChordAttempt(
          currentItem.powerChord.id,
          true,
          Date.now() - startTimeRef.current
        );
      } else if (currentItem.type === 'word') {
        audioService.playWordResolution(currentItem.word);
        progressService.recordWordAttempt(
          currentItem.word.word,
          true,
          Date.now() - startTimeRef.current,
          1
        );
      } else {
        audioService.playSuccessSound?.();
      }
    }

    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';

    if (bossMode) {
      const newCompleted = bossItemsCompleted + 1;
      const totalItems = Math.min(bossMode.itemCount, items.length);

      if (newCompleted >= totalItems) {
        setScore((prev) => prev + 1);
        setTimeout(() => {
          endGame('boss-complete');
        }, 300);
        return;
      }

      setBossItemsCompleted(newCompleted);
      setScore((prev) => prev + 1);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setFeedback(null);
        isProcessingRef.current = false;
      }, 300);
      return;
    }

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
    if (bossMode) {
      handleBossMistake('incorrect');
      return;
    }

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
      if (!currentItem || (currentItem.type !== 'finger' && currentItem.type !== 'character'))
        return;
      if (isProcessingRef.current) return;

      const lowerKey = key.toLowerCase();

      if (expectedChars.has(lowerKey)) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    },
    [phase, currentItem, expectedChars, handleCorrect, handleIncorrect]
  );

  // Handle simultaneous press (for power chords and word chords)
  const handleSimultaneousPress = useCallback(
    (event: SimultaneousPressEvent) => {
      if (phase !== 'playing') return;
      if (!currentItem || currentItem.type === 'finger') return;
      if (isProcessingRef.current) return;

      const pressedKeys = event.keys.map((k) => k.toLowerCase());
      const pressedSet = new Set(pressedKeys);

      const expectedCount = expectedChars.size;
      const isValidKeyCount =
        pressedKeys.length === expectedCount &&
        pressedKeys.every((k) => k.length === 1 && /[a-z]/.test(k));

      if (!isValidKeyCount) return;

      const isMatch =
        [...expectedChars].every((c) => pressedSet.has(c)) &&
        pressedSet.size === expectedChars.size;

      if (isMatch) {
        handleCorrect();
      }
    },
    [phase, currentItem, expectedChars, handleCorrect]
  );

  // Handle text input change
  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (phase !== 'playing') return;
      if (isProcessingRef.current) return;

      const newValue = e.target.value;
      const now = Date.now();

      if (newValue.length > textInput.length) {
        const addedCount = newValue.length - textInput.length;
        for (let i = 0; i < addedCount; i++) {
          charTimestamps.current.push(now);
        }
      } else if (newValue.length < textInput.length) {
        charTimestamps.current = charTimestamps.current.slice(0, newValue.length);
      }

      setTextInput(newValue);

      if (newValue.endsWith(' ')) {
        const word = newValue.trim().toLowerCase();

        if (word === lastProcessedInput.current) return;
        lastProcessedInput.current = word;

        const inputChars = new Set(word.split(''));
        const rawCharsMatch =
          word.length === expectedChars.size &&
          [...expectedChars].every((c) => inputChars.has(c));
        const chordedWordMatch = validChordedWords.has(word);

        if (rawCharsMatch || chordedWordMatch) {
          handleCorrect();
        } else {
          setTextInput('');
          charTimestamps.current = [];
          lastProcessedInput.current = '';
        }
      }
    },
    [phase, textInput, expectedChars, validChordedWords, handleCorrect]
  );

  // Start the game
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

  // Handle Enter key in boss mode selection
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

  // Handle Enter key on boss game over
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

  // Listen for simultaneous presses
  useEffect(() => {
    const unsubscribe = inputService.onSimultaneousPress(handleSimultaneousPress);
    return unsubscribe;
  }, [inputService, handleSimultaneousPress]);

  // Process key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (currentItem?.type === 'finger' || currentItem?.type === 'character') &&
        e.key.length === 1
      ) {
        handleSingleKeyPress(e.key);
        return;
      }
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

  // Timeout handler ref
  const handleTimeoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    handleTimeoutRef.current = () => {
      if (bossMode) {
        handleBossMistake('timeout');
      } else {
        endGame('timeout');
      }
    };
  }, [bossMode, handleBossMistake, endGame]);

  // Timer for current item
  useEffect(() => {
    if (phase !== 'playing') return;

    isProcessingRef.current = false;
    startTimeRef.current = Date.now();
    setTimeRemaining(settings.timeLimitMs);
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

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

  return {
    // State
    phase,
    difficulty,
    countdownValue,
    score,
    currentIndex,
    feedback,
    isNewHighScore,
    timeRemaining,
    lives,
    bossItemsCompleted,

    // Derived data
    items,
    currentItem,
    settings,
    highScore,
    expectedChars,
    validChordedWords,
    totalBossItems,

    // Input state
    textInput,
    inputRef,

    // Actions
    startGame,
    setPhase,
    handleTextInputChange,
  };
}

/**
 * Input Service
 *
 * Handles keyboard input detection and chord recognition.
 */

import {
  FingerId,
  Direction,
  Chord,
  Word,
} from '../domain';
import { ICharacterRepository, IFingerRepository } from '../data/repositories';

/**
 * Input event representing a key press or release.
 */
export interface InputEvent {
  char: string;
  fingerId: FingerId | null;
  direction: Direction | null;
  timestamp: number;
  type: 'keydown' | 'keyup';
}

/**
 * Result of chord detection.
 */
export interface ChordResult {
  status: 'incomplete' | 'correct' | 'incorrect';
  matchedWord: Word | null;
  inputChord: Chord | null;
  errorPosition?: number;
}

/**
 * Simultaneous press event detail.
 */
export interface SimultaneousPressEvent {
  keys: string[];
  timestamp: number;
}

/**
 * Key press record for timing analysis.
 */
interface KeyPressRecord {
  key: string;
  timestamp: number;
}

/**
 * Threshold in ms for detecting simultaneous key presses.
 * Keys pressed within this window are considered simultaneous.
 */
export const SIMULTANEOUS_THRESHOLD_MS = 50;

/**
 * Maximum duration in ms for all characters to be considered a chord.
 * A true chord from CharaChorder outputs all characters almost instantly.
 * Fast typing still has measurable delays between keystrokes.
 */
export const CHORD_MAX_DURATION_MS = 30;

/**
 * Analyzes keystroke timestamps to determine if input was a chord.
 * This is a pure function that can be used without InputService.
 *
 * @param timestamps - Array of timestamps (ms) for each character input
 * @param input - The full input string (should end with space for chord)
 * @param maxDurationMs - Maximum duration for chord detection (default: CHORD_MAX_DURATION_MS)
 * @returns Analysis result indicating if input was a chord
 */
export function analyzeChordInput(
  timestamps: number[],
  input: string,
  maxDurationMs: number = CHORD_MAX_DURATION_MS
): ChordInputAnalysis {
  const hasTrailingSpace = input.length > 0 && input[input.length - 1] === ' ';
  const text = input.trim();

  // Calculate duration from first to last character (excluding trailing space)
  let durationMs = 0;
  if (timestamps.length >= 2) {
    durationMs = timestamps[timestamps.length - 1] - timestamps[0];
  }

  // A chord must:
  // 1. Have a trailing space (CharaChorder completion signal)
  // 2. All characters typed within the threshold
  const isChord = hasTrailingSpace && durationMs <= maxDurationMs;

  return {
    isChord,
    durationMs,
    text,
    hasTrailingSpace,
    timestamps: [...timestamps],
  };
}

/**
 * Result of analyzing whether input was a chord or typed.
 */
export interface ChordInputAnalysis {
  /** Whether the input appears to be a chord (all chars within threshold + trailing space) */
  isChord: boolean;
  /** Time in ms from first to last character (before the trailing space) */
  durationMs: number;
  /** The word/text that was input (without trailing space) */
  text: string;
  /** Whether input ended with a trailing space */
  hasTrailingSpace: boolean;
  /** Timestamps of each character input */
  timestamps: number[];
}

/**
 * Interface for input service operations.
 */
export interface IInputService {
  // Input processing
  processKeyDown(event: KeyboardEvent): InputEvent | null;
  processKeyUp(event: KeyboardEvent): InputEvent | null;

  // Chord detection
  detectChordCompletion(input: string, expectedWord: Word): ChordResult;
  hasTrailingSpace(input: string): boolean;

  // Input state
  getCurrentlyPressedKeys(): string[];
  getActiveFingers(): FingerId[];
  clearPressedKeys(): void;

  // Timing
  getTimeSinceLastInput(): number;
  resetInputTimer(): void;
  getInputStartTime(): number;

  // Simultaneous press detection
  checkSimultaneousPress(): SimultaneousPressEvent | null;
  getRecentPresses(): KeyPressRecord[];
  onSimultaneousPress(callback: (event: SimultaneousPressEvent) => void): () => void;

  // Chord vs typing detection
  startInputSequence(): void;
  recordCharacterInput(char: string): void;
  analyzeInputSequence(input: string): ChordInputAnalysis;
  clearInputSequence(): void;
}

/**
 * Input service implementation.
 */
export class InputService implements IInputService {
  private characterRepo: ICharacterRepository;
  private fingerRepo: IFingerRepository;
  private pressedKeys: Set<string> = new Set();
  private lastInputTime: number = 0;
  private inputStartTime: number = 0;
  private recentPresses: KeyPressRecord[] = [];
  private simultaneousListeners: Set<(event: SimultaneousPressEvent) => void> = new Set();
  private inputSequenceTimestamps: number[] = [];

  constructor(characterRepo: ICharacterRepository, fingerRepo: IFingerRepository) {
    this.characterRepo = characterRepo;
    this.fingerRepo = fingerRepo;
  }

  // ==================== Input Processing ====================

  processKeyDown(event: KeyboardEvent): InputEvent | null {
    const char = event.key.toLowerCase();

    // Ignore modifier keys and special keys
    if (this.isModifierKey(event) || char.length > 1) {
      // Allow space as it's used for chord completion
      if (char !== ' ') {
        return null;
      }
    }

    // Track pressed keys
    if (!this.pressedKeys.has(char)) {
      this.pressedKeys.add(char);
    }

    // Update timing
    const now = Date.now();
    if (this.inputStartTime === 0) {
      this.inputStartTime = now;
    }
    this.lastInputTime = now;

    // Track for simultaneous press detection
    this.recentPresses.push({ key: char, timestamp: now });

    // Clean old presses (keep only within 2x threshold)
    this.recentPresses = this.recentPresses.filter(
      (p) => now - p.timestamp < SIMULTANEOUS_THRESHOLD_MS * 2
    );

    // Check for simultaneous press
    const simultaneous = this.checkSimultaneousPress();
    if (simultaneous && simultaneous.keys.length >= 2) {
      this.emitSimultaneousPress(simultaneous);
    }

    // Find finger and direction for this character
    const charInfo = this.characterRepo.getByChar(char);

    return {
      char,
      fingerId: charInfo?.fingerId ?? null,
      direction: charInfo?.direction ?? null,
      timestamp: now,
      type: 'keydown',
    };
  }

  processKeyUp(event: KeyboardEvent): InputEvent | null {
    const char = event.key.toLowerCase();

    // Ignore modifier keys
    if (this.isModifierKey(event)) {
      return null;
    }

    // Remove from pressed keys
    this.pressedKeys.delete(char);

    const charInfo = this.characterRepo.getByChar(char);

    return {
      char,
      fingerId: charInfo?.fingerId ?? null,
      direction: charInfo?.direction ?? null,
      timestamp: Date.now(),
      type: 'keyup',
    };
  }

  private isModifierKey(event: KeyboardEvent): boolean {
    return (
      event.key === 'Shift' ||
      event.key === 'Control' ||
      event.key === 'Alt' ||
      event.key === 'Meta' ||
      event.key === 'CapsLock' ||
      event.key === 'Tab' ||
      event.key === 'Escape'
    );
  }

  // ==================== Chord Detection ====================

  detectChordCompletion(input: string, expectedWord: Word): ChordResult {
    // Check for trailing space (CharaChorder completion signal)
    const hasSpace = this.hasTrailingSpace(input);
    const cleanInput = input.trim();

    if (!hasSpace && cleanInput.length < expectedWord.word.length) {
      return {
        status: 'incomplete',
        matchedWord: null,
        inputChord: null,
      };
    }

    // Build chord from input
    const inputChord = this.buildChordFromInput(cleanInput);

    // Check if it matches the expected word
    const isCorrect = cleanInput.toLowerCase() === expectedWord.word.toLowerCase();

    if (isCorrect) {
      return {
        status: 'correct',
        matchedWord: expectedWord,
        inputChord,
      };
    }

    // Find error position
    const errorPosition = this.findErrorPosition(cleanInput, expectedWord.word);

    return {
      status: 'incorrect',
      matchedWord: null,
      inputChord,
      errorPosition,
    };
  }

  hasTrailingSpace(input: string): boolean {
    return input.length > 0 && input[input.length - 1] === ' ';
  }

  private buildChordFromInput(input: string): Chord | null {
    if (!input) return null;

    const fingerIds: FingerId[] = [];
    const colors: string[] = [];

    for (const char of input.toLowerCase()) {
      const charInfo = this.characterRepo.getByChar(char);
      if (charInfo && !fingerIds.includes(charInfo.fingerId)) {
        fingerIds.push(charInfo.fingerId);
        const finger = this.fingerRepo.getById(charInfo.fingerId);
        if (finger) {
          colors.push(finger.color.base);
        }
      }
    }

    if (fingerIds.length === 0) return null;

    return Chord.createFromFingerIds(fingerIds, colors);
  }

  private findErrorPosition(input: string, expected: string): number {
    const inputLower = input.toLowerCase();
    const expectedLower = expected.toLowerCase();

    for (let i = 0; i < Math.max(inputLower.length, expectedLower.length); i++) {
      if (inputLower[i] !== expectedLower[i]) {
        return i;
      }
    }

    return input.length;
  }

  // ==================== Input State ====================

  getCurrentlyPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }

  getActiveFingers(): FingerId[] {
    const fingers: FingerId[] = [];

    for (const key of this.pressedKeys) {
      const charInfo = this.characterRepo.getByChar(key);
      if (charInfo && !fingers.includes(charInfo.fingerId)) {
        fingers.push(charInfo.fingerId);
      }
    }

    return fingers;
  }

  clearPressedKeys(): void {
    this.pressedKeys.clear();
  }

  // ==================== Timing ====================

  getTimeSinceLastInput(): number {
    if (this.lastInputTime === 0) return 0;
    return Date.now() - this.lastInputTime;
  }

  resetInputTimer(): void {
    this.lastInputTime = 0;
    this.inputStartTime = 0;
  }

  getInputStartTime(): number {
    return this.inputStartTime;
  }

  // ==================== Simultaneous Press Detection ====================

  checkSimultaneousPress(): SimultaneousPressEvent | null {
    const now = Date.now();

    // Find all keys pressed within the threshold
    const simultaneousKeys = this.recentPresses
      .filter((p) => now - p.timestamp <= SIMULTANEOUS_THRESHOLD_MS)
      .map((p) => p.key);

    // Remove duplicates
    const uniqueKeys = [...new Set(simultaneousKeys)];

    if (uniqueKeys.length >= 2) {
      return {
        keys: uniqueKeys,
        timestamp: now,
      };
    }

    return null;
  }

  getRecentPresses(): KeyPressRecord[] {
    return [...this.recentPresses];
  }

  onSimultaneousPress(
    callback: (event: SimultaneousPressEvent) => void
  ): () => void {
    this.simultaneousListeners.add(callback);
    return () => {
      this.simultaneousListeners.delete(callback);
    };
  }

  private emitSimultaneousPress(event: SimultaneousPressEvent): void {
    for (const listener of this.simultaneousListeners) {
      listener(event);
    }

    // Also emit as a DOM event for components that prefer that pattern
    window.dispatchEvent(
      new CustomEvent('simultaneousPress', {
        detail: event,
      })
    );
  }

  // ==================== Chord vs Typing Detection ====================

  /**
   * Start tracking a new input sequence.
   * Call this when the user starts typing a new word.
   */
  startInputSequence(): void {
    this.inputSequenceTimestamps = [];
  }

  /**
   * Record a character input with its timestamp.
   * Call this for each character as it's typed.
   */
  recordCharacterInput(char: string): void {
    // Don't record the trailing space in the sequence
    if (char !== ' ') {
      this.inputSequenceTimestamps.push(Date.now());
    }
  }

  /**
   * Analyze whether the current input sequence was a chord or typed.
   * A chord is detected when:
   * 1. All characters appear within CHORD_MAX_DURATION_MS
   * 2. The input ends with a trailing space
   */
  analyzeInputSequence(input: string): ChordInputAnalysis {
    const hasTrailingSpace = this.hasTrailingSpace(input);
    const text = input.trim();
    const timestamps = [...this.inputSequenceTimestamps];

    // Calculate duration from first to last character
    let durationMs = 0;
    if (timestamps.length >= 2) {
      durationMs = timestamps[timestamps.length - 1] - timestamps[0];
    }

    // A chord must:
    // 1. Have a trailing space (CharaChorder completion signal)
    // 2. All characters typed within the threshold
    const isChord = hasTrailingSpace && durationMs <= CHORD_MAX_DURATION_MS;

    return {
      isChord,
      durationMs,
      text,
      hasTrailingSpace,
      timestamps,
    };
  }

  /**
   * Clear the current input sequence.
   */
  clearInputSequence(): void {
    this.inputSequenceTimestamps = [];
  }
}

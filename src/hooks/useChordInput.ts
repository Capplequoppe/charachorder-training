/**
 * useChordInput Hook
 *
 * Unified input handling for chord detection, supporting both:
 * - Regular keyboards (simultaneous key press detection)
 * - CharaChorder devices (word output with trailing space)
 *
 * This hook consolidates the duplicated input handling logic from
 * IntraHandTraining, CrossHandTraining, and WordChordTraining.
 *
 * @module hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInput } from './useServices';
import { CHORD_MAX_DURATION_MS } from '../services/InputService';
import type { SimultaneousPressEvent } from '../services/InputService';

/**
 * Options for useChordInput hook.
 */
export interface UseChordInputOptions {
  /** Set of expected raw characters (e.g., {'o', 'u'} for O+U power chord) */
  expectedChars: ReadonlySet<string>;
  /** Set of valid output words (e.g., {'our', 'ou'} for chorded output) */
  validOutputWords: ReadonlySet<string>;
  /** Called when input matches expected chord */
  onCorrect: (responseTimeMs: number) => void;
  /** Called when input doesn't match (optional - some modes don't penalize wrong input) */
  onIncorrect?: (responseTimeMs: number) => void;
  /** Called when any key is pressed (for audio feedback) */
  onKeyPress?: (char: string) => void;
  /** Whether input processing is enabled */
  enabled: boolean;
  /** Multiplier for chord timing tolerance (default: 2) */
  timingToleranceMultiplier?: number;
}

/**
 * Result returned by useChordInput hook.
 */
export interface UseChordInputResult {
  /** Ref to attach to the text input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Current text input value */
  textInput: string;
  /** Handler for text input change events */
  handleTextInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Reset input state (call when moving to new item) */
  reset: () => void;
  /** Start timing for response time calculation */
  startTiming: () => void;
  /** Get current response time since startTiming was called */
  getResponseTime: () => number;
  /** Focus the input element */
  focusInput: () => void;
}

/**
 * Hook for unified chord input handling.
 *
 * Supports both regular keyboard (simultaneous press) and CharaChorder
 * (word output) input methods with consistent behavior.
 *
 * @example
 * ```tsx
 * const {
 *   inputRef,
 *   textInput,
 *   handleTextInputChange,
 *   reset,
 *   startTiming,
 * } = useChordInput({
 *   expectedChars: new Set(['o', 'u']),
 *   validOutputWords: new Set(['ou', 'our']),
 *   onCorrect: (time) => handleCorrect(time),
 *   onIncorrect: (time) => handleIncorrect(time),
 *   enabled: phase === 'practice',
 * });
 * ```
 */
export function useChordInput(options: UseChordInputOptions): UseChordInputResult {
  const {
    expectedChars,
    validOutputWords,
    onCorrect,
    onIncorrect,
    onKeyPress,
    enabled,
    timingToleranceMultiplier = 2,
  } = options;

  const inputService = useInput();

  // State
  const [textInput, setTextInput] = useState('');

  // Refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const charTimestamps = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  const lastProcessedInput = useRef<string>('');
  const isProcessing = useRef<boolean>(false);
  // Track if backspaces occurred - indicates CharaChorder chord output
  const hadBackspaces = useRef<boolean>(false);
  // Auto-clear timeout ref
  const autoClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Start timing for response time calculation.
   */
  const startTiming = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  /**
   * Get response time since startTiming was called.
   */
  const getResponseTime = useCallback(() => {
    return Date.now() - startTime.current;
  }, []);

  /**
   * Reset all input state.
   */
  const reset = useCallback(() => {
    setTextInput('');
    charTimestamps.current = [];
    lastProcessedInput.current = '';
    isProcessing.current = false;
    hadBackspaces.current = false;
    // Clear any pending auto-clear timeout
    if (autoClearTimeoutRef.current) {
      clearTimeout(autoClearTimeoutRef.current);
      autoClearTimeoutRef.current = null;
    }
    startTiming();
  }, [startTiming]);

  /**
   * Focus the input element.
   */
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Check if input matches expected chord.
   *
   * @param input - The trimmed input string
   * @param durationMs - Time from first to last character
   * @param sawBackspaces - Whether backspaces occurred (CharaChorder chord indicator)
   */
  const isMatch = useCallback(
    (input: string, durationMs: number, sawBackspaces: boolean): boolean => {
      const normalized = input.toLowerCase();
      const maxDuration = CHORD_MAX_DURATION_MS * timingToleranceMultiplier;

      // Check raw character match (e.g., "ou" for O+U)
      const rawCharsMatch =
        normalized.length === expectedChars.size &&
        [...expectedChars].every((c) => normalized.includes(c.toLowerCase()));

      // Check chorded word match (e.g., "our" from producesWords)
      const chordedWordMatch = validOutputWords.has(normalized);

      // Timing is considered "chord-like" if:
      // 1. All chars typed within threshold, OR
      // 2. Short input (2 chars), OR
      // 3. Backspaces occurred (CharaChorder chord pattern: type chars, backspace, output word)
      const isChordTiming =
        durationMs <= maxDuration ||
        normalized.length <= 2 ||
        sawBackspaces;

      const result = (rawCharsMatch || chordedWordMatch) && isChordTiming;

      // Debug logging
      if (import.meta.env.DEV) {
        console.log('[useChordInput] isMatch check:', {
          input: normalized,
          expectedChars: [...expectedChars],
          validOutputWords: [...validOutputWords],
          rawCharsMatch,
          chordedWordMatch,
          durationMs,
          maxDuration,
          sawBackspaces,
          isChordTiming,
          result,
        });
      }

      return result;
    },
    [expectedChars, validOutputWords, timingToleranceMultiplier]
  );

  /**
   * Handle text input change (CharaChorder chord detection).
   */
  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Debug: Log every input change
      if (import.meta.env.DEV) {
        console.log('[useChordInput] handleTextInputChange called:', {
          newValue: e.target.value,
          enabled,
          isProcessing: isProcessing.current,
          expectedChars: [...expectedChars],
          validOutputWords: [...validOutputWords],
        });
      }

      if (!enabled) return;
      if (isProcessing.current) return;

      const newValue = e.target.value;
      const now = Date.now();

      // Track timestamps for new characters
      if (newValue.length > textInput.length) {
        const addedCount = newValue.length - textInput.length;
        for (let i = 0; i < addedCount; i++) {
          charTimestamps.current.push(now);
        }
      } else if (newValue.length < textInput.length) {
        // Characters were removed (backspace)
        // This is a key indicator of CharaChorder chord output:
        // The device types raw chars, then backspaces, then outputs the chorded word
        hadBackspaces.current = true;
        charTimestamps.current = charTimestamps.current.slice(0, newValue.length);
      }

      setTextInput(newValue);

      // Check if input ends with space (CharaChorder completion signal)
      if (newValue.endsWith(' ')) {
        const word = newValue.trim().toLowerCase();

        // Debug: Log when space is detected
        if (import.meta.env.DEV) {
          console.log('[useChordInput] Space detected, processing word:', {
            word,
            lastProcessedInput: lastProcessedInput.current,
            hadBackspaces: hadBackspaces.current,
          });
        }

        // Avoid processing the same input twice
        if (word === lastProcessedInput.current) {
          if (import.meta.env.DEV) {
            console.log('[useChordInput] Skipping - already processed this word');
          }
          return;
        }
        lastProcessedInput.current = word;

        const responseTimeMs = getResponseTime();

        // Calculate input duration (for chord vs typing detection)
        let durationMs = 0;
        const timestamps = charTimestamps.current;
        if (timestamps.length >= 2) {
          durationMs = timestamps[timestamps.length - 1] - timestamps[0];
        }

        // Capture backspace state before resetting
        const sawBackspaces = hadBackspaces.current;

        // Prevent simultaneous processing with keyboard handler
        isProcessing.current = true;

        const matched = isMatch(word, durationMs, sawBackspaces);

        // Debug: Log the match result
        if (import.meta.env.DEV) {
          console.log('[useChordInput] isMatch result:', {
            word,
            matched,
            responseTimeMs,
          });
        }

        if (matched) {
          onCorrect(responseTimeMs);
          // Reset input after successful match
          setTextInput('');
          charTimestamps.current = [];
          lastProcessedInput.current = '';  // Clear dedup check for next input
          startTiming();
        } else if (word.length > 0 && onIncorrect) {
          onIncorrect(responseTimeMs);
          // Reset input after incorrect attempt too
          setTextInput('');
          charTimestamps.current = [];
          lastProcessedInput.current = '';  // Clear dedup check for next input
          startTiming();
        }

        // Reset backspace tracking after processing
        hadBackspaces.current = false;

        // Reset processing flag after state updates settle
        setTimeout(() => {
          isProcessing.current = false;
        }, 100);
      }
    },
    [enabled, textInput, getResponseTime, isMatch, onCorrect, onIncorrect, startTiming]
  );

  /**
   * Handle simultaneous key press (raw keyboard detection).
   * Only used for 2-key power chords on regular keyboards.
   */
  const handleSimultaneousPress = useCallback(
    (event: SimultaneousPressEvent) => {
      if (!enabled) return;
      if (isProcessing.current) return;

      // Only use simultaneous press detection for 2-key power chords
      // For words (3+ keys), we rely entirely on the text input handler
      if (expectedChars.size !== 2) {
        return;
      }

      const pressedKeys = event.keys.map((k) => k.toLowerCase());
      const pressedSet = new Set(pressedKeys);

      // Only process if exactly 2 single-letter keys were pressed
      // This avoids false negatives from CharaChorder word output
      const isTwoKeyPress =
        pressedKeys.length === 2 &&
        pressedKeys.every((k) => k.length === 1 && /[a-z]/.test(k));

      if (!isTwoKeyPress) {
        // More than 2 keys or non-letter keys - likely CharaChorder output
        // Let the text input handler deal with this
        return;
      }

      // Prevent simultaneous processing with text input handler
      isProcessing.current = true;

      const responseTimeMs = getResponseTime();

      // Check if the pressed keys match the expected power chord
      const keysMatch = [...expectedChars].every((c) => pressedSet.has(c.toLowerCase()));

      if (keysMatch) {
        onCorrect(responseTimeMs);
        // Reset input state for next chord
        setTextInput('');
        charTimestamps.current = [];
        lastProcessedInput.current = '';
        startTiming();
      } else if (onIncorrect) {
        // Only mark incorrect for deliberate 2-key presses that don't match
        onIncorrect(responseTimeMs);
        // Reset input state for retry
        setTextInput('');
        charTimestamps.current = [];
        lastProcessedInput.current = '';
        startTiming();
      }

      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessing.current = false;
      }, 100);
    },
    [enabled, expectedChars, getResponseTime, onCorrect, onIncorrect]
  );

  // Subscribe to simultaneous press events
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = inputService.onSimultaneousPress(handleSimultaneousPress);
    return unsubscribe;
  }, [inputService, handleSimultaneousPress, enabled]);

  // Handle global keydown/keyup events to enable simultaneous key detection
  // This is necessary because the input service needs to track all key presses
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process if user is in another input field
      if (document.activeElement !== inputRef.current &&
          document.activeElement?.tagName === 'INPUT') {
        return;
      }

      // Play audio feedback for single letter keys
      if (onKeyPress && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        onKeyPress(e.key.toLowerCase());
      }

      inputService.processKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      inputService.processKeyUp(e);

      // Auto-clear text input after 1 second of no activity
      // This helps when user doesn't press keys simultaneously enough
      if (autoClearTimeoutRef.current) {
        clearTimeout(autoClearTimeoutRef.current);
      }
      autoClearTimeoutRef.current = setTimeout(() => {
        // Only clear if there's content and we're not processing
        if (!isProcessing.current) {
          setTextInput('');
          charTimestamps.current = [];
          hadBackspaces.current = false;
        }
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clear timeout on cleanup
      if (autoClearTimeoutRef.current) {
        clearTimeout(autoClearTimeoutRef.current);
      }
    };
  }, [inputService, enabled, onKeyPress]);

  // Auto-focus input when enabled becomes true
  // Use an interval to keep trying until the input is available and focused
  useEffect(() => {
    if (!enabled) return;

    let attempts = 0;
    const maxAttempts = 20; // Try for up to 1 second

    const tryFocus = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Verify focus was successful
        if (document.activeElement === inputRef.current) {
          if (import.meta.env.DEV) {
            console.log('[useChordInput] Input focused successfully', {
              expectedChars: [...expectedChars],
              validOutputWords: [...validOutputWords],
            });
          }
          return true;
        }
      }
      return false;
    };

    // Try immediately
    if (tryFocus()) return;

    // Keep trying with interval
    const intervalId = setInterval(() => {
      attempts++;
      if (tryFocus()) {
        clearInterval(intervalId);
      } else if (attempts >= maxAttempts) {
        if (import.meta.env.DEV) {
          console.warn('[useChordInput] Failed to focus input after', maxAttempts, 'attempts');
        }
        clearInterval(intervalId);
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [enabled, expectedChars, validOutputWords]);

  return {
    inputRef,
    textInput,
    handleTextInputChange,
    reset,
    startTiming,
    getResponseTime,
    focusInput,
  };
}

/**
 * Chord Detection Utilities
 *
 * Heuristics for detecting whether a word was typed using a chord
 * or sequential keystrokes, based on input patterns.
 */

/**
 * Result of chord usage detection.
 */
export interface ChordUsageResult {
  /** Whether a chord was likely used */
  usedChord: boolean;
  /** Detected typing pattern */
  typingPattern: 'chord' | 'sequential' | 'unknown';
  /** Confidence level (0-1) */
  confidence: number;
  /** Explanation of the detection */
  reason: string;
}

/**
 * Input event for tracking keystroke timing.
 */
export interface KeystrokeEvent {
  /** Character entered */
  char: string;
  /** Timestamp of keystroke */
  timestamp: number;
}

/**
 * Threshold for considering keystrokes as simultaneous (ms).
 * CharaChorder chords typically output all characters within 50ms.
 */
export const CHORD_THRESHOLD_MS = 80;

/**
 * Threshold for typical sequential typing (ms per character).
 * Average typist is ~200ms between keystrokes.
 */
export const SEQUENTIAL_THRESHOLD_MS = 100;

/**
 * Detect chord usage based on raw input timing.
 *
 * CharaChorder outputs the entire word virtually instantly (< 50ms),
 * while sequential typing shows characters appearing over time.
 */
export function detectChordUsage(
  word: string,
  rawInput: string,
  inputDurationMs?: number
): ChordUsageResult {
  // Basic heuristic: If word appeared with trailing space instantly
  const isInstantOutput = rawInput === word + ' ' || rawInput === word;

  // If we have timing information, use it
  if (inputDurationMs !== undefined) {
    if (inputDurationMs < CHORD_THRESHOLD_MS) {
      return {
        usedChord: true,
        typingPattern: 'chord',
        confidence: 0.95,
        reason: `Input appeared in ${inputDurationMs}ms (< ${CHORD_THRESHOLD_MS}ms threshold)`,
      };
    }

    // Calculate expected sequential time
    const expectedSequentialMs = word.length * SEQUENTIAL_THRESHOLD_MS;
    const sequentialRatio = inputDurationMs / expectedSequentialMs;

    if (sequentialRatio < 0.3) {
      return {
        usedChord: true,
        typingPattern: 'chord',
        confidence: 0.85,
        reason: `Input was ${Math.round(sequentialRatio * 100)}% of expected sequential time`,
      };
    }

    return {
      usedChord: false,
      typingPattern: 'sequential',
      confidence: 0.8,
      reason: `Input duration ${inputDurationMs}ms suggests sequential typing`,
    };
  }

  // Without timing, use heuristics
  if (isInstantOutput) {
    return {
      usedChord: true,
      typingPattern: 'chord',
      confidence: 0.7,
      reason: 'Word appeared with immediate space (likely chord)',
    };
  }

  return {
    usedChord: false,
    typingPattern: 'unknown',
    confidence: 0.5,
    reason: 'Unable to determine typing pattern without timing data',
  };
}

/**
 * Detect chord usage from keystroke events.
 *
 * Analyzes the timing between keystrokes to determine
 * if they were pressed simultaneously (chord) or sequentially.
 */
export function detectChordFromEvents(events: KeystrokeEvent[]): ChordUsageResult {
  if (events.length === 0) {
    return {
      usedChord: false,
      typingPattern: 'unknown',
      confidence: 0,
      reason: 'No keystroke events to analyze',
    };
  }

  if (events.length === 1) {
    return {
      usedChord: false,
      typingPattern: 'sequential',
      confidence: 0.9,
      reason: 'Single character - sequential by definition',
    };
  }

  // Calculate total duration
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const firstTimestamp = sortedEvents[0].timestamp;
  const lastTimestamp = sortedEvents[sortedEvents.length - 1].timestamp;
  const totalDuration = lastTimestamp - firstTimestamp;

  // All characters within chord threshold = chord
  if (totalDuration < CHORD_THRESHOLD_MS) {
    return {
      usedChord: true,
      typingPattern: 'chord',
      confidence: 0.95,
      reason: `All ${events.length} characters appeared within ${totalDuration}ms`,
    };
  }

  // Calculate inter-keystroke intervals
  const intervals: number[] = [];
  for (let i = 1; i < sortedEvents.length; i++) {
    intervals.push(sortedEvents[i].timestamp - sortedEvents[i - 1].timestamp);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const maxInterval = Math.max(...intervals);

  // Fast average interval with small gaps = likely chord
  if (avgInterval < CHORD_THRESHOLD_MS / 2 && maxInterval < CHORD_THRESHOLD_MS) {
    return {
      usedChord: true,
      typingPattern: 'chord',
      confidence: 0.85,
      reason: `Average interval ${Math.round(avgInterval)}ms suggests chord input`,
    };
  }

  // Slower intervals = sequential
  if (avgInterval >= SEQUENTIAL_THRESHOLD_MS) {
    return {
      usedChord: false,
      typingPattern: 'sequential',
      confidence: 0.85,
      reason: `Average interval ${Math.round(avgInterval)}ms suggests sequential typing`,
    };
  }

  // Ambiguous range
  return {
    usedChord: false,
    typingPattern: 'unknown',
    confidence: 0.5,
    reason: `Intermediate timing (avg ${Math.round(avgInterval)}ms) is ambiguous`,
  };
}

/**
 * Track keystroke timing for chord detection.
 */
export class ChordDetectionTracker {
  private events: KeystrokeEvent[] = [];
  private startTime: number | null = null;

  /**
   * Start tracking a new word.
   */
  start(): void {
    this.events = [];
    this.startTime = Date.now();
  }

  /**
   * Record a keystroke.
   */
  recordKeystroke(char: string): void {
    if (this.startTime === null) {
      this.start();
    }
    this.events.push({
      char,
      timestamp: Date.now(),
    });
  }

  /**
   * Complete tracking and return detection result.
   */
  complete(): ChordUsageResult {
    if (this.events.length === 0) {
      return {
        usedChord: false,
        typingPattern: 'unknown',
        confidence: 0,
        reason: 'No keystrokes recorded',
      };
    }

    const result = detectChordFromEvents(this.events);
    this.reset();
    return result;
  }

  /**
   * Get the duration since tracking started.
   */
  getDuration(): number {
    if (this.startTime === null) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Get the current keystroke count.
   */
  getKeystrokeCount(): number {
    return this.events.length;
  }

  /**
   * Reset the tracker.
   */
  reset(): void {
    this.events = [];
    this.startTime = null;
  }
}

/**
 * Create a new chord detection tracker instance.
 */
export function createChordDetectionTracker(): ChordDetectionTracker {
  return new ChordDetectionTracker();
}

/**
 * Check if a character is word-ending punctuation.
 */
export function isPunctuation(char: string): boolean {
  return ['.', ',', '!', '?', ';', ':', "'", '"'].includes(char);
}

/**
 * Check if a character is a word boundary.
 */
export function isWordBoundary(char: string): boolean {
  return char === ' ' || isPunctuation(char);
}

/**
 * Normalize input for word comparison.
 * Removes punctuation and normalizes case.
 */
export function normalizeWordInput(input: string): string {
  return input.trim().toLowerCase().replace(/[.,!?;:'"]/g, '');
}

/**
 * Compare typed input to target word.
 */
export function compareWords(typed: string, target: string): boolean {
  const normalizedTyped = normalizeWordInput(typed);
  const normalizedTarget = normalizeWordInput(target);
  return normalizedTyped === normalizedTarget;
}

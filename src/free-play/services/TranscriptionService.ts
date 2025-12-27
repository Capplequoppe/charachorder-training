/**
 * Transcription Service
 *
 * Handles transcription sessions, keystroke tracking, error detection,
 * and analysis for free-form typing practice.
 */

import {
  type TranscriptionText,
  type TranscriptionDifficulty,
  type TranscriptionCategory,
  TRANSCRIPTION_TEXTS,
  getTextsByDifficulty,
  getTextsByCategory,
  getTextById,
} from '../data/static/transcriptionTexts';
import { CHORD_THRESHOLD_MS } from '../utils/chordDetection';

/**
 * Keystroke event for tracking input timing.
 */
export interface KeystrokeEvent {
  /** Key pressed */
  key: string;
  /** Timestamp of the keystroke */
  timestamp: number;
  /** Whether this appears to be part of a chord */
  isChord: boolean;
  /** Keys pressed together (for chord detection) */
  chordKeys?: string[];
}

/**
 * Error in transcription.
 */
export interface TranscriptionError {
  /** Position in text where error occurred */
  position: number;
  /** Expected character */
  expected: string;
  /** Actual character typed */
  actual: string;
  /** When the error occurred */
  timestamp: number;
  /** Whether the error was corrected */
  corrected: boolean;
}

/**
 * Active transcription session.
 */
export interface TranscriptionSession {
  /** Session ID */
  id: string;
  /** Text being transcribed */
  textId: string;
  /** Session start time */
  startTime: Date;
  /** Session end time (null if in progress) */
  endTime: Date | null;
  /** Target text to transcribe */
  targetText: string;
  /** User's typed text */
  typedText: string;
  /** Recorded keystrokes */
  keystrokes: KeystrokeEvent[];
  /** Detected errors */
  errors: TranscriptionError[];
  /** Number of corrections made */
  corrections: number;
}

/**
 * Analysis of a word in the transcription.
 */
export interface WordAnalysis {
  /** Target word */
  word: string;
  /** Typed version */
  typed: string;
  /** Whether it was correct */
  isCorrect: boolean;
  /** Time to type the word in ms */
  responseTimeMs: number;
  /** Whether a chord was used */
  usedChord: boolean;
  /** Typing pattern detected */
  keystrokePattern: 'chord' | 'sequential' | 'hybrid';
}

/**
 * Complete analysis of a transcription session.
 */
export interface TranscriptionAnalysis {
  /** Adjusted WPM (accounting for errors) */
  wpm: number;
  /** Raw WPM before error adjustments */
  rawWpm: number;
  /** Accuracy (0-1) */
  accuracy: number;
  /** Chord usage rate (0-1) */
  chordUsageRate: number;
  /** Errors per minute */
  errorsPerMinute: number;
  /** Correction rate (0-1) */
  correctionRate: number;
  /** Typing consistency score (0-1) */
  consistencyScore: number;
  /** Word-by-word analysis */
  wordAnalysis: WordAnalysis[];
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Total characters typed */
  totalCharacters: number;
  /** Total errors made */
  totalErrors: number;
}

/**
 * Interface for transcription service operations.
 */
export interface ITranscriptionService {
  // Text retrieval
  getAllTexts(): TranscriptionText[];
  getTextsByDifficulty(difficulty: TranscriptionDifficulty): TranscriptionText[];
  getTextsByCategory(category: TranscriptionCategory): TranscriptionText[];
  getTextById(id: string): TranscriptionText | undefined;

  // Session management
  startSession(textId: string): TranscriptionSession;
  getSession(sessionId: string): TranscriptionSession | undefined;
  updateTypedText(sessionId: string, text: string): void;
  recordKeystroke(sessionId: string, event: KeystrokeEvent): void;
  completeSession(sessionId: string): TranscriptionAnalysis;

  // Analysis
  analyzeSession(session: TranscriptionSession): TranscriptionAnalysis;
  countErrors(target: string, typed: string): number;
  calculateWpm(wordCount: number, timeMs: number): number;
  calculateAccuracy(target: string, typed: string): number;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `transcription-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Transcription service implementation.
 */
export class TranscriptionService implements ITranscriptionService {
  private sessions: Map<string, TranscriptionSession>;

  constructor() {
    this.sessions = new Map();
  }

  // ============================================================
  // Text Retrieval
  // ============================================================

  getAllTexts(): TranscriptionText[] {
    return [...TRANSCRIPTION_TEXTS];
  }

  getTextsByDifficulty(difficulty: TranscriptionDifficulty): TranscriptionText[] {
    return getTextsByDifficulty(difficulty);
  }

  getTextsByCategory(category: TranscriptionCategory): TranscriptionText[] {
    return getTextsByCategory(category);
  }

  getTextById(id: string): TranscriptionText | undefined {
    return getTextById(id);
  }

  // ============================================================
  // Session Management
  // ============================================================

  startSession(textId: string): TranscriptionSession {
    const text = this.getTextById(textId);
    if (!text) {
      throw new Error(`Text not found: ${textId}`);
    }

    const session: TranscriptionSession = {
      id: generateSessionId(),
      textId,
      startTime: new Date(),
      endTime: null,
      targetText: text.content,
      typedText: '',
      keystrokes: [],
      errors: [],
      corrections: 0,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): TranscriptionSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateTypedText(sessionId: string, text: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const previousLength = session.typedText.length;
    const newLength = text.length;

    // Detect corrections (backspaces)
    if (newLength < previousLength) {
      session.corrections += previousLength - newLength;
    }

    // Detect new errors
    if (newLength > previousLength) {
      for (let i = previousLength; i < newLength; i++) {
        if (i < session.targetText.length && text[i] !== session.targetText[i]) {
          session.errors.push({
            position: i,
            expected: session.targetText[i],
            actual: text[i],
            timestamp: Date.now(),
            corrected: false,
          });
        }
      }
    }

    session.typedText = text;
  }

  recordKeystroke(sessionId: string, event: KeystrokeEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Analyze if this keystroke is part of a chord
    const recentKeystrokes = session.keystrokes.filter(
      k => event.timestamp - k.timestamp < CHORD_THRESHOLD_MS
    );

    if (recentKeystrokes.length > 0) {
      // This might be a chord
      event.isChord = true;
      event.chordKeys = [...recentKeystrokes.map(k => k.key), event.key];
    }

    session.keystrokes.push(event);
  }

  completeSession(sessionId: string): TranscriptionAnalysis {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.endTime = new Date();
    return this.analyzeSession(session);
  }

  // ============================================================
  // Analysis
  // ============================================================

  analyzeSession(session: TranscriptionSession): TranscriptionAnalysis {
    const totalTimeMs = session.endTime
      ? session.endTime.getTime() - session.startTime.getTime()
      : Date.now() - session.startTime.getTime();

    const minutes = totalTimeMs / 60000;

    // Count words and characters
    const typedWords = session.typedText.split(/\s+/).filter(w => w.length > 0);
    const targetWords = session.targetText.split(/\s+/).filter(w => w.length > 0);

    // Calculate WPM
    const rawWpm = minutes > 0 ? typedWords.length / minutes : 0;

    // Count errors
    const errorCount = this.countErrors(session.targetText, session.typedText);
    const errorsPerMinute = minutes > 0 ? errorCount / minutes : 0;

    // Adjusted WPM (subtract errors)
    const adjustedWordCount = Math.max(0, typedWords.length - errorCount / 5);
    const wpm = minutes > 0 ? adjustedWordCount / minutes : 0;

    // Accuracy
    const accuracy = this.calculateAccuracy(session.targetText, session.typedText);

    // Chord usage
    const chordKeystrokes = session.keystrokes.filter(k => k.isChord).length;
    const chordUsageRate = session.keystrokes.length > 0
      ? chordKeystrokes / session.keystrokes.length
      : 0;

    // Correction rate
    const totalActions = session.typedText.length + session.corrections;
    const correctionRate = totalActions > 0
      ? session.corrections / totalActions
      : 0;

    // Consistency score (based on keystroke timing variance)
    const consistencyScore = this.calculateConsistency(session.keystrokes);

    // Word-by-word analysis
    const wordAnalysis = this.analyzeWords(
      targetWords,
      typedWords,
      session.keystrokes
    );

    return {
      wpm,
      rawWpm,
      accuracy,
      chordUsageRate,
      errorsPerMinute,
      correctionRate,
      consistencyScore,
      wordAnalysis,
      totalTimeMs,
      totalCharacters: session.typedText.length,
      totalErrors: errorCount,
    };
  }

  countErrors(target: string, typed: string): number {
    let errors = 0;
    const minLength = Math.min(target.length, typed.length);

    for (let i = 0; i < minLength; i++) {
      if (target[i] !== typed[i]) errors++;
    }

    // Extra or missing characters count as errors
    errors += Math.abs(target.length - typed.length);

    return errors;
  }

  calculateWpm(wordCount: number, timeMs: number): number {
    const minutes = timeMs / 60000;
    return minutes > 0 ? wordCount / minutes : 0;
  }

  calculateAccuracy(target: string, typed: string): number {
    if (typed.length === 0) return 1;

    const errors = this.countErrors(target, typed);
    const maxLength = Math.max(target.length, typed.length);

    return Math.max(0, (maxLength - errors) / maxLength);
  }

  /**
   * Calculate typing consistency based on keystroke timing.
   */
  private calculateConsistency(keystrokes: KeystrokeEvent[]): number {
    if (keystrokes.length < 2) return 1;

    // Calculate inter-keystroke intervals
    const intervals: number[] = [];
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i - 1].timestamp;
      // Ignore very long pauses (> 2 seconds)
      if (interval < 2000) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) return 1;

    // Calculate variance
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consistency score (lower variance = higher consistency)
    // Normalize to 0-1 range (100ms stddev = 1.0, 500ms stddev = ~0.2)
    const normalizedStdDev = stdDev / mean;
    const consistency = Math.max(0, 1 - normalizedStdDev);

    return consistency;
  }

  /**
   * Analyze words for detailed breakdown.
   */
  private analyzeWords(
    targetWords: string[],
    typedWords: string[],
    keystrokes: KeystrokeEvent[]
  ): WordAnalysis[] {
    const analysis: WordAnalysis[] = [];

    // Simple word-by-word comparison
    const maxWords = Math.max(targetWords.length, typedWords.length);

    for (let i = 0; i < maxWords; i++) {
      const target = targetWords[i] || '';
      const typed = typedWords[i] || '';

      // Estimate response time (rough approximation)
      const avgTimePerWord = keystrokes.length > 0 && typedWords.length > 0
        ? (keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp) / typedWords.length
        : 0;

      // Check for chord usage (simplified)
      const chordKeystrokes = keystrokes.filter(k => k.isChord);
      const usedChord = chordKeystrokes.length > 0 && i < typedWords.length;

      analysis.push({
        word: target,
        typed,
        isCorrect: target.toLowerCase() === typed.toLowerCase(),
        responseTimeMs: avgTimePerWord,
        usedChord,
        keystrokePattern: usedChord ? 'chord' : 'sequential',
      });
    }

    return analysis;
  }
}

// ============================================================
// Singleton instance
// ============================================================

let transcriptionServiceInstance: TranscriptionService | null = null;

/**
 * Get the transcription service singleton.
 */
export function getTranscriptionService(): TranscriptionService {
  if (!transcriptionServiceInstance) {
    transcriptionServiceInstance = new TranscriptionService();
  }
  return transcriptionServiceInstance;
}

/**
 * Reset the transcription service (for testing).
 */
export function resetTranscriptionService(): void {
  transcriptionServiceInstance = null;
}

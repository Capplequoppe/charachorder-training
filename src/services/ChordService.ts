/**
 * Chord Service
 *
 * Handles chord validation, scoring, and analysis.
 */

import {
  Chord,
  Word,
  PowerChord,
  Finger,
  FingerId,
  Hand,
} from '../domain';
import { ICharacterRepository, IWordRepository, IFingerRepository } from '../data/repositories';

/**
 * Score breakdown for a chord attempt.
 */
export interface ChordScore {
  baseScore: number; // 100 for correct
  timeBonus: number; // Up to +50 for speed
  attemptPenalty: number; // -20 per extra attempt
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * Interface for chord service operations.
 */
export interface IChordService {
  // Chord construction
  createChordFromInput(input: string): Chord | null;
  createChordFromFingers(fingerIds: FingerId[]): Chord;

  // Validation
  isValidChord(chord: Chord): boolean;
  matchesWord(chord: Chord, word: Word): boolean;
  matchesPowerChord(chord: Chord, powerChord: PowerChord): boolean;

  // Analysis
  getFingersInChord(chord: Chord): Finger[];
  getHandsUsed(chord: Chord): Hand[];
  isPowerChordSubset(chord: Chord): PowerChord | null;

  // Scoring
  calculateChordScore(
    chord: Chord,
    targetWord: Word,
    timeMs: number,
    attempts: number
  ): ChordScore;

  // Suggestions
  getSuggestedExtensions(powerChord: PowerChord): Word[];
  getSimilarChords(chord: Chord): Chord[];
}

/**
 * Target time for scoring calculations (milliseconds).
 */
const TARGET_TIME_MS = 2000;

/**
 * Chord service implementation.
 */
export class ChordService implements IChordService {
  private characterRepo: ICharacterRepository;
  private wordRepo: IWordRepository;
  private fingerRepo: IFingerRepository;

  constructor(
    characterRepo: ICharacterRepository,
    wordRepo: IWordRepository,
    fingerRepo: IFingerRepository
  ) {
    this.characterRepo = characterRepo;
    this.wordRepo = wordRepo;
    this.fingerRepo = fingerRepo;
  }

  // ==================== Chord Construction ====================

  createChordFromInput(input: string): Chord | null {
    if (!input || input.length === 0) return null;

    const fingerIds: FingerId[] = [];
    const colors: string[] = [];

    for (const char of input.toLowerCase()) {
      const charInfo = this.characterRepo.getByChar(char);
      if (charInfo) {
        // Avoid duplicate fingers
        if (!fingerIds.includes(charInfo.fingerId)) {
          fingerIds.push(charInfo.fingerId);
          const finger = this.fingerRepo.getById(charInfo.fingerId);
          if (finger) {
            colors.push(finger.color.base);
          }
        }
      }
    }

    if (fingerIds.length === 0) return null;

    return Chord.createFromFingerIds(fingerIds, colors);
  }

  createChordFromFingers(fingerIds: FingerId[]): Chord {
    const colors = fingerIds.map((id) => {
      const finger = this.fingerRepo.getById(id);
      return finger?.color.base ?? '#808080';
    });

    return Chord.createFromFingerIds(fingerIds, colors);
  }

  // ==================== Validation ====================

  isValidChord(chord: Chord): boolean {
    // A valid chord has at least one finger
    if (chord.size === 0) return false;

    // All finger IDs must be valid
    return chord.fingerIds.every((id) => this.fingerRepo.getById(id) !== undefined);
  }

  matchesWord(chord: Chord, word: Word): boolean {
    // Check if the chord's fingers match the word's required fingers
    const chordFingers = new Set(chord.fingerIds);
    const wordFingers = new Set(word.chord.fingerIds);

    if (chordFingers.size !== wordFingers.size) return false;

    for (const finger of chordFingers) {
      if (!wordFingers.has(finger)) return false;
    }

    return true;
  }

  matchesPowerChord(chord: Chord, powerChord: PowerChord): boolean {
    // Power chord must have exactly 2 fingers
    if (chord.size !== 2) return false;

    const chordFingers = new Set(chord.fingerIds);
    // Check that all power chord fingers are in the chord
    return powerChord.fingerIds.every((id) => chordFingers.has(id));
  }

  // ==================== Analysis ====================

  getFingersInChord(chord: Chord): Finger[] {
    return chord.fingerIds
      .map((id) => this.fingerRepo.getById(id))
      .filter((f): f is Finger => f !== undefined);
  }

  getHandsUsed(chord: Chord): Hand[] {
    const fingers = this.getFingersInChord(chord);
    const hands = new Set<Hand>();

    for (const finger of fingers) {
      hands.add(finger.hand);
    }

    return Array.from(hands);
  }

  isPowerChordSubset(chord: Chord): PowerChord | null {
    // Check if the chord contains exactly a power chord (2 specific fingers)
    if (chord.size !== 2) return null;

    // This would need access to PowerChordRepository
    // For now, return null - would need to be enhanced with power chord repo
    return null;
  }

  // ==================== Scoring ====================

  calculateChordScore(
    chord: Chord,
    targetWord: Word,
    timeMs: number,
    attempts: number
  ): ChordScore {
    // Base score for correctness
    const isCorrect = this.matchesWord(chord, targetWord);
    const baseScore = isCorrect ? 100 : 0;

    // Time bonus: up to +50 for fast responses
    let timeBonus = 0;
    if (isCorrect && timeMs < TARGET_TIME_MS) {
      // Linear scaling: faster = more bonus
      timeBonus = Math.round(50 * (1 - timeMs / TARGET_TIME_MS));
    }

    // Attempt penalty: -20 per extra attempt
    const attemptPenalty = Math.max(0, (attempts - 1) * 20);

    // Calculate total
    const totalScore = Math.max(0, baseScore + timeBonus - attemptPenalty);

    // Determine grade
    const grade = this.calculateGrade(totalScore, isCorrect);

    return {
      baseScore,
      timeBonus,
      attemptPenalty,
      totalScore,
      grade,
    };
  }

  private calculateGrade(
    score: number,
    isCorrect: boolean
  ): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (!isCorrect) return 'F';
    if (score >= 140) return 'S';
    if (score >= 120) return 'A';
    if (score >= 100) return 'B';
    if (score >= 80) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ==================== Suggestions ====================

  getSuggestedExtensions(powerChord: PowerChord): Word[] {
    // Find words that contain this power chord as a base
    const allWords = this.wordRepo.getAll();

    return allWords.filter((word) => {
      const wordFingers = new Set(word.chord.fingerIds);
      // Check that all power chord fingers are in the word's chord
      const hasPowerChordFingers = powerChord.fingerIds.every((id) => wordFingers.has(id));
      return hasPowerChordFingers && wordFingers.size > powerChord.fingerIds.length; // Must have additional fingers
    });
  }

  getSimilarChords(chord: Chord): Chord[] {
    // Find chords that differ by one finger
    const similar: Chord[] = [];
    const allWords = this.wordRepo.getAll();
    const chordFingers = new Set(chord.fingerIds);

    for (const word of allWords) {
      const wordFingers = new Set(word.chord.fingerIds);

      // Check if they differ by exactly one finger
      const intersection = new Set(
        [...chordFingers].filter((x) => wordFingers.has(x))
      );

      const difference =
        chordFingers.size + wordFingers.size - 2 * intersection.size;

      if (difference === 2) {
        // One added, one removed = 2 differences
        similar.push(word.chord);
      }
    }

    return similar.slice(0, 5); // Return top 5
  }
}

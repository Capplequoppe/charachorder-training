/**
 * Song Generator Service
 *
 * Algorithmically generates songs from word groups by musical root.
 * Creates chord progressions and assigns words that match each root.
 */

import {
  type SongConfig,
  type SongSection,
  type Measure,
  type Beat,
  type BeatItem,
  type SongDifficulty,
  WORDS_BY_ROOT,
  MUSICAL_ROOTS,
  PROGRESSIONS,
  type ProgressionName,
  BPM_RANGES,
  createBeatItem,
} from '@/data/static/songConfig';
import { DRUM_PATTERNS } from '@/data/static/drumPatterns';
import { BASS_PATTERNS } from '@/data/static/bassPatterns';

// ==================== Types ====================

export interface SongGenerationOptions {
  title?: string;
  difficulty?: SongDifficulty;
  bpm?: number;
  measureCount?: number;
  progressionStyle?: ProgressionName | 'random';
  drumPattern?: string;
  bassPattern?: string;
  padEnabled?: boolean;
  wordPool?: string[]; // Custom words to use
}

export interface ISongGeneratorService {
  generateSong(options?: SongGenerationOptions): SongConfig;
  generateRandomSong(): SongConfig;
  generateSongFromWords(words: string[], difficulty?: SongDifficulty): SongConfig;
}

// ==================== Word-to-Root Mapping ====================

// Reverse mapping: word -> root
const WORD_TO_ROOT = new Map<string, number>();

for (const [root, words] of Object.entries(WORDS_BY_ROOT)) {
  const rootNum = parseInt(root, 10);
  for (const word of words) {
    WORD_TO_ROOT.set(word.toLowerCase(), rootNum);
  }
}

// Get all available words grouped by root
function getWordsByRoot(): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const [root, words] of Object.entries(WORDS_BY_ROOT)) {
    map.set(parseInt(root, 10), [...words]);
  }
  return map;
}

// ==================== Implementation ====================

export class SongGeneratorService implements ISongGeneratorService {
  private usedWords = new Set<string>();

  /**
   * Generate a song with optional configuration.
   */
  generateSong(options: SongGenerationOptions = {}): SongConfig {
    const difficulty = options.difficulty ?? this.randomDifficulty();
    const bpm = options.bpm ?? this.randomBpmForDifficulty(difficulty);
    const measureCount = options.measureCount ?? this.measureCountForDifficulty(difficulty);
    const progressionStyle = options.progressionStyle ?? 'random';
    const drumPattern = options.drumPattern ?? this.drumPatternForDifficulty(difficulty);
    const bassPattern = options.bassPattern ?? this.bassPatternForDifficulty(difficulty);
    const padEnabled = options.padEnabled ?? true;

    // Reset used words for fresh generation
    this.usedWords.clear();

    // Generate sections
    const sections = this.generateSections(measureCount, progressionStyle, options.wordPool);

    // Generate title if not provided
    const title = options.title ?? this.generateTitle(sections);

    const song: SongConfig = {
      id: `generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      artist: 'Generated',
      description: `Auto-generated ${difficulty} song at ${bpm} BPM`,
      difficulty,
      bpm,
      timeSignature: [4, 4],
      beatsPerMeasure: 4,
      key: 'Em',
      drumPattern,
      bassPattern,
      padEnabled,
      isPrecomposed: false,
      sections,
    };

    return song;
  }

  /**
   * Generate a random song with all defaults.
   */
  generateRandomSong(): SongConfig {
    return this.generateSong();
  }

  /**
   * Generate a song using specific words.
   */
  generateSongFromWords(words: string[], difficulty: SongDifficulty = 'intermediate'): SongConfig {
    return this.generateSong({
      difficulty,
      wordPool: words,
    });
  }

  // ==================== Section Generation ====================

  private generateSections(
    totalMeasures: number,
    progressionStyle: ProgressionName | 'random',
    wordPool?: string[]
  ): SongSection[] {
    const sections: SongSection[] = [];

    // Split into verse and chorus
    const verseMeasures = Math.ceil(totalMeasures * 0.6);
    const chorusMeasures = totalMeasures - verseMeasures;

    // Generate verse
    const verseProgression = this.getProgression(progressionStyle === 'random' ? 'verse' : progressionStyle);
    sections.push({
      name: 'verse',
      measures: this.generateMeasures(verseMeasures, verseProgression, wordPool),
    });

    // Generate chorus
    const chorusProgression = this.getProgression(progressionStyle === 'random' ? 'chorus' : progressionStyle);
    sections.push({
      name: 'chorus',
      repeatCount: 2,
      measures: this.generateMeasures(chorusMeasures, chorusProgression, wordPool),
    });

    return sections;
  }

  private generateMeasures(
    count: number,
    progression: readonly number[],
    wordPool?: string[]
  ): Measure[] {
    const measures: Measure[] = [];
    const wordsByRoot = wordPool ? this.groupWordsByRoot(wordPool) : getWordsByRoot();

    for (let m = 0; m < count; m++) {
      const beats: Beat[] = [];

      for (let b = 0; b < 4; b++) {
        // Get root from progression (cycle through)
        const progressionIndex = (m * 4 + b) % progression.length;
        const root = progression[progressionIndex];

        // Get a word for this root
        const word = this.pickWordForRoot(root, wordsByRoot);

        beats.push({
          position: b + 1,
          items: [
            word
              ? { ...createBeatItem(word, root), musicalRoot: root }
              : { ...createBeatItem(''), isRest: true },
          ],
        });
      }

      measures.push({ beats });
    }

    return measures;
  }

  private pickWordForRoot(root: number, wordsByRoot: Map<number, string[]>): string | null {
    const wordsForRoot = wordsByRoot.get(root);

    if (!wordsForRoot || wordsForRoot.length === 0) {
      // Fall back to any available word
      for (const words of wordsByRoot.values()) {
        if (words.length > 0) {
          const word = words[Math.floor(Math.random() * words.length)];
          if (!this.usedWords.has(word)) {
            this.usedWords.add(word);
            return word;
          }
        }
      }
      return null;
    }

    // Prefer unused words
    const unusedWords = wordsForRoot.filter((w) => !this.usedWords.has(w));
    const pool = unusedWords.length > 0 ? unusedWords : wordsForRoot;

    // Randomly select
    const word = pool[Math.floor(Math.random() * pool.length)];
    this.usedWords.add(word);

    return word;
  }

  private groupWordsByRoot(words: string[]): Map<number, string[]> {
    const grouped = new Map<number, string[]>();

    // Initialize all roots
    for (const root of Object.values(MUSICAL_ROOTS)) {
      grouped.set(root, []);
    }

    for (const word of words) {
      const lowerWord = word.toLowerCase();
      const root = WORD_TO_ROOT.get(lowerWord);

      if (root !== undefined) {
        grouped.get(root)!.push(word);
      } else {
        // Assign to a random root if not mapped
        const randomRoot = Object.values(MUSICAL_ROOTS)[
          Math.floor(Math.random() * Object.values(MUSICAL_ROOTS).length)
        ];
        grouped.get(randomRoot)!.push(word);
      }
    }

    return grouped;
  }

  // ==================== Progression Helpers ====================

  private getProgression(style: ProgressionName): readonly number[] {
    return PROGRESSIONS[style];
  }

  // ==================== Difficulty-based Selection ====================

  private randomDifficulty(): SongDifficulty {
    const difficulties: SongDifficulty[] = ['beginner', 'intermediate', 'advanced'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  private randomBpmForDifficulty(difficulty: SongDifficulty): number {
    const range = BPM_RANGES[difficulty];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private measureCountForDifficulty(difficulty: SongDifficulty): number {
    switch (difficulty) {
      case 'beginner':
        return 8; // 32 beats
      case 'intermediate':
        return 12; // 48 beats
      case 'advanced':
        return 16; // 64 beats
    }
  }

  private drumPatternForDifficulty(difficulty: SongDifficulty): string {
    const patterns: Record<SongDifficulty, string[]> = {
      beginner: ['minimal', 'halftime', 'basic4_4'],
      intermediate: ['basic4_4', 'syncopated', 'fourOnFloor'],
      advanced: ['syncopated', 'fourOnFloor', 'breakbeat'],
    };
    const options = patterns[difficulty];
    return options[Math.floor(Math.random() * options.length)];
  }

  private bassPatternForDifficulty(difficulty: SongDifficulty): string {
    const patterns: Record<SongDifficulty, string[]> = {
      beginner: ['rootNotes', 'sustained', 'rootFifth'],
      intermediate: ['rootFifth', 'eighthNotes', 'walking'],
      advanced: ['walking', 'syncopated', 'octaveJump', 'funky'],
    };
    const options = patterns[difficulty];
    return options[Math.floor(Math.random() * options.length)];
  }

  // ==================== Title Generation ====================

  private generateTitle(sections: SongSection[]): string {
    // Extract a few words from the song to create a title
    const words: string[] = [];

    for (const section of sections) {
      for (const measure of section.measures) {
        for (const beat of measure.beats) {
          for (const item of beat.items) {
            if (!item.isRest && item.word) {
              words.push(item.word);
            }
          }
        }
      }
    }

    if (words.length === 0) {
      return 'Generated Song';
    }

    // Pick 2-3 words for the title
    const titleWords = words
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    return titleWords.join(' ');
  }
}

// ==================== Singleton ====================

let songGeneratorService: SongGeneratorService | null = null;

export function getSongGeneratorService(): SongGeneratorService {
  if (!songGeneratorService) {
    songGeneratorService = new SongGeneratorService();
  }
  return songGeneratorService;
}

export function resetSongGeneratorService(): void {
  songGeneratorService = null;
}

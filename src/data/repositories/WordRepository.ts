/**
 * Repository for accessing words and their chord mappings.
 * Integrates with existing chord data from CSV.
 */

import {
  Word,
  Chord,
  SemanticCategory,
  Character,
} from '../../domain';
import { CHORD_DATA } from '../chords';
import { CharacterRepository } from './CharacterRepository';

/**
 * Interface for word repository operations.
 */
export interface IWordRepository {
  /** Gets all words */
  getAll(): Word[];

  /** Gets a word by its string value */
  getByWord(word: string): Word | undefined;

  /** Gets words up to a certain frequency rank */
  getByRank(maxRank: number): Word[];

  /** Gets words by chord size (number of keys) */
  getByChordSize(size: number): Word[];

  /** Gets words that extend a power chord */
  getByPowerChord(powerChordId: string): Word[];

  /** Gets words by semantic category */
  getByCategory(category: SemanticCategory): Word[];

  /** Searches words by prefix */
  search(query: string): Word[];

  /** Gets the chord for a word */
  getChordForWord(word: string): string | undefined;

  /** Gets all chords that produce a word */
  getChordsForWord(word: string): string[];
}

/**
 * Word repository implementation.
 * Builds Word entities from chord CSV data.
 */
export class WordRepository implements IWordRepository {
  private words: Word[];
  private wordMap: Map<string, Word>;
  private chordToWords: Map<string, string[]>;
  private characterRepo: CharacterRepository;

  constructor(characterRepo?: CharacterRepository) {
    this.characterRepo = characterRepo || new CharacterRepository();
    this.chordToWords = new Map();

    // Build word-to-chords mapping first
    const wordChords = new Map<string, { chords: string[]; rank: number }>();

    for (const entry of CHORD_DATA) {
      const existing = wordChords.get(entry.word);
      if (existing) {
        existing.chords.push(entry.chord);
      } else {
        wordChords.set(entry.word, {
          chords: [entry.chord],
          rank: entry.rank ?? 9999,
        });
      }

      // Build chord-to-words mapping
      const wordList = this.chordToWords.get(entry.chord) || [];
      if (!wordList.includes(entry.word)) {
        wordList.push(entry.word);
        this.chordToWords.set(entry.chord, wordList);
      }
    }

    // Build Word entities
    this.words = [];
    for (const [word, data] of wordChords) {
      const wordEntity = this.buildWord(word, data.chords, data.rank);
      if (wordEntity) {
        this.words.push(wordEntity);
      }
    }

    // Sort by rank
    this.words.sort((a, b) => a.rank - b.rank);

    // Build lookup map
    this.wordMap = new Map(this.words.map((w) => [w.word.toLowerCase(), w]));
  }

  private buildWord(
    word: string,
    chordStrings: string[],
    rank: number
  ): Word | null {
    // Use the shortest chord as primary
    const sortedChords = [...chordStrings].sort((a, b) => a.length - b.length);
    const primaryChordStr = sortedChords[0];

    const primaryChord = this.buildChord(primaryChordStr, rank);
    if (!primaryChord) return null;

    const alternativeChords = sortedChords
      .slice(1)
      .map((c) => this.buildChord(c))
      .filter((c): c is Chord => c !== null);

    const category = this.categorizeWord(word);
    const basedOnPowerChords = this.findBasePowerChords(primaryChordStr);

    return Word.create(
      word,
      primaryChord,
      rank,
      category,
      basedOnPowerChords,
      alternativeChords
    );
  }

  private buildChord(chordStr: string, rank?: number): Chord | null {
    const characters: Character[] = [];
    const noteFrequencies: number[] = [];

    for (const char of chordStr) {
      const character = this.characterRepo.getByChar(char);
      if (!character) {
        // Character not in our layout - skip this chord
        return null;
      }
      characters.push(character);
    }

    return Chord.create(characters, noteFrequencies, rank);
  }

  private categorizeWord(word: string): SemanticCategory {
    // Simple categorization based on common word lists
    const lowerWord = word.toLowerCase();

    const determiners = ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'who', 'whom', 'whose'];
    const prepositions = ['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'of', 'about', 'into', 'through', 'over', 'under'];
    const conjunctions = ['and', 'but', 'or', 'if', 'when', 'because', 'while', 'although', 'unless', 'until', 'after', 'before'];
    const modalVerbs = ['can', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'];
    const timeWords = ['now', 'then', 'before', 'after', 'when', 'always', 'never', 'soon', 'today', 'tomorrow', 'yesterday'];
    const placeWords = ['here', 'there', 'where', 'up', 'down', 'out', 'in', 'back', 'away', 'home'];
    const questionWords = ['who', 'what', 'when', 'where', 'why', 'how', 'which'];

    if (determiners.includes(lowerWord)) return SemanticCategory.DETERMINER;
    if (pronouns.includes(lowerWord)) return SemanticCategory.PRONOUN;
    if (prepositions.includes(lowerWord)) return SemanticCategory.PREPOSITION;
    if (conjunctions.includes(lowerWord)) return SemanticCategory.CONJUNCTION;
    if (modalVerbs.includes(lowerWord)) return SemanticCategory.VERB_MODAL;
    if (timeWords.includes(lowerWord)) return SemanticCategory.TIME;
    if (placeWords.includes(lowerWord)) return SemanticCategory.PLACE;
    if (questionWords.includes(lowerWord)) return SemanticCategory.QUESTION;

    return SemanticCategory.OTHER;
  }

  private findBasePowerChords(chordStr: string): string[] {
    // Find 2-character substrings that are power chords
    const basePowerChords: string[] = [];
    const chars = chordStr.split('');

    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const pair = [chars[i], chars[j]].sort().join('');
        // This would check against power chord config
        // For now, just return common pairs
        if (['th', 'er', 'in', 'en', 'on', 'an', 'st'].includes(pair)) {
          basePowerChords.push(pair);
        }
      }
    }

    return [...new Set(basePowerChords)];
  }

  getAll(): Word[] {
    return [...this.words];
  }

  getByWord(word: string): Word | undefined {
    return this.wordMap.get(word.toLowerCase());
  }

  getByRank(maxRank: number): Word[] {
    return this.words.filter((w) => w.rank <= maxRank);
  }

  getByChordSize(size: number): Word[] {
    return this.words.filter((w) => w.chord.size === size);
  }

  getByPowerChord(powerChordId: string): Word[] {
    return this.words.filter((w) =>
      w.basedOnPowerChords.includes(powerChordId)
    );
  }

  getByCategory(category: SemanticCategory): Word[] {
    return this.words.filter((w) => w.category === category);
  }

  search(query: string): Word[] {
    const lowerQuery = query.toLowerCase();
    return this.words.filter((w) =>
      w.word.toLowerCase().startsWith(lowerQuery)
    );
  }

  getChordForWord(word: string): string | undefined {
    const wordEntity = this.getByWord(word);
    return wordEntity?.chord.id;
  }

  getChordsForWord(word: string): string[] {
    const wordEntity = this.getByWord(word);
    if (!wordEntity) return [];

    return [
      wordEntity.chord.id,
      ...wordEntity.alternativeChords.map((c) => c.id),
    ];
  }
}

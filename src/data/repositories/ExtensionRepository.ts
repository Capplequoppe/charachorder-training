/**
 * Repository for accessing chord extension definitions.
 * Enables the "Lego model" training approach where complex chords
 * are built from simpler power chord foundations.
 */

import {
  CHORD_EXTENSIONS,
  ChordExtension,
  EXTENSIONS_BY_BASE,
  EXTENSION_BY_WORD,
} from '../static/chordExtensions';
import type { SemanticCategory } from '../static/semanticCategories';
import { PowerChordRepository } from './PowerChordRepository';
import { PowerChord } from '../../domain';

/**
 * Interface for extension repository operations.
 */
export interface IExtensionRepository {
  /** Gets all chord extensions */
  getAll(): ChordExtension[];

  /** Gets extensions for a specific base power chord */
  getByBaseChord(baseChordId: string): ChordExtension[];

  /** Gets an extension by its result word */
  getByResultWord(word: string): ChordExtension | undefined;

  /** Gets extensions by semantic category */
  getByCategory(category: SemanticCategory): ChordExtension[];

  /** Gets the extension path to build a word from power chords */
  getExtensionPath(word: string): ExtensionPath | null;

  /** Gets available extensions based on known/mastered power chords */
  getNextExtensions(masteredChordIds: string[]): ChordExtension[];

  /** Gets all unique base chord IDs that have extensions */
  getBaseChordIds(): string[];

  /** Gets extensions sorted by complexity (fewer added chars first) */
  getByComplexity(): ChordExtension[];

  /** Gets the simplest extensions (only 1 added character) */
  getSimpleExtensions(): ChordExtension[];

  /** Checks if a power chord has any extensions */
  hasExtensions(baseChordId: string): boolean;

  /** Gets the count of extensions for a base chord */
  getExtensionCount(baseChordId: string): number;
}

/**
 * Represents the path to build a word from a power chord.
 */
export interface ExtensionPath {
  /** The starting power chord */
  baseChord: PowerChord | null;
  /** The extension data */
  extension: ChordExtension;
  /** Number of steps (characters added) */
  steps: number;
}

/**
 * Extension repository implementation.
 */
export class ExtensionRepository implements IExtensionRepository {
  private extensions: ChordExtension[];
  private powerChordRepo: PowerChordRepository | null;

  constructor(powerChordRepo?: PowerChordRepository) {
    this.extensions = [...CHORD_EXTENSIONS];
    this.powerChordRepo = powerChordRepo ?? null;
  }

  getAll(): ChordExtension[] {
    return [...this.extensions];
  }

  getByBaseChord(baseChordId: string): ChordExtension[] {
    const normalizedId = baseChordId.toLowerCase().split('').sort().join('');
    return EXTENSIONS_BY_BASE.get(normalizedId) || [];
  }

  getByResultWord(word: string): ChordExtension | undefined {
    return EXTENSION_BY_WORD.get(word.toLowerCase());
  }

  getByCategory(category: SemanticCategory): ChordExtension[] {
    return this.extensions.filter((ext) => ext.category === category);
  }

  getExtensionPath(word: string): ExtensionPath | null {
    const extension = this.getByResultWord(word);
    if (!extension) return null;

    const baseChord = this.powerChordRepo
      ? this.powerChordRepo.getById(extension.baseChordId)
      : null;

    return {
      baseChord: baseChord ?? null,
      extension,
      steps: extension.addedChars.length,
    };
  }

  getNextExtensions(masteredChordIds: string[]): ChordExtension[] {
    // Normalize mastered chord IDs
    const normalizedIds = new Set(
      masteredChordIds.map((id) => id.toLowerCase().split('').sort().join(''))
    );

    // Return extensions where the base chord is mastered
    return this.extensions.filter((ext) => normalizedIds.has(ext.baseChordId));
  }

  getBaseChordIds(): string[] {
    return Array.from(EXTENSIONS_BY_BASE.keys());
  }

  getByComplexity(): ChordExtension[] {
    return [...this.extensions].sort(
      (a, b) => a.addedChars.length - b.addedChars.length
    );
  }

  getSimpleExtensions(): ChordExtension[] {
    return this.extensions.filter((ext) => ext.addedChars.length === 1);
  }

  hasExtensions(baseChordId: string): boolean {
    const normalizedId = baseChordId.toLowerCase().split('').sort().join('');
    return EXTENSIONS_BY_BASE.has(normalizedId);
  }

  getExtensionCount(baseChordId: string): number {
    return this.getByBaseChord(baseChordId).length;
  }

  /**
   * Gets extensions grouped by their base power chord.
   */
  getGroupedByBase(): Map<string, ChordExtension[]> {
    return new Map(EXTENSIONS_BY_BASE);
  }

  /**
   * Gets a learning-optimized order for extensions.
   * Prioritizes: simpler extensions first, more common categories first.
   */
  getOptimalLearningOrder(): ChordExtension[] {
    const categoryPriority: Record<SemanticCategory, number> = {
      determiner: 1,
      pronoun: 2,
      preposition: 3,
      conjunction: 4,
      verb_common: 5,
      verb_modal: 6,
      noun_common: 7,
      adjective: 8,
      adverb: 9,
      action: 10,
      common: 11,
      time: 12,
      place: 13,
      question: 14,
      negation: 15,
    };

    return [...this.extensions].sort((a, b) => {
      // First by complexity (fewer added chars = simpler)
      const complexityDiff = a.addedChars.length - b.addedChars.length;
      if (complexityDiff !== 0) return complexityDiff;

      // Then by category priority
      const catA = a.category ? categoryPriority[a.category] : 100;
      const catB = b.category ? categoryPriority[b.category] : 100;
      return catA - catB;
    });
  }

  /**
   * Gets all categories that have extensions.
   */
  getCategories(): SemanticCategory[] {
    const categories = new Set<SemanticCategory>();
    this.extensions.forEach((ext) => {
      if (ext.category) {
        categories.add(ext.category);
      }
    });
    return Array.from(categories);
  }

  /**
   * Searches extensions by word prefix.
   */
  searchByWordPrefix(prefix: string): ChordExtension[] {
    const lowerPrefix = prefix.toLowerCase();
    return this.extensions.filter((ext) =>
      ext.resultWord.startsWith(lowerPrefix)
    );
  }
}

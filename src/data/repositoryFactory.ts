/**
 * Repository factory for creating and managing repository instances.
 * Provides a centralized way to access all repositories.
 */

import {
  FingerRepository,
  CharacterRepository,
  PowerChordRepository,
  WordRepository,
  ProgressRepository,
  ExtensionRepository,
  IFingerRepository,
  ICharacterRepository,
  IPowerChordRepository,
  IWordRepository,
  IProgressRepository,
  IExtensionRepository,
} from './repositories';

/**
 * Collection of all repositories.
 */
export interface Repositories {
  fingers: IFingerRepository;
  characters: ICharacterRepository;
  powerChords: IPowerChordRepository;
  words: IWordRepository;
  progress: IProgressRepository;
  extensions: IExtensionRepository;
}

/**
 * Singleton instance of repositories.
 */
let repositoriesInstance: Repositories | null = null;

/**
 * Creates all repository instances.
 * Shares character repository between dependent repositories.
 */
export function createRepositories(): Repositories {
  const characterRepo = new CharacterRepository();
  const powerChordRepo = new PowerChordRepository(characterRepo);

  return {
    fingers: new FingerRepository(),
    characters: characterRepo,
    powerChords: powerChordRepo,
    words: new WordRepository(characterRepo),
    progress: new ProgressRepository(),
    extensions: new ExtensionRepository(powerChordRepo),
  };
}

/**
 * Gets the singleton repositories instance.
 * Creates it if it doesn't exist.
 */
export function getRepositories(): Repositories {
  if (!repositoriesInstance) {
    repositoriesInstance = createRepositories();
  }
  return repositoriesInstance;
}

/**
 * Resets the singleton instance.
 * Useful for testing or when data needs to be reloaded.
 */
export function resetRepositories(): void {
  repositoriesInstance = null;
}

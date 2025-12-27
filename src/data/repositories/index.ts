/**
 * Repository exports.
 * Provides data access interfaces and implementations.
 */

export type { IFingerRepository } from './FingerRepository';
export { FingerRepository } from './FingerRepository';

export type { ICharacterRepository } from './CharacterRepository';
export { CharacterRepository } from './CharacterRepository';

export type { IPowerChordRepository } from './PowerChordRepository';
export { PowerChordRepository } from './PowerChordRepository';

export type { IWordRepository } from './WordRepository';
export { WordRepository } from './WordRepository';

export type { IProgressRepository, ProgressStats } from './ProgressRepository';
export { ProgressRepository } from './ProgressRepository';

export type { IExtensionRepository, ExtensionPath } from './ExtensionRepository';
export { ExtensionRepository } from './ExtensionRepository';

export type {
  IAchievementRepository,
  UnlockedAchievement,
  AchievementMetrics,
  DailyStreakData,
} from './AchievementRepository';
export {
  AchievementRepository,
  getAchievementRepository,
  resetAchievementRepository,
} from './AchievementRepository';

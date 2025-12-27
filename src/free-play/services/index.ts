/**
 * Free Play Services
 *
 * Services exclusively used in Free Play mode.
 */

// Achievement service
export {
  AchievementService,
  getAchievementService,
  resetAchievementService,
} from './AchievementService';
export type {
  IAchievementService,
  AchievementProgress,
  AchievementUnlockEvent,
  AchievementListener,
} from './AchievementService';

// Analytics service
export {
  AnalyticsService,
  getAnalyticsService,
  resetAnalyticsService,
} from './AnalyticsService';
export type { IAnalyticsService } from './AnalyticsService';

// Challenge service
export { ChallengeService, getChallengeService, resetChallengeService } from './ChallengeService';
export type {
  IChallengeService,
  ChallengeItem,
  ChallengeSession,
  AnswerResult,
  ChallengeResult,
} from './ChallengeService';

// Combo service
export { ComboService, getComboService, resetComboService } from './ComboService';
export type {
  IComboService,
  ComboState,
  ComboStateListener,
} from './ComboService';

// Transcription service
export {
  TranscriptionService,
  getTranscriptionService,
  resetTranscriptionService,
} from './TranscriptionService';
export type {
  ITranscriptionService,
  KeystrokeEvent,
  TranscriptionError,
  TranscriptionSession,
  WordAnalysis,
  TranscriptionAnalysis,
} from './TranscriptionService';

// Sentence service
export {
  SentenceService,
  getSentenceService,
  initSentenceService,
  resetSentenceService,
} from './SentenceService';
export type {
  ISentenceService,
  WordStatus,
  SentenceSelection,
  WordResult,
  SentenceResults,
  SentenceSession,
  SentenceSelectionOptions,
} from './SentenceService';

// Song service
export {
  SongService,
  getSongService,
  resetSongService,
} from './SongService';
export type {
  ISongService,
  SongGameState,
  SongPlaybackState,
  SongStateCallback,
  TimingResult,
} from './SongService';

// Background music service
export {
  BackgroundMusicService,
  getBackgroundMusicService,
  resetBackgroundMusicService,
} from './BackgroundMusicService';
export type {
  IBackgroundMusicService,
  BackgroundMusicConfig,
  BeatCallback,
} from './BackgroundMusicService';

// Song generator service
export {
  SongGeneratorService,
  getSongGeneratorService,
  resetSongGeneratorService,
} from './SongGeneratorService';
export type {
  ISongGeneratorService,
  SongGenerationOptions,
} from './SongGeneratorService';

/**
 * Services Layer
 *
 * This module provides the application service layer that encapsulates
 * business logic, coordinates between repositories, and provides clean
 * APIs for UI components.
 *
 *
 * Usage:
 * ```typescript
 * import { getServices } from '@/services';
 *
 * const { audio, learning, chord, progress, input, color } = getServices();
 *
 * // Play a finger note
 * audio.playFingerNote('L_INDEX', Direction.PRESS);
 *
 * // Record an attempt
 * progress.recordCharacterAttempt('e', true, 500, Direction.PRESS);
 *
 * // Calculate chord score
 * const score = chord.calculateChordScore(inputChord, targetWord, timeMs, attempts);
 * ```
 *
 * @module services
 */

// Service container
export {
  getServices,
  getServiceRepositories,
  setServices,
  resetServices,
  initializeServices,
} from './ServiceContainer';
export type { ServiceContainer } from './ServiceContainer';

// Audio service
export { AudioService, AUDIO_DURATIONS, INSTRUMENT_PRESETS } from './AudioService';
export type { IAudioService, InstrumentPreset, ChordStyle } from './AudioService';

// Color service
export { ColorService } from './ColorService';
export type { IColorService } from './ColorService';

// Learning service
export { LearningService, LearningStage } from './LearningService';
export type {
  ILearningService,
  QualityRating,
  ConfidenceLevel,
} from './LearningService';

// Chord service
export { ChordService } from './ChordService';
export type { IChordService, ChordScore } from './ChordService';

// Progress service
export { ProgressService } from './ProgressService';
export type {
  IProgressService,
  OverallProgress,
  FingerProgress,
  DirectionProgress,
  AttemptRecord,
  SessionRecord,
  GlobalStats,
} from './ProgressService';

// Input service
export { InputService, SIMULTANEOUS_THRESHOLD_MS, CHORD_MAX_DURATION_MS, analyzeChordInput } from './InputService';
export type {
  IInputService,
  InputEvent,
  ChordResult,
  SimultaneousPressEvent,
} from './InputService';

// Quiz service
export { QuizService } from './QuizService';
export type {
  IQuizService,
  QuizSessionType,
  SelectionOptions,
  QuizSession,
  QuizStats,
  FingerConfidence,
} from './QuizService';

// Scoring service
export { ScoringService, getScoringService, resetScoringService } from './ScoringService';
export type {
  IScoringService,
  ScoreCalculation,
  ScoreBreakdown,
  QuizScoreInput,
  QuizScoreBreakdown,
} from './ScoringService';

// Training session service
export { TrainingSessionService } from './TrainingSessionService';
export type {
  ITrainingSessionService,
  ItemFilter,
  SessionConfig,
} from './TrainingSessionService';

// High score service
export {
  HighScoreService,
  getHighScoreService,
  resetHighScoreService,
} from './HighScoreService';
export type {
  IHighScoreService,
  HighScoreCategory,
  HighScoreDifficulty,
  HighScoreEntry,
} from './HighScoreService';

// Practice progress service
export {
  PracticeProgressService,
  getPracticeProgressService,
  resetPracticeProgressService,
} from './PracticeProgressService';
export type {
  IPracticeProgressService,
  PracticeProgress,
} from './PracticeProgressService';

// Quiz progress service
export {
  QuizProgressService,
  getQuizProgressService,
  resetQuizProgressService,
} from './QuizProgressService';
export type {
  IQuizProgressService,
  QuizProgress,
  WordStats,
  QuizQuestionResult,
} from './QuizProgressService';

// Service interfaces (for DI and testing)
export type { ICampaignService, CampaignStateCallback } from './interfaces';

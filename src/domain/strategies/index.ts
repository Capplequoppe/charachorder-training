/**
 * Training Mode Strategies
 *
 * Strategy pattern implementations for different training modes.
 * Each strategy encapsulates the logic for item selection, completion
 * criteria, and phase sequences for a specific training mode.
 *
 * @module domain/strategies
 */

export {
  DEFAULT_COMPLETION_CRITERIA,
  QUIZ_COMPLETION_CRITERIA,
} from './TrainingModeStrategy';

export type {
  TrainingMode,
  TrainingPhase,
  CompletionCriteria,
  ModeDisplayConfig,
  TrainingModeStrategy,
} from './TrainingModeStrategy';

// Concrete strategy implementations
export { LearnModeStrategy } from './LearnModeStrategy';
export { ReviewDueModeStrategy } from './ReviewDueModeStrategy';
export { ReviewAllModeStrategy } from './ReviewAllModeStrategy';
export { SurvivalModeStrategy } from './SurvivalModeStrategy';
export { BossModeStrategy } from './BossModeStrategy';

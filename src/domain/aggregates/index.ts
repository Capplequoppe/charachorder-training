/**
 * Domain Aggregates
 *
 * Aggregates are clusters of domain objects that can be treated as a single unit.
 * They ensure consistency boundaries and encapsulate related entities.
 */

export { Chord } from './Chord';

export {
  Word,
  SemanticCategory,
  SEMANTIC_CATEGORY_NAMES,
  SEMANTIC_CATEGORY_ICONS,
} from './Word';

export {
  LearningProgress,
  MasteryLevel,
  DEFAULT_LEARNING_PROGRESS,
  MASTERY_WINDOW_SIZE,
  RESPONSE_TIME_WINDOW_SIZE,
  FAMILIAR_ACCURACY_THRESHOLD,
  MASTERED_ACCURACY_THRESHOLD,
  MASTERED_RESPONSE_TIME_THRESHOLD,
  MAX_RESPONSE_TIME_PENALTY_MS,
} from './LearningProgress';

export type { DirectionProgress, LearningItemType, AttemptRecord } from './LearningProgress';

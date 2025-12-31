/**
 * Training Feature Components
 *
 * Components for training modes (power chords, words, survival).
 */

export { IntraHandTraining } from './IntraHandTraining';
export type { IntraHandTrainingProps, TrainingResults } from './IntraHandTraining';

export { CrossHandTraining } from './CrossHandTraining';
export type { CrossHandTrainingProps, CrossHandResults } from './CrossHandTraining';

export { WordChordTraining } from './WordChordTraining';
export type { WordChordTrainingProps, WordTrainingResults } from './WordChordTraining';

export { SurvivalGame } from './SurvivalGame';
export type { SurvivalGameProps, BossModeConfig, BossResult } from './SurvivalGame';

export { ChunkExtensionTraining } from './ChunkExtensionTraining';

export {
  LegoVisualization,
  LegoCompact,
  LegoPath,
  WordLegoVisualization,
  WordLegoCompact,
} from './LegoVisualization';

// Phase renderers
export {
  IntroPhaseRenderer,
  PracticePhaseRenderer,
  QuizPhaseRenderer,
  CompletePhaseRenderer,
  buildCompletePhaseProps,
} from './phases';

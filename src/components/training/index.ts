/**
 * Training Components
 *
 * Components for power chord training phases.
 */

export { IntraHandTraining } from './IntraHandTraining';
export type { IntraHandTrainingProps, TrainingResults } from './IntraHandTraining';

export { CrossHandTraining } from './CrossHandTraining';
export type { CrossHandTrainingProps, CrossHandResults } from './CrossHandTraining';

export { BilateralCue } from './BilateralCue';
export type { BilateralCueProps } from './BilateralCue';

export { ChunkExtensionTraining } from './ChunkExtensionTraining';
export type { ChunkExtensionTrainingProps, ChunkExtensionResults } from './ChunkExtensionTraining';

export {
  LegoVisualization,
  LegoCompact,
  LegoPath,
  WordLegoVisualization,
  WordLegoCompact,
} from './LegoVisualization';
export type {
  LegoVisualizationProps,
  LegoCompactProps,
  LegoPathProps,
  WordLegoVisualizationProps,
  WordLegoCompactProps,
} from './LegoVisualization';

export { WordChordTraining } from './WordChordTraining';
export type { WordChordTrainingProps, WordTrainingResults } from './WordChordTraining';

export { SurvivalGame } from './SurvivalGame';
export type {
  SurvivalGameProps,
  SurvivalDifficulty,
  SurvivalItemType,
  BossModeConfig,
  BossResult,
} from './SurvivalGame';

export { TrainingModeSelector } from './TrainingModeSelector';
export type { TrainingModeSelectorProps, TrainingMode } from './TrainingModeSelector';

// Phase renderers
export {
  IntroPhaseRenderer,
  PracticePhaseRenderer,
  QuizPhaseRenderer,
  CompletePhaseRenderer,
  createQuizResults,
  createPracticeResults,
} from './phases';
export type {
  IntroPhaseRendererProps,
  IntroLayout,
  PracticePhaseRendererProps,
  PracticeLayout,
  QuizPhaseRendererProps,
  QuizLayout,
  CompletePhaseRendererProps,
  ResultItem,
  ActionButton,
} from './phases';

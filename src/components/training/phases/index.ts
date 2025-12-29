/**
 * Shared Phase Renderers
 *
 * Reusable components for training phase UI.
 * These components provide consistent rendering for all training types
 * (IntraHand, CrossHand, WordChord) while allowing customization.
 *
 * @module components/training/phases
 */

export { IntroPhaseRenderer } from './IntroPhaseRenderer';
export type { IntroPhaseRendererProps, IntroLayout } from './IntroPhaseRenderer';

export { PracticePhaseRenderer } from './PracticePhaseRenderer';
export type { PracticePhaseRendererProps, PracticeLayout } from './PracticePhaseRenderer';

export { QuizPhaseRenderer } from './QuizPhaseRenderer';
export type { QuizPhaseRendererProps, QuizLayout } from './QuizPhaseRenderer';

export {
  CompletePhaseRenderer,
  createQuizResults,
  createPracticeResults,
} from './CompletePhaseRenderer';
export type {
  CompletePhaseRendererProps,
  ResultItem,
  ActionButton,
} from './CompletePhaseRenderer';

export { buildCompletePhaseProps } from './buildCompletePhaseProps';
export type { BuildCompletePhasePropsConfig } from './buildCompletePhaseProps';

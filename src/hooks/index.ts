/**
 * Hooks Layer
 *
 * React hooks for accessing application services and state.
 *
 * Note: Free Play only hooks have been moved to @/free-play/hooks
 *
 * Usage:
 * ```typescript
 * // In App.tsx or main component
 * import { ServiceProvider } from '@/hooks';
 *
 * function App() {
 *   return (
 *     <ServiceProvider>
 *       <YourApp />
 *     </ServiceProvider>
 *   );
 * }
 *
 * // In any component
 * import { useAudio, useLearning, useProgress } from '@/hooks';
 *
 * function MyComponent() {
 *   const audio = useAudio();
 *   const learning = useLearning();
 *   const progress = useProgress();
 *
 *   // Use services...
 * }
 * ```
 *
 * @module hooks
 */

export {
  ServiceProvider,
  useServices,
  useColor,
  useLearning,
  useChord,
  useProgress,
  useInput,
  useAudioWithInit,
} from './useServices';

// Export useAudio from the wrapper module (with safety checks)
export { useAudio } from './useAudio';

export { useSettings } from './useSettings';
export type { AppSettings, UseSettingsResult } from './useSettings';

// Training hooks
export { useChordInput } from './useChordInput';
export type { UseChordInputOptions, UseChordInputResult } from './useChordInput';

export { useTrainingSession } from './useTrainingSession';
export type {
  UseTrainingSessionOptions,
  UseTrainingSessionResult,
  ItemProgress,
  SessionProgress,
  QuizResult,
  TrainingResults,
  FeedbackState,
} from './useTrainingSession';

export { useTrainingPhase } from './useTrainingPhase';
export type { UseTrainingPhaseOptions, UseTrainingPhaseResult } from './useTrainingPhase';

// Timer hooks
export { useCountdownTimer } from './useCountdownTimer';
export type { UseCountdownTimerOptions, UseCountdownTimerResult } from './useCountdownTimer';

// Quiz session hooks
export { useQuizSession } from './useQuizSession';
export type {
  QuizMode,
  UseQuizSessionOptions,
  UseQuizSessionResult,
  QuizItemResult,
  QuizSessionResults,
  QuizFeedback,
} from './useQuizSession';

/**
 * Hooks Layer
 *
 * React hooks for accessing application services and state.
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

// Campaign progress hook
export { useCampaignProgress } from './useCampaignProgress';
export type {
  UseCampaignProgressOptions,
  UseCampaignProgressResult,
} from './useCampaignProgress';

// Quiz countdown hook
export { useQuizCountdown } from './useQuizCountdown';
export type {
  UseQuizCountdownOptions,
  UseQuizCountdownResult,
} from './useQuizCountdown';

// Training callbacks hook
export { useTrainingCallbacks } from './useTrainingCallbacks';
export type {
  UseTrainingCallbacksOptions,
  UseTrainingCallbacksResult,
} from './useTrainingCallbacks';

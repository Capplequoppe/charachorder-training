/**
 * Build Complete Phase Props Utility
 *
 * Consolidates the logic for building CompletePhaseRenderer props
 * used across IntraHandTraining, CrossHandTraining, and WordChordTraining.
 *
 * @module components/training/phases
 */

import type { UseTrainingSessionResult } from '../../../hooks/useTrainingSession';
import type { UseTrainingPhaseResult } from '../../../hooks/useTrainingPhase';
import {
  createQuizResults,
  createPracticeResults,
  type ResultItem,
  type ActionButton,
  type CompletePhaseRendererProps,
} from './CompletePhaseRenderer';

/**
 * Configuration for building complete phase props.
 */
export interface BuildCompletePhasePropsConfig {
  /** The training session */
  session: UseTrainingSessionResult;
  /** The phase control */
  phaseControl: UseTrainingPhaseResult;
  /** Number of items remaining to learn */
  itemsRemainingToLearn: number;
  /** Whether in campaign mode */
  inCampaignMode: boolean;
  /** Whether revisiting a completed chapter */
  isRevisiting: boolean;
  /** Title for quiz mode completion */
  quizCompleteTitle?: string;
  /** Title for practice mode completion */
  practiceCompleteTitle?: string;
  /** Message for campaign continue button */
  campaignContinueMessage?: string;
  /** Callback to go back to mode selection */
  backToModeSelect: () => void;
  /** Callback to continue learning more */
  continueLearnMore: () => void;
  /** Callback to start quiz countdown */
  startQuizCountdown: () => void;
  /** Additional stats to include in practice results */
  additionalPracticeStats?: { label: string; value: string | number; highlight?: boolean }[];
}

/**
 * Build props for CompletePhaseRenderer.
 *
 * @example
 * ```tsx
 * const completePhaseProps = buildCompletePhaseProps({
 *   session,
 *   phaseControl,
 *   itemsRemainingToLearn,
 *   inCampaignMode,
 *   isRevisiting,
 *   quizCompleteTitle: 'Quiz Complete!',
 *   practiceCompleteTitle: 'Training Complete!',
 *   campaignContinueMessage: 'Power chords practiced! Challenge the boss.',
 *   backToModeSelect,
 *   continueLearnMore,
 *   startQuizCountdown,
 * });
 *
 * return <CompletePhaseRenderer {...completePhaseProps} />;
 * ```
 */
export function buildCompletePhaseProps(
  config: BuildCompletePhasePropsConfig
): Omit<CompletePhaseRendererProps, 'customContent' | 'itemsMastered'> {
  const {
    session,
    phaseControl,
    itemsRemainingToLearn,
    inCampaignMode,
    isRevisiting,
    quizCompleteTitle = 'Quiz Complete!',
    practiceCompleteTitle = 'Training Complete!',
    campaignContinueMessage = 'Great job! Challenge the boss to complete the chapter.',
    backToModeSelect,
    continueLearnMore,
    startQuizCountdown,
    additionalPracticeStats,
  } = config;

  // Calculate results
  const quizCorrect = session.quizResults.filter(r => r.correct).length;
  const results: ResultItem[] = session.isQuizMode
    ? createQuizResults(quizCorrect, session.quizResults.length)
    : createPracticeResults(
        session.sessionProgress.completedItems,
        session.sessionProgress.totalAttempts > 0
          ? session.sessionProgress.correctAttempts / session.sessionProgress.totalAttempts
          : 0,
        additionalPracticeStats
      );

  // Build action buttons
  const actions: ActionButton[] = [
    // Always show return button
    { label: 'Back to Mode Selection', onClick: backToModeSelect, variant: 'secondary' as const },
    // Only show Practice Again and Quick Quiz when not in quiz mode
    ...(!session.isQuizMode ? [
      {
        label: 'Practice Again',
        onClick: () => {
          session.restart();
          phaseControl.goToPractice();
        },
        variant: 'secondary' as const,
      },
      {
        label: 'Quick Quiz',
        onClick: () => {
          session.selectMode('review-all');
          startQuizCountdown();
          phaseControl.goToQuiz();
        },
        variant: 'secondary' as const,
      },
    ] : []),
  ];

  // Determine if we should show continue learning more button
  const showContinueLearnMore = session.isLearnMode && !session.isQuizMode && itemsRemainingToLearn > 0;

  // Build props
  return {
    title: session.isQuizMode ? quizCompleteTitle : practiceCompleteTitle,
    isQuizMode: session.isQuizMode,
    results,
    actions,
    continueLearnMore: showContinueLearnMore ? {
      itemsRemaining: itemsRemainingToLearn,
      onContinue: continueLearnMore,
    } : undefined,
    campaignContinue: inCampaignMode && !isRevisiting && !session.isQuizMode ? {
      message: campaignContinueMessage,
      buttonText: 'Continue',
      onContinue: backToModeSelect,
    } : undefined,
  };
}

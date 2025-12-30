/**
 * useFingerFundamentals Hook
 *
 * Manages state and business logic for the Finger Fundamentals chapter.
 * Extracted from FingerFundamentals.tsx to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Phase/navigation state management
 * - Stage progression tracking
 * - Mode selection handling
 * - Progress data computation
 * - Boss challenge integration
 */

import { useState, useCallback, useMemo } from 'react';
import { FingerId, MasteryLevel } from '../domain';
import { useCampaign, ChapterId, BOSS_REQUIREMENTS, type ChapterMasteryProgress } from '../campaign';
import { useTips, TipTrigger } from '../tips';
import { getServiceRepositories } from '../services';
import { getCharsForFinger } from '../config/fingerMapping';
import { LEARNING_STAGES, LearningStage } from '../config/fingerMnemonics';
import type { BossResult } from '../components/features/training/SurvivalGame';
import type { TrainingMode } from '../components/ui/organisms/TrainingModeSelector';

// ============================================================================
// Types
// ============================================================================

export type ChapterPhase =
  | 'mode-select'
  | 'welcome'
  | 'learning'
  | 'stage-quiz'
  | 'stage-complete'
  | 'final-review'
  | 'complete'
  | 'survival'
  | 'boss'
  | 'journey';

export interface UseFingerFundamentalsOptions {
  inCampaignMode?: boolean;
  isRevisiting?: boolean;
  onChapterComplete?: () => void;
}

export interface UseFingerFundamentalsResult {
  // Current state
  phase: ChapterPhase;
  currentStageIndex: number;
  currentFingerIndex: number;
  currentMode: TrainingMode;
  completedStages: Set<number>;

  // Derived data
  currentStage: LearningStage;
  currentFinger: FingerId | undefined;
  learnedFingers: FingerId[];
  allFingers: FingerId[];
  totalCharsLearned: number;
  charactersDueForReview: string[];
  charactersSortedByPriority: string[];
  masteryProgress: ChapterMasteryProgress;
  bossDefeated: boolean;
  bossBestScore: number;
  bossRequirements: { targetScore: number; itemCount: number };
  isLastStage: boolean;

  // Navigation actions
  setPhase: (phase: ChapterPhase) => void;
  startLearning: () => void;
  startFinalReview: () => void;
  backToModeSelect: () => void;
  goToNextStage: () => void;
  goToStage: (stageIndex: number) => void;
  practiceStage: (stageIndex: number) => void;
  quizStage: (stageIndex: number) => void;
  practiceCurrentStage: () => void;
  retryStageQuiz: () => void;

  // Event handlers
  handleFingerComplete: () => void;
  handleStageQuizComplete: () => void;
  handleFinalReviewComplete: () => void;
  handleModeSelect: (mode: TrainingMode) => void;
  handleBossComplete: (result: BossResult) => void;

  // Utility
  getLearningBackAction: () => (() => void) | undefined;
  refreshProgress: () => void;
}

// ============================================================================
// Pure Utility Functions
// ============================================================================

/**
 * Find the first stage that has characters not yet learned.
 */
export function findNextStageToLearn(): number {
  const { progress } = getServiceRepositories();

  for (let stageIndex = 0; stageIndex < LEARNING_STAGES.length; stageIndex++) {
    const stage = LEARNING_STAGES[stageIndex];

    for (const fingerId of stage.fingers) {
      const chars = getCharsForFinger(fingerId as FingerId);
      for (const char of chars) {
        const p = progress.getProgress(char, 'character');
        if (!p || p.totalAttempts === 0) {
          return stageIndex;
        }
      }
    }
  }

  return 0;
}

/**
 * Get fingers that have at least one character with progress.
 */
export function getLearnedFingers(): FingerId[] {
  const { progress } = getServiceRepositories();
  const learnedFingers: FingerId[] = [];

  for (const stage of LEARNING_STAGES) {
    for (const fingerId of stage.fingers) {
      const chars = getCharsForFinger(fingerId as FingerId);
      const hasLearned = chars.some((char) => {
        const p = progress.getProgress(char, 'character');
        return p && p.totalAttempts > 0;
      });
      if (hasLearned) {
        learnedFingers.push(fingerId as FingerId);
      }
    }
  }

  return learnedFingers;
}

/**
 * Shuffle array in place (Fisher-Yates).
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFingerFundamentals({
  inCampaignMode = false,
  isRevisiting = false,
  onChapterComplete,
}: UseFingerFundamentalsOptions = {}): UseFingerFundamentalsResult {
  const campaign = useCampaign();
  const { triggerTip } = useTips();

  const chapterId = ChapterId.FINGER_FUNDAMENTALS;
  const bossRequirements = BOSS_REQUIREMENTS[chapterId];

  // Refresh counter for memoized values
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Core state
  const [phase, setPhase] = useState<ChapterPhase>(
    isRevisiting || inCampaignMode ? 'mode-select' : 'welcome'
  );
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [currentMode, setCurrentMode] = useState<TrainingMode>('learn');

  // Derived stage data
  const currentStage = LEARNING_STAGES[currentStageIndex];
  const currentFinger = currentStage?.fingers[currentFingerIndex];
  const isLastStage = currentStageIndex === LEARNING_STAGES.length - 1;

  // Mastery progress
  const masteryProgress = useMemo(() => {
    return campaign.getChapterMasteryProgress(chapterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, chapterId, refreshCounter]);

  // Boss status
  const bossDefeated = campaign.campaignState.chapters[chapterId]?.bossDefeated ?? false;
  const bossBestScore = campaign.campaignState.chapters[chapterId]?.bossBestScore ?? 0;

  // All fingers learned up to current stage
  const learnedFingers = useMemo(() => {
    const fingers: FingerId[] = [];
    for (let i = 0; i <= currentStageIndex; i++) {
      fingers.push(...LEARNING_STAGES[i].fingers);
    }
    return fingers;
  }, [currentStageIndex]);

  // All fingers across all stages
  const allFingers = useMemo(() => {
    return LEARNING_STAGES.flatMap((stage) => stage.fingers);
  }, []);

  // Total characters learned
  const totalCharsLearned = useMemo(() => {
    return learnedFingers.reduce((sum, f) => sum + getCharsForFinger(f).length, 0);
  }, [learnedFingers]);

  // Characters due for review (shuffled)
  const charactersDueForReview = useMemo(() => {
    const { progress } = getServiceRepositories();
    const dueItems = progress.getItemsDueForReview('character');
    return shuffleArray(dueItems.map((p) => p.itemId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  // All characters sorted by priority (non-mastered first, shuffled)
  const charactersSortedByPriority = useMemo(() => {
    const { progress, characters } = getServiceRepositories();
    const allChars = characters.getAll();

    const charsWithProgress = allChars
      .map((c) => ({
        char: c.char,
        progress: progress.getProgress(c.char, 'character'),
      }))
      .filter((c) => c.progress && c.progress.totalAttempts > 0);

    const nonMastered = charsWithProgress.filter(
      (c) => c.progress?.masteryLevel !== 'mastered'
    );
    const mastered = charsWithProgress.filter(
      (c) => c.progress?.masteryLevel === 'mastered'
    );

    return [...shuffleArray(nonMastered), ...mastered].map((c) => c.char);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  // Navigation actions
  const refreshProgress = useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  const backToModeSelect = useCallback(() => {
    setRefreshCounter((c) => c + 1);
    setPhase('mode-select');
  }, []);

  const startLearning = useCallback(() => {
    setCurrentStageIndex(0);
    setCurrentFingerIndex(0);
    setPhase('learning');
  }, []);

  const startFinalReview = useCallback(() => {
    setPhase('final-review');
  }, []);

  const goToNextStage = useCallback(() => {
    if (currentStageIndex < LEARNING_STAGES.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
      setCurrentFingerIndex(0);
      setPhase('learning');
    } else {
      setPhase('final-review');
    }
  }, [currentStageIndex]);

  const goToStage = useCallback((stageIndex: number) => {
    setCurrentStageIndex(stageIndex);
    setCurrentFingerIndex(0);
    setPhase('stage-complete');
  }, []);

  const practiceStage = useCallback((stageIndex: number) => {
    setCurrentStageIndex(stageIndex);
    setCurrentFingerIndex(0);
    setPhase('learning');
  }, []);

  const quizStage = useCallback((stageIndex: number) => {
    setCurrentStageIndex(stageIndex);
    setPhase('stage-quiz');
  }, []);

  const practiceCurrentStage = useCallback(() => {
    setCurrentFingerIndex(0);
    setPhase('learning');
  }, []);

  const retryStageQuiz = useCallback(() => {
    setPhase('stage-quiz');
  }, []);

  // Event handlers
  const handleFingerComplete = useCallback(() => {
    if (currentFingerIndex < currentStage.fingers.length - 1) {
      setCurrentFingerIndex(currentFingerIndex + 1);
    } else {
      setPhase('stage-quiz');
    }
  }, [currentFingerIndex, currentStage]);

  const handleStageQuizComplete = useCallback(() => {
    setCompletedStages((prev) => new Set(prev).add(currentStageIndex));
    setPhase('stage-complete');
  }, [currentStageIndex]);

  const handleFinalReviewComplete = useCallback(() => {
    setPhase('complete');
  }, []);

  const handleModeSelect = useCallback((mode: TrainingMode) => {
    setCurrentMode(mode);
    setCurrentFingerIndex(0);
    setCompletedStages(new Set());

    switch (mode) {
      case 'learn': {
        const nextStage = findNextStageToLearn();
        setCurrentStageIndex(nextStage);
        setPhase('learning');
        break;
      }
      case 'review-due':
      case 'review-all':
        setCurrentStageIndex(0);
        setPhase('final-review');
        break;
      case 'boss':
        setCurrentStageIndex(0);
        setPhase('boss');
        break;
      case 'survival':
        setCurrentStageIndex(0);
        setPhase('survival');
        break;
      case 'journey':
        setPhase('journey');
        break;
    }
  }, []);

  const handleBossComplete = useCallback(
    (result: BossResult) => {
      campaign.recordBossAttempt(chapterId, result.scorePercent);

      if (result.passed) {
        campaign.completeChapter(chapterId);
        setTimeout(() => triggerTip(TipTrigger.BOSS_VICTORY), 1000);
      }
    },
    [campaign, chapterId, triggerTip]
  );

  // Utility: determine back action for learning phase
  const getLearningBackAction = useCallback(() => {
    if (inCampaignMode) return () => backToModeSelect();
    if (isRevisiting) return () => setPhase('welcome');
    if (currentFingerIndex === 0 && currentStageIndex === 0) return () => setPhase('welcome');
    if (currentFingerIndex === 0) {
      return () => {
        setCurrentStageIndex(currentStageIndex - 1);
        setPhase('stage-complete');
      };
    }
    return undefined;
  }, [inCampaignMode, isRevisiting, currentFingerIndex, currentStageIndex, backToModeSelect]);

  return {
    // Current state
    phase,
    currentStageIndex,
    currentFingerIndex,
    currentMode,
    completedStages,

    // Derived data
    currentStage,
    currentFinger,
    learnedFingers,
    allFingers,
    totalCharsLearned,
    charactersDueForReview,
    charactersSortedByPriority,
    masteryProgress,
    bossDefeated,
    bossBestScore,
    bossRequirements,
    isLastStage,

    // Navigation actions
    setPhase,
    startLearning,
    startFinalReview,
    backToModeSelect,
    goToNextStage,
    goToStage,
    practiceStage,
    quizStage,
    practiceCurrentStage,
    retryStageQuiz,

    // Event handlers
    handleFingerComplete,
    handleStageQuizComplete,
    handleFinalReviewComplete,
    handleModeSelect,
    handleBossComplete,

    // Utility
    getLearningBackAction,
    refreshProgress,
  };
}

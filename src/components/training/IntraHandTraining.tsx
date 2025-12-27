/**
 * Intra-Hand Training Component
 *
 * Training mode for 2-key power chords where both keys are pressed
 * by the same hand. Includes intro, sync practice, practice, and quiz phases.
 *
 * Refactored to use shared hooks and phase renderers from Phase 3/4.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { MasteryLevel } from '../../domain';
import {
  useTrainingSession,
  useTrainingPhase,
  useChordInput,
  useAudio,
} from '../../hooks';
import { useCampaign, ChapterId, BOSS_REQUIREMENTS } from '../../campaign';
import { getRepositories } from '../../data';
import { ColoredFinger } from '../common/ColoredFinger';
import { BilateralCue } from './BilateralCue';
import { PowerChordProgressJourney } from '../campaign/PowerChordProgressJourney';
import { SurvivalGame, BossResult } from './SurvivalGame';
import { TrainingModeSelector, TrainingMode as SelectorTrainingMode } from './TrainingModeSelector';
import {
  IntroPhaseRenderer,
  PracticePhaseRenderer,
  QuizPhaseRenderer,
  CompletePhaseRenderer,
  createQuizResults,
  createPracticeResults,
} from './phases';
import './training.css';

/**
 * Props for IntraHandTraining component.
 */
export interface IntraHandTrainingProps {
  hand: 'left' | 'right';
  onComplete?: (results: TrainingResults) => void;
  inCampaignMode?: boolean;
  isRevisiting?: boolean;
}

/**
 * Results from a training session.
 */
export interface TrainingResults {
  powerChordsCompleted: number;
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;
  accuracy: number;
}

/**
 * IntraHandTraining component for same-hand power chord practice.
 */
export function IntraHandTraining({
  hand,
  onComplete,
  inCampaignMode = false,
  isRevisiting = false,
}: IntraHandTrainingProps): React.ReactElement {
  const audioService = useAudio();
  const campaign = useCampaign();

  const chapterId = hand === 'left' ? ChapterId.POWER_CHORDS_LEFT : ChapterId.POWER_CHORDS_RIGHT;
  const bossRequirements = BOSS_REQUIREMENTS[chapterId];

  // Use shared training session hook
  const session = useTrainingSession({
    itemType: 'powerChord',
    filter: { hand },
    onComplete: (results) => {
      onComplete?.({
        powerChordsCompleted: results.itemsCompleted,
        totalAttempts: results.totalAttempts,
        correctAttempts: results.correctAttempts,
        averageResponseTimeMs: Math.round(results.averageResponseTimeMs),
        accuracy: results.accuracy,
      });
    },
  });

  // Use shared phase hook
  const phaseControl = useTrainingPhase({
    mode: session.currentMode,
    initialPhase: isRevisiting || inCampaignMode ? 'mode-select' : 'intro',
    includeSyncPractice: true,
  });

  // Sync practice state
  const [syncSuccesses, setSyncSuccesses] = useState(0);

  // Quiz countdown state (null = no countdown, 0 = countdown finished)
  const [quizCountdown, setQuizCountdown] = useState<number | null>(null);

  // Use shared input hook
  const input = useChordInput({
    expectedChars: session.currentItem?.expectedChars ?? new Set(),
    validOutputWords: session.currentItem?.validOutputWords ?? new Set(),
    onCorrect: (responseTimeMs) => {
      // In sync-practice phase, only track timing success, don't advance session
      if (phaseControl.phase === 'sync-practice') {
        handleSyncSuccess();
      } else {
        session.handleCorrect(responseTimeMs);
      }
    },
    onIncorrect: (responseTimeMs) => {
      // In sync-practice phase, don't record failures to session
      if (phaseControl.phase !== 'sync-practice') {
        session.handleIncorrect(responseTimeMs);
      }
    },
    onKeyPress: (char) => {
      // Play audio feedback for each key pressed
      audioService.playCharacterNote(char);
    },
    enabled: phaseControl.phase === 'sync-practice' ||
             phaseControl.phase === 'practice' ||
             (phaseControl.phase === 'quiz' && quizCountdown === 0),
  });

  // Track previous item to detect when we move to a new item
  const prevItemIdRef = useRef<string | null>(null);

  // Mastery progress for mode selector
  const [refreshCounter, setRefreshCounter] = useState(0);
  const masteryProgress = useMemo(() => {
    return campaign.getChapterMasteryProgress(chapterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, chapterId, refreshCounter]);

  const bossDefeated = campaign.campaignState.chapters[chapterId]?.bossDefeated ?? false;
  const bossBestScore = campaign.campaignState.chapters[chapterId]?.bossBestScore ?? 0;

  // Handle sync practice success
  const handleSyncSuccess = useCallback(() => {
    setSyncSuccesses((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        setTimeout(() => {
          phaseControl.goToPractice();
          setSyncSuccesses(0);
        }, 600);
      }
      return newCount;
    });
  }, [phaseControl]);

  // Reset sync state when phase changes TO sync-practice
  // Note: We intentionally exclude `input` from deps to avoid reset on every keystroke
  useEffect(() => {
    if (phaseControl.phase === 'sync-practice') {
      setSyncSuccesses(0);
      input.reset();
      input.startTiming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseControl.phase]);

  // Transition to complete phase when session completes
  useEffect(() => {
    if (session.isComplete && (phaseControl.phase === 'quiz' || phaseControl.phase === 'practice')) {
      phaseControl.goToComplete();
    }
  }, [session.isComplete, phaseControl.phase, phaseControl]);

  // Reset to intro phase when moving to a new item in learn mode
  // This ensures each power chord gets the intro and sync-practice phases
  useEffect(() => {
    if (!session.currentItem) return;

    const currentItemId = session.currentItem.id;
    const prevItemId = prevItemIdRef.current;

    // If this is a new item (not the first one) and we're in learn mode
    if (prevItemId !== null && prevItemId !== currentItemId && session.isLearnMode && !session.isComplete) {
      // Reset to intro for the new item
      setSyncSuccesses(0);
      phaseControl.goToIntro();
    }

    prevItemIdRef.current = currentItemId;
  }, [session.currentItem, session.isLearnMode, session.isComplete, phaseControl]);

  // Handle quiz countdown
  useEffect(() => {
    if (phaseControl.phase !== 'quiz' || quizCountdown === null || quizCountdown <= 0) return;

    const timer = setTimeout(() => {
      setQuizCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [phaseControl.phase, quizCountdown]);

  // Handle mode selection
  const handleModeSelect = useCallback((mode: SelectorTrainingMode) => {
    setSyncSuccesses(0);

    // Handle journey mode separately (not a session mode)
    if (mode === 'journey') {
      phaseControl.goToJourney();
      return;
    }

    session.selectMode(mode);

    switch (mode) {
      case 'learn':
        phaseControl.goToIntro();
        break;
      case 'review-due':
      case 'review-all':
        setQuizCountdown(3);
        phaseControl.goToQuiz();
        break;
      case 'survival':
        phaseControl.goToSurvival();
        break;
      case 'boss':
        phaseControl.goToBoss();
        break;
    }
  }, [session, phaseControl]);

  // Handle boss completion
  const handleBossComplete = useCallback((result: BossResult) => {
    campaign.recordBossAttempt(chapterId, result.scorePercent);
    if (result.passed) {
      campaign.completeChapter(chapterId);
    }
  }, [campaign, chapterId]);

  // Back to mode select
  const backToModeSelect = useCallback(() => {
    setRefreshCounter(c => c + 1);
    phaseControl.goToModeSelect();
    session.restart();
  }, [phaseControl, session]);

  // Get current item
  const currentItem = session.currentItem;

  // Get produces words for intro phase
  const producesWords = useMemo(() => {
    if (!currentItem) return [];
    return Array.from(currentItem.validOutputWords);
  }, [currentItem]);

  // Get finger IDs for sync practice
  const [finger1, finger2] = currentItem?.fingerIds ?? [];
  const char1 = currentItem?.displayChars[0];
  const char2 = currentItem?.displayChars[1];
  const blendedColor = currentItem?.blendedColor ?? '#4a9eff';

  // Render phase content
  const renderPhase = () => {
    switch (phaseControl.phase) {
      case 'mode-select':
        return (
          <TrainingModeSelector
            title={`${hand === 'left' ? 'Left' : 'Right'} Hand Power Chords`}
            progress={masteryProgress}
            bossDefeated={bossDefeated}
            bossBestScore={bossBestScore}
            bossTargetScore={bossRequirements.targetScore}
            onSelectMode={handleModeSelect}
            inCampaignMode={inCampaignMode}
          />
        );

      case 'intro':
        if (!currentItem) return null;
        return (
          <IntroPhaseRenderer
            item={currentItem}
            title="New Power Chord"
            layout="single-hand"
            producesWords={producesWords}
            onPlaySound={() => {
              const { powerChords } = getRepositories();
              const pc = powerChords.getById(currentItem.id);
              if (pc) audioService.playPowerChord(pc);
            }}
            onContinue={() => phaseControl.goToSyncPractice()}
            continueButtonLabel="Start Practice"
            onBack={inCampaignMode || isRevisiting ? backToModeSelect : undefined}
          />
        );

      case 'sync-practice':
        if (!currentItem || !char1 || !char2 || !finger1 || !finger2) return null;
        return (
          <div
            className={`training-phase sync-practice-phase ${session.feedback ?? ''}`}
            onClick={input.focusInput}
          >
            <h2>Sync Practice</h2>
            <p className="subtitle">Press both keys together</p>

            <BilateralCue
              leftFinger={finger1}
              rightFinger={finger2}
              cycleDurationMs={1500}
              isActive={session.feedback === null}
              className="sync-cue"
            />

            <div className="two-keys-display">
              <div className="key-indicator">
                <ColoredFinger fingerId={finger1} isActive size="large" showLabel />
                <span className="char-label" style={{ color: char1.color }}>
                  {char1.displayChar}
                </span>
              </div>

              <div className="key-indicator">
                <ColoredFinger fingerId={finger2} isActive size="large" showLabel />
                <span className="char-label" style={{ color: char2.color }}>
                  {char2.displayChar}
                </span>
              </div>
            </div>

            <div className="sync-meter">
              <div className="sync-meter-label">Progress</div>
              <div className="sync-meter-bar">
                <div
                  className="sync-meter-fill"
                  style={{
                    width: `${(syncSuccesses / 3) * 100}%`,
                    backgroundColor: blendedColor,
                  }}
                />
              </div>
              <div className="sync-meter-count">{syncSuccesses} / 3</div>
            </div>

            <input
              ref={input.inputRef}
              type="text"
              value={input.textInput}
              onChange={input.handleTextInputChange}
              className="chord-input chord-input--hidden"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-hidden="true"
            />

            {syncSuccesses > 0 && <div className="feedback correct">Good!</div>}
          </div>
        );

      case 'practice':
        if (!currentItem) return null;
        return (
          <PracticePhaseRenderer
            item={currentItem}
            title="Press Both Keys Together"
            layout="single-hand"
            successCount={session.itemProgress.successes}
            feedback={session.feedback}
            inputRef={input.inputRef}
            textInput={input.textInput}
            onTextInputChange={input.handleTextInputChange}
            showChordHint={producesWords.length > 0}
            firstProducesWord={producesWords[0]}
            onFocusInput={input.focusInput}
          />
        );

      case 'quiz':
        if (!currentItem) return null;
        // Show countdown before quiz starts
        if (quizCountdown !== null && quizCountdown > 0) {
          return (
            <div className="training-phase quiz-countdown">
              <p className="countdown-label">Get Ready!</p>
              <div className="countdown-number">{quizCountdown}</div>
              <p className="countdown-hint">Position your hands...</p>
            </div>
          );
        }
        return (
          <QuizPhaseRenderer
            item={currentItem}
            layout="single-hand"
            correctCount={session.quizResults.filter(r => r.correct).length}
            totalAnswered={session.quizResults.length}
            feedback={session.feedback}
            inputRef={input.inputRef}
            textInput={input.textInput}
            onTextInputChange={input.handleTextInputChange}
            onFocusInput={input.focusInput}
          />
        );

      case 'complete': {
        const quizCorrect = session.quizResults.filter(r => r.correct).length;
        const results = session.isQuizMode
          ? createQuizResults(quizCorrect, session.quizResults.length)
          : createPracticeResults(
              session.sessionProgress.completedItems,
              session.sessionProgress.totalAttempts > 0
                ? session.sessionProgress.correctAttempts / session.sessionProgress.totalAttempts
                : 0,
              [{ label: 'Total Attempts', value: session.sessionProgress.totalAttempts }]
            );

        const actions = [
          // Always show return button
          { label: 'Back to Mode Selection', onClick: backToModeSelect, variant: 'secondary' as const },
          // Only show Practice Again and Quick Quiz when not in quiz mode
          ...(!session.isQuizMode ? [
            { label: 'Practice Again', onClick: () => {
              session.restart();
              phaseControl.goToPractice();
            }, variant: 'secondary' as const },
            { label: 'Quick Quiz', onClick: () => {
              session.selectMode('review-all');
              setQuizCountdown(3);
              phaseControl.goToQuiz();
            }, variant: 'secondary' as const },
          ] : []),
        ];

        return (
          <CompletePhaseRenderer
            title={session.isQuizMode ? 'Quiz Complete!' : 'Training Complete!'}
            isQuizMode={session.isQuizMode}
            results={results}
            actions={actions}
            campaignContinue={inCampaignMode && !isRevisiting && !session.isQuizMode ? {
              message: `${hand === 'left' ? 'Left' : 'Right'} hand power chords practiced! Challenge the boss to complete the chapter.`,
              buttonText: 'Continue',
              onContinue: backToModeSelect,
            } : undefined}
          />
        );
      }

      case 'survival':
        return (
          <SurvivalGame
            itemType={hand === 'left' ? 'left-hand' : 'right-hand'}
            masteryFilter={MasteryLevel.MASTERED}
            onBack={backToModeSelect}
          />
        );

      case 'boss':
        return (
          <SurvivalGame
            itemType={hand === 'left' ? 'left-hand' : 'right-hand'}
            bossMode={{
              targetScorePercent: bossRequirements.targetScore,
              itemCount: bossRequirements.itemCount,
              title: `${hand === 'left' ? 'Left' : 'Right'} Hand Boss Challenge`,
            }}
            bossBestScore={bossBestScore}
            onBossComplete={handleBossComplete}
            onBack={backToModeSelect}
          />
        );

      case 'journey':
        return (
          <PowerChordProgressJourney
            hand={hand}
            onBack={backToModeSelect}
            title={`${hand === 'left' ? 'Left' : 'Right'} Hand Power Chords Journey`}
          />
        );

      default:
        return null;
    }
  };

  const showProgress = phaseControl.phase !== 'complete' &&
                       phaseControl.phase !== 'mode-select' &&
                       phaseControl.phase !== 'survival' &&
                       phaseControl.phase !== 'boss' &&
                       phaseControl.phase !== 'journey';

  const showBackButton = (phaseControl.phase === 'intro' ||
                          phaseControl.phase === 'sync-practice' ||
                          phaseControl.phase === 'practice' ||
                          phaseControl.phase === 'quiz') &&
                         (isRevisiting || inCampaignMode);

  return (
    <div className="intra-hand-training">
      {showBackButton && (
        <button className="back-to-select-btn" onClick={backToModeSelect}>
          ← Back to Mode Selection
        </button>
      )}

      <div className="training-header">
        <span className="hand-label">{hand === 'left' ? 'Left' : 'Right'} Hand Power Chords</span>
        {showProgress && (
          <span className="progress-label">
            {Math.min(session.currentIndex + 1, session.totalItems)} / {session.totalItems}
          </span>
        )}
      </div>

      {renderPhase()}
    </div>
  );
}

export default IntraHandTraining;

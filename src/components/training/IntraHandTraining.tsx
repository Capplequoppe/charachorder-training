/**
 * Intra-Hand Training Component
 *
 * Training mode for 2-key power chords where both keys are pressed
 * by the same hand. Includes intro, sync practice, practice, and quiz phases.
 *
 * Refactored to use shared hooks and phase renderers.
 */

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { MasteryLevel } from '../../domain';
import {
  useTrainingSession,
  useTrainingPhase,
  useChordInput,
  useAudio,
  useCampaignProgress,
  useQuizCountdown,
  useTrainingCallbacks,
} from '../../hooks';
import { ChapterId } from '../../campaign';
import { useTips, TipTrigger } from '../../tips';
import { getRepositories } from '../../data';
import { ColoredFinger } from '../common/ColoredFinger';
import { BilateralCue } from './BilateralCue';
import { PowerChordProgressJourney } from '../campaign/PowerChordProgressJourney';
import { SurvivalGame } from './SurvivalGame';
import { TrainingModeSelector } from './TrainingModeSelector';
import {
  IntroPhaseRenderer,
  PracticePhaseRenderer,
  QuizPhaseRenderer,
  CompletePhaseRenderer,
  buildCompletePhaseProps,
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
  const { triggerTip } = useTips();

  const chapterId = hand === 'left' ? ChapterId.POWER_CHORDS_LEFT : ChapterId.POWER_CHORDS_RIGHT;

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

  // Use campaign progress hook
  const {
    masteryProgress,
    itemsRemainingToLearn,
    bossDefeated,
    bossBestScore,
    refreshProgress,
  } = useCampaignProgress({ chapterId, session });

  // Use quiz countdown hook
  const {
    quizCountdown,
    isCountdownComplete,
    startCountdown,
  } = useQuizCountdown({ phase: phaseControl.phase });

  // Use training callbacks hook
  const {
    backToModeSelect,
    handleBossComplete,
    continueLearnMore,
    handleModeSelect,
    syncSuccesses,
    setSyncSuccesses,
    bossRequirements,
    setOnStartQuizCountdown,
  } = useTrainingCallbacks({
    chapterId,
    session,
    phaseControl,
    refreshProgress,
    hasSyncPractice: true,
  });

  // Connect quiz countdown to callbacks
  useEffect(() => {
    setOnStartQuizCountdown(() => startCountdown(3));
  }, [setOnStartQuizCountdown, startCountdown]);

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
      audioService.playCharacterNote(char);
    },
    enabled: phaseControl.phase === 'sync-practice' ||
             phaseControl.phase === 'practice' ||
             (phaseControl.phase === 'quiz' && isCountdownComplete),
  });

  // Track previous item to detect when we move to a new item
  const prevItemIdRef = useRef<string | null>(null);

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
  }, [phaseControl, setSyncSuccesses]);

  // Reset sync state when phase changes TO sync-practice
  useEffect(() => {
    if (phaseControl.phase === 'sync-practice') {
      setSyncSuccesses(0);
      input.reset();
      input.startTiming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseControl.phase, setSyncSuccesses]);

  // Transition to complete phase when session completes
  useEffect(() => {
    if (session.isComplete && (phaseControl.phase === 'quiz' || phaseControl.phase === 'practice')) {
      phaseControl.goToComplete();
    }
  }, [session.isComplete, phaseControl.phase, phaseControl]);

  // Reset to intro phase when moving to a new item in learn mode
  useEffect(() => {
    if (!session.currentItem) return;

    const currentItemId = session.currentItem.id;
    const prevItemId = prevItemIdRef.current;

    if (prevItemId !== null && prevItemId !== currentItemId && session.isLearnMode && !session.isComplete && phaseControl.phase !== 'mode-select') {
      setSyncSuccesses(0);
      phaseControl.goToIntro();
    }

    prevItemIdRef.current = currentItemId;
  }, [session.currentItem, session.isLearnMode, session.isComplete, phaseControl, phaseControl.phase, setSyncSuccesses]);

  // Trigger chunking theory tip when entering power chord training
  useEffect(() => {
    if (hand === 'left' && phaseControl.phase === 'intro') {
      setTimeout(() => triggerTip(TipTrigger.POWER_CHORD_START), 500);
    }
  }, [hand, phaseControl.phase, triggerTip]);

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
        const completeProps = buildCompletePhaseProps({
          session,
          phaseControl,
          itemsRemainingToLearn,
          inCampaignMode,
          isRevisiting,
          practiceCompleteTitle: 'Training Complete!',
          campaignContinueMessage: `${hand === 'left' ? 'Left' : 'Right'} hand power chords practiced! Challenge the boss to complete the chapter.`,
          backToModeSelect,
          continueLearnMore,
          startQuizCountdown: () => startCountdown(3),
          additionalPracticeStats: [{ label: 'Total Attempts', value: session.sessionProgress.totalAttempts }],
        });

        return <CompletePhaseRenderer {...completeProps} />;
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

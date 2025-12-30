/**
 * Cross-Hand Training Component
 *
 * Training mode for 2-key power chords where keys are pressed by
 * different hands simultaneously. Requires bimanual coordination.
 *
 * Refactored to use shared hooks and phase renderers.
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { Finger, MasteryLevel } from '../../../domain';
import {
  useTrainingSession,
  useTrainingPhase,
  useChordInput,
  useAudio,
  useCampaignProgress,
  useQuizCountdown,
  useTrainingCallbacks,
} from '../../../hooks';
import { ChapterId } from '../../../campaign';
import { getRepositories, CROSS_HAND_TIMING_THRESHOLDS } from '../../../data';
import { ColoredFinger } from '../../ui/atoms/ColoredFinger';
import { BilateralCue } from '../../ui/organisms/BilateralCue';
import { PowerChordProgressJourney } from '../campaign/PowerChordProgressJourney';
import { SurvivalGame } from './SurvivalGame';
import { TrainingModeSelector } from '../../ui/organisms/TrainingModeSelector';
import {
  IntroPhaseRenderer,
  PracticePhaseRenderer,
  QuizPhaseRenderer,
  CompletePhaseRenderer,
  buildCompletePhaseProps,
} from './phases';
import './training.css';

/**
 * Props for CrossHandTraining component.
 */
export interface CrossHandTrainingProps {
  onComplete: (results: CrossHandResults) => void;
  timingToleranceMs?: number;
  inCampaignMode?: boolean;
  isRevisiting?: boolean;
}

/**
 * Results from a cross-hand training session.
 */
export interface CrossHandResults {
  powerChordsCompleted: number;
  totalAttempts: number;
  correctAttempts: number;
  averageTimingDiffMs: number;
  accuracy: number;
  bestSyncMs: number;
}

/**
 * CrossHandTraining component for cross-hand power chord practice.
 */
export function CrossHandTraining({
  onComplete,
  timingToleranceMs = CROSS_HAND_TIMING_THRESHOLDS.advanced,
  inCampaignMode = false,
  isRevisiting = false,
}: CrossHandTrainingProps): React.ReactElement {
  const audioService = useAudio();

  const chapterId = ChapterId.POWER_CHORDS_CROSS;

  // Use shared training session hook
  const session = useTrainingSession({
    itemType: 'powerChord',
    filter: { hand: 'cross' },
    onComplete: (results) => {
      onComplete({
        powerChordsCompleted: results.itemsCompleted,
        totalAttempts: results.totalAttempts,
        correctAttempts: results.correctAttempts,
        averageTimingDiffMs: Math.round(results.averageResponseTimeMs),
        accuracy: results.accuracy,
        bestSyncMs: 0,
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

  // Get current item
  const currentItem = session.currentItem;

  // Extract left/right characters for cross-hand display
  const leftChar = currentItem?.displayChars.find(c => Finger.isLeftHandId(c.fingerId));
  const rightChar = currentItem?.displayChars.find(c => !Finger.isLeftHandId(c.fingerId));
  const leftFingerId = currentItem?.fingerIds.find(f => Finger.isLeftHandId(f));
  const rightFingerId = currentItem?.fingerIds.find(f => !Finger.isLeftHandId(f));

  // Get blended color
  const blendedColor = currentItem?.blendedColor ?? '#4a9eff';

  // Get produces words for intro phase
  const producesWords = useMemo(() => {
    if (!currentItem) return [];
    return Array.from(currentItem.validOutputWords);
  }, [currentItem]);

  // Render phase content
  const renderPhase = () => {
    switch (phaseControl.phase) {
      case 'mode-select':
        return (
          <TrainingModeSelector
            title="Cross-Hand Power Chords"
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
            title="Cross-Hand Power Chord"
            layout="two-hands"
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
        if (!currentItem || !leftChar || !rightChar || !leftFingerId || !rightFingerId) return null;
        return (
          <div
            className={`training-phase sync-practice-phase ${session.feedback ?? ''}`}
            onClick={input.focusInput}
          >
            <h2>Sync Practice</h2>
            <p className="subtitle">Press both keys together</p>

            <div className="two-hands-display">
              <div className="hand-indicator left">
                <ColoredFinger
                  fingerId={leftFingerId}
                  isActive
                  size="large"
                  showLabel
                />
                <span className="char-label" style={{ color: leftChar.color }}>
                  {leftChar.displayChar}
                </span>
              </div>

              <div className="timing-display">
                <BilateralCue
                  leftFinger={leftFingerId}
                  rightFinger={rightFingerId}
                  isActive={session.feedback === null}
                />
              </div>

              <div className="hand-indicator right">
                <ColoredFinger
                  fingerId={rightFingerId}
                  isActive
                  size="large"
                  showLabel
                />
                <span className="char-label" style={{ color: rightChar.color }}>
                  {rightChar.displayChar}
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
            title="Practice: Both Hands Together"
            layout="two-hands"
            successCount={session.itemProgress.successes}
            feedback={session.feedback}
            inputRef={input.inputRef}
            textInput={input.textInput}
            onTextInputChange={input.handleTextInputChange}
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
            layout="two-hands"
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
          practiceCompleteTitle: 'Cross-Hand Training Complete!',
          campaignContinueMessage: 'Cross-hand power chords practiced! Challenge the boss to complete the chapter.',
          backToModeSelect,
          continueLearnMore,
          startQuizCountdown: () => startCountdown(3),
        });

        return <CompletePhaseRenderer {...completeProps} />;
      }

      case 'survival':
        return (
          <SurvivalGame
            itemType="cross-hand"
            masteryFilter={MasteryLevel.MASTERED}
            onBack={backToModeSelect}
          />
        );

      case 'boss':
        return (
          <SurvivalGame
            itemType="cross-hand"
            bossMode={{
              targetScorePercent: bossRequirements.targetScore,
              itemCount: bossRequirements.itemCount,
              title: 'Cross-Hand Boss Challenge',
            }}
            bossBestScore={bossBestScore}
            onBossComplete={handleBossComplete}
            onBack={backToModeSelect}
          />
        );

      case 'journey':
        return (
          <PowerChordProgressJourney
            hand="cross"
            onBack={backToModeSelect}
            title="Cross-Hand Power Chords Journey"
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

  return (
    <div className="cross-hand-training">
      {showProgress && (
        <div className="training-header">
          <span className="hand-label">Cross-Hand Power Chords</span>
          <span className="progress-label">
            {session.currentIndex + 1} / {session.totalItems}
          </span>
        </div>
      )}

      {renderPhase()}
    </div>
  );
}

export default CrossHandTraining;

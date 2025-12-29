/**
 * WordChordTraining Component
 *
 * Training mode focused on chords that produce complete English words,
 * with semantic reinforcement and resolution sounds.
 *
 * Refactored to use shared hooks and phase renderers.
 */

import React, { useState, useMemo, useEffect } from 'react';
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
import {
  getRepositories,
  getWordCategory,
  getCategoryDefinition,
} from '../../data';
import { WordLegoVisualization } from './LegoVisualization';
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
 * Props for WordChordTraining component.
 */
export interface WordChordTrainingProps {
  /** Callback when training session completes */
  onComplete: (results: WordTrainingResults) => void;
  /** Whether user is revisiting a completed chapter */
  isRevisiting?: boolean;
  /** Whether this is being used in campaign mode */
  inCampaignMode?: boolean;
}

/**
 * Results from a word chord training session.
 */
export interface WordTrainingResults {
  wordsCompleted: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  wordsMastered: string[];
  averageTimeMs: number;
}

/**
 * WordChordTraining component for word-level chord practice.
 */
export function WordChordTraining({
  onComplete,
  isRevisiting = false,
  inCampaignMode = false,
}: WordChordTrainingProps): React.ReactElement {
  const audioService = useAudio();

  const chapterId = ChapterId.WORD_CHORDS;

  // Use shared training session hook
  const session = useTrainingSession({
    itemType: 'word',
    onComplete: (results) => {
      // Get mastered word names
      const masteredWords: string[] = [];
      results.quizResults?.forEach(result => {
        if (result.correct) {
          masteredWords.push(result.itemId);
        }
      });

      onComplete({
        wordsCompleted: results.itemsCompleted,
        totalAttempts: results.totalAttempts,
        correctAttempts: results.correctAttempts,
        accuracy: results.accuracy,
        wordsMastered: masteredWords,
        averageTimeMs: Math.round(results.averageResponseTimeMs),
      });
    },
  });

  // Use shared phase hook
  const phaseControl = useTrainingPhase({
    mode: session.currentMode,
    initialPhase: isRevisiting || inCampaignMode ? 'mode-select' : 'intro',
    includeSyncPractice: false, // Words don't have sync practice
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

  // Use training callbacks hook (no sync practice for words)
  const {
    backToModeSelect,
    handleBossComplete,
    continueLearnMore,
    handleModeSelect,
    bossRequirements,
    setOnStartQuizCountdown,
  } = useTrainingCallbacks({
    chapterId,
    session,
    phaseControl,
    refreshProgress,
    hasSyncPractice: false,
  });

  // Connect quiz countdown to callbacks
  useEffect(() => {
    setOnStartQuizCountdown(() => startCountdown(3));
  }, [setOnStartQuizCountdown, startCountdown]);

  // Track if letters have been revealed for current quiz item (stays true until next item)
  const [quizLettersRevealed, setQuizLettersRevealed] = useState(false);

  // Use shared input hook
  const input = useChordInput({
    expectedChars: session.currentItem?.expectedChars ?? new Set(),
    validOutputWords: session.currentItem?.validOutputWords ?? new Set(),
    onCorrect: (responseTimeMs) => {
      session.handleCorrect(responseTimeMs);
      // Play word resolution sound
      if (session.currentItem) {
        const { words } = getRepositories();
        const word = words.getByWord(session.currentItem.id);
        if (word) {
          audioService.playWordResolution(word);
        }
      }
    },
    onIncorrect: (responseTimeMs) => {
      // Reveal letters when incorrect in quiz mode
      if (phaseControl.phase === 'quiz') {
        setQuizLettersRevealed(true);
      }
      session.handleIncorrect(responseTimeMs);
    },
    onKeyPress: (char) => {
      audioService.playCharacterNote(char);
    },
    enabled: phaseControl.phase === 'practice' || (phaseControl.phase === 'quiz' && isCountdownComplete),
  });

  // Transition to complete phase when session completes
  useEffect(() => {
    if (session.isComplete && (phaseControl.phase === 'quiz' || phaseControl.phase === 'practice')) {
      phaseControl.goToComplete();
    }
  }, [session.isComplete, phaseControl.phase, phaseControl]);

  // Reset quiz letters revealed state when moving to a new item
  useEffect(() => {
    setQuizLettersRevealed(false);
  }, [session.currentItem?.id]);

  // Get current item
  const currentItem = session.currentItem;

  // Debug: Log current item details
  if (import.meta.env.DEV && currentItem) {
    console.log('[WordChordTraining] Current item:', {
      id: currentItem.id,
      displayName: currentItem.displayName,
      expectedChars: [...currentItem.expectedChars],
      validOutputWords: [...currentItem.validOutputWords],
      displayChars: currentItem.displayChars.map(c => c.char),
    });
  }

  // Get word-specific data
  const wordData = useMemo(() => {
    if (!currentItem) return null;
    const { words } = getRepositories();
    const word = words.getByWord(currentItem.id);
    if (!word) return null;

    const category = getWordCategory(word.word);
    const categoryDef = category ? getCategoryDefinition(category) : null;

    return { word, category, categoryDef };
  }, [currentItem]);

  // Render phase content
  const renderPhase = () => {
    switch (phaseControl.phase) {
      case 'mode-select':
        return (
          <TrainingModeSelector
            title="Word Chord Training"
            progress={masteryProgress}
            bossDefeated={bossDefeated}
            bossBestScore={bossBestScore}
            bossTargetScore={bossRequirements.targetScore}
            onSelectMode={handleModeSelect}
            inCampaignMode={inCampaignMode}
          />
        );

      case 'intro':
        if (!currentItem || !wordData) return null;
        return (
          <IntroPhaseRenderer
            item={currentItem}
            title="New Word Chord"
            layout="word"
            wordRank={wordData.word.rank}
            categoryInfo={wordData.categoryDef ? {
              displayName: wordData.categoryDef.displayName,
              color: wordData.categoryDef.color,
              icon: wordData.categoryDef.icon,
            } : undefined}
            onPlaySound={() => {
              audioService.playWordResolution(wordData.word);
            }}
            onContinue={() => phaseControl.goToPractice()}
            continueButtonLabel="Practice This Word"
            onBack={backToModeSelect}
            customContent={wordData.word && (
              <div className="produces-words">
                <p>Press these keys together:</p>
                <WordLegoVisualization word={wordData.word} size="small" />
              </div>
            )}
          />
        );

      case 'practice':
        if (!currentItem) return null;
        return (
          <PracticePhaseRenderer
            item={currentItem}
            title="Press All Keys Together"
            layout="word"
            successCount={session.itemProgress.successes}
            feedback={session.feedback}
            inputRef={input.inputRef}
            textInput={input.textInput}
            onTextInputChange={input.handleTextInputChange}
            showFingerIndicators
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
            layout="word"
            correctCount={session.quizResults.filter(r => r.correct).length}
            totalAnswered={session.quizResults.length}
            feedback={session.feedback}
            inputRef={input.inputRef}
            textInput={input.textInput}
            onTextInputChange={input.handleTextInputChange}
            onFocusInput={input.focusInput}
            hideLettersUntilIncorrect
            forceShowLetters={quizLettersRevealed}
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
          campaignContinueMessage: 'Word chords practiced! Challenge the boss to complete the chapter.',
          backToModeSelect,
          continueLearnMore,
          startQuizCountdown: () => startCountdown(3),
        });

        return <CompletePhaseRenderer {...completeProps} />;
      }

      case 'survival':
        return (
          <SurvivalGame
            itemType="word-chords"
            masteryFilter={MasteryLevel.MASTERED}
            onBack={backToModeSelect}
          />
        );

      case 'boss':
        return (
          <SurvivalGame
            itemType="word-chords"
            bossMode={{
              targetScorePercent: bossRequirements.targetScore,
              itemCount: bossRequirements.itemCount,
              title: 'Word Chords Boss Challenge',
            }}
            bossBestScore={bossBestScore}
            onBossComplete={handleBossComplete}
            onBack={backToModeSelect}
          />
        );

      case 'journey':
        // Word chords don't have a dedicated journey view yet
        // Fall back to mode select
        backToModeSelect();
        return null;

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
    <div className="word-chord-training">
      <div className="training-header">
        <span className="hand-label">Word Training</span>
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

export default WordChordTraining;

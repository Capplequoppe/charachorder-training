/**
 * Finger Fundamentals Component
 *
 * Chapter 1 of Campaign Mode: Teaches all fingers in stages (2 fingers at a time),
 * with quizzes between stages and the option to practice as long as desired.
 *
 * Business logic extracted to useFingerFundamentals hook.
 */

import React, { useEffect } from 'react';
import { FingerId, MasteryLevel } from '../../../domain';
import { FingerLesson } from './FingerLesson';
import { CharacterQuiz } from './CharacterQuiz';
import { ContinueButton } from '../../ui/molecules/ContinueButton';
import { SurvivalGame } from '../training/SurvivalGame';
import { TrainingModeSelector } from '../../ui/organisms/TrainingModeSelector';
import { getCharsForFinger, FINGER_NAMES, FINGER_COLORS } from '../../../config/fingerMapping';
import { LEARNING_STAGES, type LearningStage } from '../../../config/fingerMnemonics';
import { ProgressJourney } from './ProgressJourney';
import {
  useFingerFundamentals,
  getLearnedFingers,
} from '../../../hooks/useFingerFundamentals';
import './FingerFundamentals.css';

// ============================================================================
// Types
// ============================================================================

interface FingerFundamentalsProps {
  inCampaignMode?: boolean;
  onChapterComplete?: () => void;
  isRevisiting?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function FingerFundamentals({
  inCampaignMode = false,
  onChapterComplete,
  isRevisiting = false,
}: FingerFundamentalsProps) {
  const ff = useFingerFundamentals({
    inCampaignMode,
    isRevisiting,
    onChapterComplete,
  });

  // Handle Enter key in stage-complete phase
  useEffect(() => {
    if (ff.phase !== 'stage-complete' || !inCampaignMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (ff.isLastStage) {
          ff.backToModeSelect();
        } else {
          ff.goToNextStage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ff.phase, inCampaignMode, ff.isLastStage, ff.backToModeSelect, ff.goToNextStage]);

  // Don't show progress on certain phases
  const showProgress =
    ff.phase !== 'welcome' &&
    ff.phase !== 'complete' &&
    ff.phase !== 'mode-select' &&
    ff.phase !== 'survival' &&
    ff.phase !== 'boss' &&
    ff.phase !== 'journey';

  return (
    <div className="finger-fundamentals">
      {showProgress && (
        <ProgressIndicator
          currentStageIndex={ff.currentStageIndex}
          completedStages={ff.completedStages}
          phase={ff.phase}
          onGoToStage={ff.goToStage}
        />
      )}

      <div className="finger-fundamentals__content">
        {ff.phase === 'mode-select' && (
          <TrainingModeSelector
            title="Finger Fundamentals"
            progress={ff.masteryProgress}
            bossDefeated={ff.bossDefeated}
            bossBestScore={ff.bossBestScore}
            bossTargetScore={ff.bossRequirements.targetScore}
            onSelectMode={ff.handleModeSelect}
            inCampaignMode={inCampaignMode}
          />
        )}

        {ff.phase === 'welcome' && (
          <WelcomeScreen
            isRevisiting={isRevisiting}
            onStartLearning={ff.startLearning}
            onStartFinalReview={ff.startFinalReview}
            onPracticeStage={ff.practiceStage}
            onQuizStage={ff.quizStage}
            onStartSurvival={() => ff.setPhase('survival')}
          />
        )}

        {ff.phase === 'learning' && ff.currentFinger && (
          <FingerLesson
            fingerId={ff.currentFinger}
            onComplete={ff.handleFingerComplete}
            onBack={ff.getLearningBackAction()}
          />
        )}

        {ff.phase === 'stage-quiz' && (
          <CharacterQuiz
            fingers={ff.currentStage.fingers}
            onComplete={
              inCampaignMode && ff.currentMode === 'learn'
                ? ff.handleStageQuizComplete
                : isRevisiting || inCampaignMode
                ? ff.backToModeSelect
                : ff.handleStageQuizComplete
            }
            onBack={inCampaignMode ? ff.backToModeSelect : () => ff.setPhase('welcome')}
            title={`Stage ${ff.currentStageIndex + 1} Quiz`}
            subtitle={`Test your knowledge of ${ff.currentStage.name.toLowerCase()}`}
            showModeSelector={true}
            skipMasteryUpdate={true}
          />
        )}

        {ff.phase === 'stage-complete' && (
          <StageCompleteScreen
            currentStage={ff.currentStage}
            currentStageIndex={ff.currentStageIndex}
            completedStages={ff.completedStages}
            totalCharsLearned={ff.totalCharsLearned}
            isLastStage={ff.isLastStage}
            inCampaignMode={inCampaignMode}
            onBackToModeSelect={ff.backToModeSelect}
            onPracticeCurrentStage={ff.practiceCurrentStage}
            onRetryStageQuiz={ff.retryStageQuiz}
            onGoToNextStage={ff.goToNextStage}
            onPracticeStage={ff.practiceStage}
            onQuizStage={ff.quizStage}
          />
        )}

        {ff.phase === 'final-review' && (
          <CharacterQuiz
            fingers={
              inCampaignMode
                ? getLearnedFingers()
                : isRevisiting
                ? ff.allFingers
                : ff.learnedFingers
            }
            characters={
              ff.currentMode === 'review-due'
                ? ff.charactersDueForReview
                : ff.currentMode === 'review-all'
                ? ff.charactersSortedByPriority
                : undefined
            }
            onComplete={inCampaignMode ? ff.backToModeSelect : ff.handleFinalReviewComplete}
            onBack={
              inCampaignMode
                ? ff.backToModeSelect
                : () => ff.setPhase(isRevisiting ? 'welcome' : 'stage-complete')
            }
            title={
              ff.currentMode === 'review-due'
                ? `Review (${ff.charactersDueForReview.length} Due)`
                : 'Review All'
            }
            subtitle={
              ff.currentMode === 'review-due'
                ? 'Practice items due for spaced repetition'
                : 'Non-mastered items first'
            }
            questionCount={
              ff.currentMode === 'review-due'
                ? Math.min(ff.charactersDueForReview.length, 20)
                : 20
            }
            showModeSelector={ff.currentMode !== 'review-due'}
          />
        )}

        {ff.phase === 'complete' && (
          <ChapterCompleteScreen
            learnedFingersCount={ff.learnedFingers.length}
            totalCharsLearned={ff.totalCharsLearned}
            inCampaignMode={inCampaignMode}
            isRevisiting={isRevisiting}
            onBackToModeSelect={ff.backToModeSelect}
            onRestart={() => {
              ff.setPhase('welcome');
            }}
          />
        )}

        {ff.phase === 'survival' && (
          <SurvivalGame
            itemType="characters"
            masteryFilter={MasteryLevel.MASTERED}
            onBack={inCampaignMode ? ff.backToModeSelect : () => ff.setPhase('welcome')}
          />
        )}

        {ff.phase === 'boss' && (
          <SurvivalGame
            itemType="characters"
            bossMode={{
              targetScorePercent: ff.bossRequirements.targetScore,
              itemCount: ff.bossRequirements.itemCount,
              title: 'Finger Fundamentals Boss Challenge',
            }}
            bossBestScore={ff.bossBestScore}
            onBossComplete={ff.handleBossComplete}
            onBack={ff.backToModeSelect}
          />
        )}

        {ff.phase === 'journey' && (
          <ProgressJourney onBack={ff.backToModeSelect} title="Your Learning Journey" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Progress Indicator
// ============================================================================

interface ProgressIndicatorProps {
  currentStageIndex: number;
  completedStages: Set<number>;
  phase: string;
  onGoToStage: (index: number) => void;
}

function ProgressIndicator({
  currentStageIndex,
  completedStages,
  phase,
  onGoToStage,
}: ProgressIndicatorProps) {
  const isInReviewPhase = phase === 'final-review' || phase === 'complete';

  return (
    <div className="finger-fundamentals__progress">
      {LEARNING_STAGES.map((stage, index) => {
        const isCompleted = completedStages.has(index);
        const isActive = !isInReviewPhase && index === currentStageIndex;
        const isClickable = isCompleted || index <= currentStageIndex;

        return (
          <div
            key={stage.id}
            className={`finger-fundamentals__progress-step ${
              isCompleted ? 'completed' : isActive ? 'active' : ''
            } ${isClickable ? 'clickable' : ''}`}
            onClick={isClickable ? () => onGoToStage(index) : undefined}
            title={isClickable ? `Go to ${stage.name}` : undefined}
          >
            <span className="finger-fundamentals__progress-dot">
              {isCompleted ? '✓' : index + 1}
            </span>
            <span className="finger-fundamentals__progress-label">{stage.name}</span>
          </div>
        );
      })}
      <div
        className={`finger-fundamentals__progress-step ${
          phase === 'final-review' || phase === 'complete' ? 'active' : ''
        }`}
      >
        <span className="finger-fundamentals__progress-dot">
          {phase === 'complete' ? '✓' : '★'}
        </span>
        <span className="finger-fundamentals__progress-label">Review</span>
      </div>
    </div>
  );
}

// ============================================================================
// Welcome Screen
// ============================================================================

interface WelcomeScreenProps {
  isRevisiting: boolean;
  onStartLearning: () => void;
  onStartFinalReview: () => void;
  onPracticeStage: (index: number) => void;
  onQuizStage: (index: number) => void;
  onStartSurvival: () => void;
}

function WelcomeScreen({
  isRevisiting,
  onStartLearning,
  onStartFinalReview,
  onPracticeStage,
  onQuizStage,
  onStartSurvival,
}: WelcomeScreenProps) {
  if (isRevisiting) {
    return (
      <div className="finger-fundamentals__welcome finger-fundamentals__welcome--revisit">
        <div className="finger-fundamentals__icon-large">
          <span className="finger-fundamentals__hands">🤚 ✋</span>
        </div>

        <h1 className="finger-fundamentals__title">Finger Fundamentals</h1>

        <p className="finger-fundamentals__subtitle">Choose a stage to practice or quiz</p>

        <div className="finger-fundamentals__stage-cards">
          {LEARNING_STAGES.map((stage, index) => (
            <div key={stage.id} className="finger-fundamentals__stage-card">
              <div className="finger-fundamentals__stage-card-header">
                <span className="finger-fundamentals__stage-badge">Stage {index + 1}</span>
                <span className="finger-fundamentals__stage-card-name">{stage.name}</span>
              </div>
              <div className="finger-fundamentals__stage-card-chars">
                {stage.fingers.map((fingerId) => (
                  <span
                    key={fingerId}
                    className="finger-fundamentals__stage-card-finger"
                    style={{ color: FINGER_COLORS[fingerId] }}
                  >
                    {getCharsForFinger(fingerId)
                      .map((c) => c.toUpperCase())
                      .join(' ')}
                  </span>
                ))}
              </div>
              <div className="finger-fundamentals__stage-card-actions">
                <button
                  className="finger-fundamentals__stage-card-btn"
                  onClick={() => onPracticeStage(index)}
                >
                  Practice
                </button>
                <button
                  className="finger-fundamentals__stage-card-btn finger-fundamentals__stage-card-btn--primary"
                  onClick={() => onQuizStage(index)}
                >
                  Quiz
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="finger-fundamentals__full-review">
          <button className="finger-fundamentals__review-btn" onClick={onStartFinalReview}>
            Full Character Review (All Stages)
          </button>
        </div>

        <div className="finger-fundamentals__survival-section">
          <button className="finger-fundamentals__survival-btn" onClick={onStartSurvival}>
            🎮 Survival Mode
          </button>
          <p className="finger-fundamentals__survival-hint">
            Test your speed! Answer correctly before time runs out.
          </p>
        </div>

        <button className="finger-fundamentals__restart-btn" onClick={onStartLearning}>
          Start From Beginning
        </button>
      </div>
    );
  }

  return (
    <div className="finger-fundamentals__welcome">
      <div className="finger-fundamentals__icon-large">
        <span className="finger-fundamentals__hands">🤚 ✋</span>
      </div>

      <h1 className="finger-fundamentals__title">Chapter 1: Finger Fundamentals</h1>

      <p className="finger-fundamentals__subtitle">
        Master the connection between your fingers and characters
      </p>

      <div className="finger-fundamentals__stages-preview">
        {LEARNING_STAGES.map((stage, index) => (
          <div key={stage.id} className="finger-fundamentals__stage-preview">
            <span className="finger-fundamentals__stage-number">{index + 1}</span>
            <div className="finger-fundamentals__stage-info">
              <span className="finger-fundamentals__stage-name">{stage.name}</span>
              <span className="finger-fundamentals__stage-desc">{stage.description}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="finger-fundamentals__start-btn" onClick={onStartLearning}>
        Begin Training
      </button>
    </div>
  );
}

// ============================================================================
// Stage Complete Screen
// ============================================================================

interface StageCompleteScreenProps {
  currentStage: LearningStage;
  currentStageIndex: number;
  completedStages: Set<number>;
  totalCharsLearned: number;
  isLastStage: boolean;
  inCampaignMode: boolean;
  onBackToModeSelect: () => void;
  onPracticeCurrentStage: () => void;
  onRetryStageQuiz: () => void;
  onGoToNextStage: () => void;
  onPracticeStage: (index: number) => void;
  onQuizStage: (index: number) => void;
}

function StageCompleteScreen({
  currentStage,
  currentStageIndex,
  completedStages,
  totalCharsLearned,
  isLastStage,
  inCampaignMode,
  onBackToModeSelect,
  onPracticeCurrentStage,
  onRetryStageQuiz,
  onGoToNextStage,
  onPracticeStage,
  onQuizStage,
}: StageCompleteScreenProps) {
  const previousStages = LEARNING_STAGES.slice(0, currentStageIndex);

  return (
    <div className="finger-fundamentals__stage-complete">
      <div className="finger-fundamentals__celebration">
        <span className="finger-fundamentals__celebration-emoji">🎉</span>
      </div>

      <h2 className="finger-fundamentals__stage-title">Stage {currentStageIndex + 1} Complete!</h2>

      <p className="finger-fundamentals__stage-summary">
        You've learned {currentStage.name.toLowerCase()}: {currentStage.description}
      </p>

      <div className="finger-fundamentals__learned-chars">
        {currentStage.fingers.map((fingerId) => (
          <div key={fingerId} className="finger-fundamentals__finger-row">
            <span
              className="finger-fundamentals__finger-dot"
              style={{ backgroundColor: FINGER_COLORS[fingerId] }}
            />
            <span className="finger-fundamentals__finger-label">{FINGER_NAMES[fingerId]}</span>
            <span className="finger-fundamentals__finger-chars">
              {getCharsForFinger(fingerId)
                .map((c) => c.toUpperCase())
                .join(' ')}
            </span>
          </div>
        ))}
      </div>

      <div className="finger-fundamentals__stage-actions">
        {inCampaignMode && (
          <button className="finger-fundamentals__practice-btn" onClick={onBackToModeSelect}>
            Back to Mode Selection
          </button>
        )}
        {!inCampaignMode && (
          <>
            <button className="finger-fundamentals__practice-btn" onClick={onPracticeCurrentStage}>
              Practice More
            </button>
            <button className="finger-fundamentals__quiz-btn" onClick={onRetryStageQuiz}>
              Quiz Again
            </button>
          </>
        )}
        {!isLastStage && (
          <button className="finger-fundamentals__next-btn" onClick={onGoToNextStage}>
            Continue Learning More →
          </button>
        )}
        {isLastStage && inCampaignMode && (
          <button className="finger-fundamentals__next-btn" onClick={onBackToModeSelect}>
            Continue →
          </button>
        )}
        {isLastStage && !inCampaignMode && (
          <button className="finger-fundamentals__next-btn" onClick={onGoToNextStage}>
            Final Review →
          </button>
        )}
      </div>

      {previousStages.length > 0 && (
        <div className="finger-fundamentals__previous-stages">
          <h3 className="finger-fundamentals__previous-title">Review Previous Stages</h3>
          <div className="finger-fundamentals__previous-list">
            {previousStages.map((stage, index) => (
              <div key={stage.id} className="finger-fundamentals__previous-item">
                <span className="finger-fundamentals__previous-name">
                  Stage {index + 1}: {stage.name}
                </span>
                <div className="finger-fundamentals__previous-actions">
                  <button
                    className="finger-fundamentals__mini-btn"
                    onClick={() => onPracticeStage(index)}
                  >
                    Practice
                  </button>
                  <button
                    className="finger-fundamentals__mini-btn"
                    onClick={() => onQuizStage(index)}
                  >
                    Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="finger-fundamentals__progress-text">
        {completedStages.size} of {LEARNING_STAGES.length} stages complete • {totalCharsLearned}{' '}
        characters learned
      </p>
    </div>
  );
}

// ============================================================================
// Chapter Complete Screen
// ============================================================================

interface ChapterCompleteScreenProps {
  learnedFingersCount: number;
  totalCharsLearned: number;
  inCampaignMode: boolean;
  isRevisiting: boolean;
  onBackToModeSelect: () => void;
  onRestart: () => void;
}

function ChapterCompleteScreen({
  learnedFingersCount,
  totalCharsLearned,
  inCampaignMode,
  isRevisiting,
  onBackToModeSelect,
  onRestart,
}: ChapterCompleteScreenProps) {
  return (
    <div className="finger-fundamentals__complete">
      <div className="finger-fundamentals__trophy">
        <span className="finger-fundamentals__trophy-emoji">🏆</span>
      </div>

      <h2 className="finger-fundamentals__complete-title">Chapter 1 Complete!</h2>

      <p className="finger-fundamentals__complete-text">
        You've mastered all finger-to-character mappings. You're ready to learn power chords!
      </p>

      <div className="finger-fundamentals__stats">
        <div className="finger-fundamentals__stat">
          <span className="finger-fundamentals__stat-value">{LEARNING_STAGES.length}</span>
          <span className="finger-fundamentals__stat-label">Stages Completed</span>
        </div>
        <div className="finger-fundamentals__stat">
          <span className="finger-fundamentals__stat-value">{learnedFingersCount}</span>
          <span className="finger-fundamentals__stat-label">Fingers Learned</span>
        </div>
        <div className="finger-fundamentals__stat">
          <span className="finger-fundamentals__stat-value">{totalCharsLearned}</span>
          <span className="finger-fundamentals__stat-label">Characters Mastered</span>
        </div>
      </div>

      {inCampaignMode && !isRevisiting ? (
        <ContinueButton
          onContinue={onBackToModeSelect}
          message="Great job! Challenge the boss to complete this chapter."
          buttonText="Continue"
        />
      ) : (
        <button className="finger-fundamentals__finish-btn" onClick={onRestart}>
          Practice Again
        </button>
      )}
    </div>
  );
}

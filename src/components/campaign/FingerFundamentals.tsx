/**
 * Finger Fundamentals Component
 *
 * Chapter 1 of Campaign Mode: Teaches all fingers in stages (2 fingers at a time),
 * with quizzes between stages and the option to practice as long as desired.
 *
 * Learning Flow:
 * 1. Welcome/Overview
 * 2. Stage 1: Index Fingers (E,R + T,A) → Practice → Quiz (optional repeat)
 * 3. Stage 2: Middle Fingers (O,I + N,L) → Practice → Quiz
 * 4. Stage 3: Ring Fingers (U + S,Y) → Practice → Quiz
 * 5. Stage 4: Inner Thumbs → Practice → Quiz
 * 6. Stage 5: Outer Thumbs → Practice → Quiz
 * 7. Final Review Quiz
 * 8. Chapter Complete
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FingerId, MasteryLevel } from '../../domain';
import { useCampaign, ChapterId, BOSS_REQUIREMENTS } from '../../campaign';
import { getServiceRepositories } from '../../services';
import { FingerLesson } from './FingerLesson';
import { CharacterQuiz } from './CharacterQuiz';
import { ContinueButton } from './ContinueButton';
import { SurvivalGame, BossResult } from '../training/SurvivalGame';
import { TrainingModeSelector, TrainingMode } from '../training/TrainingModeSelector';
import { getCharsForFinger, FINGER_NAMES, FINGER_COLORS } from '../../config/fingerMapping';
import { LEARNING_STAGES, LearningStage } from '../../config/fingerMnemonics';
import { ProgressJourney } from './ProgressJourney';
import './FingerFundamentals.css';

/**
 * Find the first stage that has characters not yet learned (practiced at least once).
 * Returns the stage index, or 0 if all have been learned (to restart from beginning).
 */
function findNextStageToLearn(): number {
  const { progress } = getServiceRepositories();

  for (let stageIndex = 0; stageIndex < LEARNING_STAGES.length; stageIndex++) {
    const stage = LEARNING_STAGES[stageIndex];

    // Check if any character in this stage has never been practiced
    for (const fingerId of stage.fingers) {
      const chars = getCharsForFinger(fingerId as FingerId);
      for (const char of chars) {
        const p = progress.getProgress(char, 'character');
        // If no progress or never practiced, this stage needs learning
        if (!p || p.totalAttempts === 0) {
          return stageIndex;
        }
      }
    }
  }

  // All stages have been learned at least once, start from beginning for extra practice
  return 0;
}

/**
 * Get fingers that have at least one character with progress (learned).
 * Returns only fingers where the user has practiced at least one character.
 */
function getLearnedFingers(): FingerId[] {
  const { progress } = getServiceRepositories();
  const learnedFingers: FingerId[] = [];

  for (const stage of LEARNING_STAGES) {
    for (const fingerId of stage.fingers) {
      const chars = getCharsForFinger(fingerId as FingerId);
      // Check if any character in this finger has been practiced
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

type ChapterPhase =
  | 'mode-select'   // Mode selection (for campaign mode)
  | 'welcome'
  | 'learning'      // Learning individual fingers in current stage
  | 'stage-quiz'    // Quiz for current stage
  | 'stage-complete' // Celebration after completing a stage
  | 'final-review'  // Final review quiz of all characters
  | 'complete'
  | 'survival'      // Survival game mode
  | 'boss'          // Boss challenge mode
  | 'journey';      // Progress journey view

interface FingerFundamentalsProps {
  /** Whether this is in campaign mode */
  inCampaignMode?: boolean;
  /** Callback when chapter is complete (campaign mode) */
  onChapterComplete?: () => void;
  /** Whether user is revisiting a completed chapter */
  isRevisiting?: boolean;
}

export function FingerFundamentals({
  inCampaignMode = false,
  onChapterComplete,
  isRevisiting = false,
}: FingerFundamentalsProps) {
  const campaign = useCampaign();

  // Chapter ID for finger fundamentals
  const chapterId = ChapterId.FINGER_FUNDAMENTALS;
  const bossRequirements = BOSS_REQUIREMENTS[chapterId];

  // Counter to force refresh of memoized values when returning from quiz
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Get mastery progress for this chapter
  const masteryProgress = useMemo(() => {
    return campaign.getChapterMasteryProgress(chapterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, chapterId, refreshCounter]);

  // Boss status
  const bossDefeated = campaign.campaignState.chapters[chapterId]?.bossDefeated ?? false;
  const bossBestScore = campaign.campaignState.chapters[chapterId]?.bossBestScore ?? 0;

  // Start with mode-select for campaign mode or revisiting
  const [phase, setPhase] = useState<ChapterPhase>(
    isRevisiting || inCampaignMode ? 'mode-select' : 'welcome'
  );
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [currentMode, setCurrentMode] = useState<TrainingMode>('learn');

  const currentStage = LEARNING_STAGES[currentStageIndex];
  const currentFinger = currentStage?.fingers[currentFingerIndex];

  // Get all characters learned so far (for quizzes)
  const learnedFingers = useMemo(() => {
    const fingers: FingerId[] = [];
    for (let i = 0; i <= currentStageIndex; i++) {
      fingers.push(...LEARNING_STAGES[i].fingers);
    }
    return fingers;
  }, [currentStageIndex]);

  // Get total character count for all stages up to and including current
  const totalCharsLearned = useMemo(() => {
    return learnedFingers.reduce((sum, f) => sum + getCharsForFinger(f).length, 0);
  }, [learnedFingers]);

  // Get characters that are due for review (for review-due mode) - randomized
  const charactersDueForReview = useMemo(() => {
    const { progress } = getServiceRepositories();
    const dueItems = progress.getItemsDueForReview('character');
    const chars = dueItems.map((p) => p.itemId);
    // Shuffle for variety
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  // Get all learned characters for review-all mode
  // Non-mastered items are shuffled for variety, mastered items come last
  const charactersSortedByPriority = useMemo(() => {
    const { progress, characters } = getServiceRepositories();
    const allChars = characters.getAll();

    // Get progress for each character
    const charsWithProgress = allChars
      .map((c) => ({
        char: c.char,
        progress: progress.getProgress(c.char, 'character'),
      }))
      .filter((c) => c.progress && c.progress.totalAttempts > 0); // Only learned chars

    // Separate into non-mastered and mastered
    const nonMastered = charsWithProgress.filter(
      (c) => c.progress?.masteryLevel !== 'mastered'
    );
    const mastered = charsWithProgress.filter(
      (c) => c.progress?.masteryLevel === 'mastered'
    );

    // Shuffle non-mastered items for variety
    for (let i = nonMastered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonMastered[i], nonMastered[j]] = [nonMastered[j], nonMastered[i]];
    }

    // Combine: shuffled non-mastered first, then mastered at the end
    return [...nonMastered, ...mastered].map((c) => c.char);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  // Handle finger lesson completion
  const handleFingerComplete = useCallback(() => {
    if (currentFingerIndex < currentStage.fingers.length - 1) {
      // More fingers in this stage
      setCurrentFingerIndex(currentFingerIndex + 1);
    } else {
      // Stage learning complete, go to stage quiz
      setPhase('stage-quiz');
    }
  }, [currentFingerIndex, currentStage]);

  // Handle stage quiz completion
  const handleStageQuizComplete = useCallback(() => {
    setCompletedStages(prev => new Set(prev).add(currentStageIndex));
    setPhase('stage-complete');
  }, [currentStageIndex]);

  // Move to next stage
  const goToNextStage = useCallback(() => {
    if (currentStageIndex < LEARNING_STAGES.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
      setCurrentFingerIndex(0);
      setPhase('learning');
    } else {
      // All stages complete, go to final review
      setPhase('final-review');
    }
  }, [currentStageIndex]);

  // Retry current stage quiz
  const retryStageQuiz = useCallback(() => {
    setPhase('stage-quiz');
  }, []);

  // Go back to practice current stage
  const practiceCurrentStage = useCallback(() => {
    setCurrentFingerIndex(0);
    setPhase('learning');
  }, []);

  // Navigate to a specific stage (for going back to previous stages)
  const goToStage = useCallback((stageIndex: number) => {
    setCurrentStageIndex(stageIndex);
    setCurrentFingerIndex(0);
    setPhase('stage-complete');
  }, []);

  // Practice a specific previous stage
  const practiceStage = useCallback((stageIndex: number) => {
    setCurrentStageIndex(stageIndex);
    setCurrentFingerIndex(0);
    setPhase('learning');
  }, []);

  // Quiz a specific previous stage
  const quizStage = useCallback((stageIndex: number) => {
    setCurrentStageIndex(stageIndex);
    setPhase('stage-quiz');
  }, []);

  // Handle final review completion
  const handleFinalReviewComplete = useCallback(() => {
    setPhase('complete');
  }, []);

  // Start learning from welcome
  const startLearning = useCallback(() => {
    setCurrentStageIndex(0);
    setCurrentFingerIndex(0);
    setPhase('learning');
  }, []);

  // Get all fingers for final review
  const allFingers = useMemo(() => {
    return LEARNING_STAGES.flatMap(stage => stage.fingers);
  }, []);

  // Start final review directly (for revisiting)
  const startFinalReview = useCallback(() => {
    setPhase('final-review');
  }, []);

  // Back to mode selection (increments refresh counter to update progress display)
  const backToModeSelect = useCallback(() => {
    setRefreshCounter((c) => c + 1);
    setPhase('mode-select');
  }, []);

  // Handle mode selection from TrainingModeSelector
  const handleModeSelect = useCallback((mode: TrainingMode) => {
    setCurrentMode(mode);
    setCurrentFingerIndex(0);
    setCompletedStages(new Set());

    switch (mode) {
      case 'learn': {
        // Find the next stage that needs learning
        const nextStage = findNextStageToLearn();
        setCurrentStageIndex(nextStage);
        // Go directly to learning phase, skip welcome for returning users
        setPhase('learning');
        break;
      }
      case 'review-due':
      case 'review-all':
        setCurrentStageIndex(0);
        // Start final review for review modes
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

  // Handle boss mode completion
  const handleBossComplete = useCallback((result: BossResult) => {
    campaign.recordBossAttempt(chapterId, result.scorePercent);

    // If boss is defeated, auto-complete the chapter (boss defeat is the only requirement)
    if (result.passed) {
      campaign.completeChapter(chapterId);
    }
  }, [campaign, chapterId]);

  // Render mode select phase using TrainingModeSelector
  const renderModeSelectPhase = () => {
    return (
      <TrainingModeSelector
        title="Finger Fundamentals"
        progress={masteryProgress}
        bossDefeated={bossDefeated}
        bossBestScore={bossBestScore}
        bossTargetScore={bossRequirements.targetScore}
        onSelectMode={handleModeSelect}
        inCampaignMode={inCampaignMode}
      />
    );
  };

  // Render welcome phase (different view when revisiting completed chapter)
  const renderWelcome = () => {
    // When revisiting a completed chapter, show quick access to all stages
    if (isRevisiting) {
      return (
        <div className="finger-fundamentals__welcome finger-fundamentals__welcome--revisit">
          <div className="finger-fundamentals__icon-large">
            <span className="finger-fundamentals__hands">🤚 ✋</span>
          </div>

          <h1 className="finger-fundamentals__title">Finger Fundamentals</h1>

          <p className="finger-fundamentals__subtitle">
            Choose a stage to practice or quiz
          </p>

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
                      {getCharsForFinger(fingerId).map(c => c.toUpperCase()).join(' ')}
                    </span>
                  ))}
                </div>
                <div className="finger-fundamentals__stage-card-actions">
                  <button
                    className="finger-fundamentals__stage-card-btn"
                    onClick={() => practiceStage(index)}
                  >
                    Practice
                  </button>
                  <button
                    className="finger-fundamentals__stage-card-btn finger-fundamentals__stage-card-btn--primary"
                    onClick={() => quizStage(index)}
                  >
                    Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Full review option */}
          <div className="finger-fundamentals__full-review">
            <button
              className="finger-fundamentals__review-btn"
              onClick={startFinalReview}
            >
              Full Character Review (All Stages)
            </button>
          </div>

          {/* Survival mode option */}
          <div className="finger-fundamentals__survival-section">
            <button
              className="finger-fundamentals__survival-btn"
              onClick={() => setPhase('survival')}
            >
              🎮 Survival Mode
            </button>
            <p className="finger-fundamentals__survival-hint">
              Test your speed! Answer correctly before time runs out.
            </p>
          </div>

          <button
            className="finger-fundamentals__restart-btn"
            onClick={startLearning}
          >
            Start From Beginning
          </button>
        </div>
      );
    }

    // First-time welcome screen
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

        <button className="finger-fundamentals__start-btn" onClick={startLearning}>
          Begin Training
        </button>
      </div>
    );
  };

  // Render stage complete celebration
  const renderStageComplete = () => {
    const isLastStage = currentStageIndex === LEARNING_STAGES.length - 1;
    const previousStages = LEARNING_STAGES.slice(0, currentStageIndex);

    return (
      <div className="finger-fundamentals__stage-complete">
        <div className="finger-fundamentals__celebration">
          <span className="finger-fundamentals__celebration-emoji">🎉</span>
        </div>

        <h2 className="finger-fundamentals__stage-title">
          Stage {currentStageIndex + 1} Complete!
        </h2>

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
              <span className="finger-fundamentals__finger-label">
                {FINGER_NAMES[fingerId]}
              </span>
              <span className="finger-fundamentals__finger-chars">
                {getCharsForFinger(fingerId).map(c => c.toUpperCase()).join(' ')}
              </span>
            </div>
          ))}
        </div>

        <div className="finger-fundamentals__stage-actions">
          <button
            className="finger-fundamentals__practice-btn"
            onClick={practiceCurrentStage}
          >
            Practice More
          </button>
          <button
            className="finger-fundamentals__quiz-btn"
            onClick={retryStageQuiz}
          >
            Quiz Again
          </button>
          <button
            className="finger-fundamentals__next-btn"
            onClick={goToNextStage}
          >
            {isLastStage ? 'Final Review' : `Continue to Stage ${currentStageIndex + 2}`} →
          </button>
        </div>

        {/* Previous stages for review */}
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
                      onClick={() => practiceStage(index)}
                    >
                      Practice
                    </button>
                    <button
                      className="finger-fundamentals__mini-btn"
                      onClick={() => quizStage(index)}
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
          {completedStages.size} of {LEARNING_STAGES.length} stages complete
          {' • '}
          {totalCharsLearned} characters learned
        </p>
      </div>
    );
  };

  // Render chapter complete
  const renderComplete = () => (
    <div className="finger-fundamentals__complete">
      <div className="finger-fundamentals__trophy">
        <span className="finger-fundamentals__trophy-emoji">🏆</span>
      </div>

      <h2 className="finger-fundamentals__complete-title">
        Chapter 1 Complete!
      </h2>

      <p className="finger-fundamentals__complete-text">
        You've mastered all finger-to-character mappings.
        You're ready to learn power chords!
      </p>

      <div className="finger-fundamentals__stats">
        <div className="finger-fundamentals__stat">
          <span className="finger-fundamentals__stat-value">
            {LEARNING_STAGES.length}
          </span>
          <span className="finger-fundamentals__stat-label">Stages Completed</span>
        </div>
        <div className="finger-fundamentals__stat">
          <span className="finger-fundamentals__stat-value">
            {learnedFingers.length}
          </span>
          <span className="finger-fundamentals__stat-label">Fingers Learned</span>
        </div>
        <div className="finger-fundamentals__stat">
          <span className="finger-fundamentals__stat-value">
            {totalCharsLearned}
          </span>
          <span className="finger-fundamentals__stat-label">Characters Mastered</span>
        </div>
      </div>

      {/* Campaign mode: Continue button - goes back to mode selection (not chapter complete) */}
      {inCampaignMode && !isRevisiting ? (
        <ContinueButton
          onContinue={backToModeSelect}
          message="Great job! Challenge the boss to complete this chapter."
          buttonText="Continue"
        />
      ) : (
        <button
          className="finger-fundamentals__finish-btn"
          onClick={() => {
            setPhase('welcome');
            setCompletedStages(new Set());
          }}
        >
          Practice Again
        </button>
      )}
    </div>
  );

  // Render progress indicator (clickable for completed stages)
  const renderProgress = () => {
    // Don't highlight individual stages when in final-review or complete phase
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
                isCompleted ? 'completed' :
                isActive ? 'active' : ''
              } ${isClickable ? 'clickable' : ''}`}
              onClick={isClickable ? () => goToStage(index) : undefined}
              title={isClickable ? `Go to ${stage.name}` : undefined}
            >
              <span className="finger-fundamentals__progress-dot">
                {isCompleted ? '✓' : index + 1}
              </span>
              <span className="finger-fundamentals__progress-label">
                {stage.name}
              </span>
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
  };

  // Determine back phase for learning
  const getLearningBackPhase = () => {
    if (inCampaignMode) return () => backToModeSelect();
    if (isRevisiting) return () => setPhase('welcome');
    if (currentFingerIndex === 0 && currentStageIndex === 0) return () => setPhase('welcome');
    if (currentFingerIndex === 0) return () => {
      setCurrentStageIndex(currentStageIndex - 1);
      setPhase('stage-complete');
    };
    return undefined;
  };

  // Don't show progress on mode-select, survival, boss, journey phases
  const showProgress = phase !== 'welcome' && phase !== 'complete' && phase !== 'mode-select' && phase !== 'survival' && phase !== 'boss' && phase !== 'journey';

  return (
    <div className="finger-fundamentals">
      {showProgress && renderProgress()}

      <div className="finger-fundamentals__content">
        {phase === 'mode-select' && renderModeSelectPhase()}

        {phase === 'welcome' && renderWelcome()}

        {phase === 'learning' && currentFinger && (
          <FingerLesson
            fingerId={currentFinger}
            onComplete={handleFingerComplete}
            onBack={getLearningBackPhase()}
          />
        )}

        {phase === 'stage-quiz' && (
          <CharacterQuiz
            fingers={currentStage.fingers}
            onComplete={isRevisiting || inCampaignMode ? backToModeSelect : handleStageQuizComplete}
            onBack={inCampaignMode ? backToModeSelect : () => setPhase('welcome')}
            title={`Stage ${currentStageIndex + 1} Quiz`}
            subtitle={`Test your knowledge of ${currentStage.name.toLowerCase()}`}
            showModeSelector={true}
            skipMasteryUpdate={true}
          />
        )}

        {phase === 'stage-complete' && renderStageComplete()}

        {phase === 'final-review' && (
          <CharacterQuiz
            fingers={inCampaignMode ? getLearnedFingers() : (isRevisiting ? allFingers : learnedFingers)}
            characters={
              currentMode === 'review-due' ? charactersDueForReview :
              currentMode === 'review-all' ? charactersSortedByPriority :
              undefined
            }
            onComplete={inCampaignMode ? backToModeSelect : handleFinalReviewComplete}
            onBack={inCampaignMode ? backToModeSelect : () => setPhase(isRevisiting ? 'welcome' : 'stage-complete')}
            title={currentMode === 'review-due' ? `Review (${charactersDueForReview.length} Due)` : "Review All"}
            subtitle={currentMode === 'review-due' ? "Practice items due for spaced repetition" : "Non-mastered items first"}
            questionCount={currentMode === 'review-due' ? Math.min(charactersDueForReview.length, 20) : 20}
            showModeSelector={currentMode !== 'review-due'}
          />
        )}

        {phase === 'complete' && renderComplete()}

        {phase === 'survival' && (
          <SurvivalGame
            itemType="characters"
            masteryFilter={MasteryLevel.MASTERED}
            onBack={inCampaignMode ? backToModeSelect : () => setPhase('welcome')}
          />
        )}

        {phase === 'boss' && (
          <SurvivalGame
            itemType="characters"
            bossMode={{
              targetScorePercent: bossRequirements.targetScore,
              itemCount: bossRequirements.itemCount,
              title: 'Finger Fundamentals Boss Challenge',
            }}
            bossBestScore={bossBestScore}
            onBossComplete={handleBossComplete}
            onBack={backToModeSelect}
          />
        )}

        {phase === 'journey' && (
          <ProgressJourney
            onBack={backToModeSelect}
            title="Your Learning Journey"
          />
        )}
      </div>
    </div>
  );
}

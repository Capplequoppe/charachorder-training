/**
 * Survival Game Component
 *
 * Time-based challenge mode where the user must answer correctly on the first try
 * within a time limit. Game over on the first miss.
 *
 * Business logic extracted to useSurvivalGame hook.
 */

import React from 'react';
import { MasteryLevel } from '../../../domain';
import { getHighScoreService } from '../../../services';
import { FINGER_NAMES, FINGER_COLORS } from '../../../config/fingerMapping';
import { ColoredFinger } from '../../ui/atoms/ColoredFinger';
import { CharacterWithReference } from '../../ui/atoms/CharacterWithReference';
import {
  useSurvivalGame,
  DIFFICULTY_SETTINGS,
  BOSS_LIVES,
  toHighScoreCategory,
  type SurvivalDifficulty,
  type SurvivalItemType,
  type BossModeConfig,
  type BossResult,
} from '../../../hooks/useSurvivalGame';
import './training.css';

// ============================================================================
// Re-export types for consumers
// ============================================================================

export type { SurvivalDifficulty, SurvivalItemType, BossModeConfig, BossResult };

// ============================================================================
// Props
// ============================================================================

export interface SurvivalGameProps {
  itemType: SurvivalItemType;
  masteryFilter?: MasteryLevel;
  bossMode?: BossModeConfig;
  bossBestScore?: number;
  onComplete?: (score: number, isNewHighScore: boolean) => void;
  onBossComplete?: (result: BossResult) => void;
  onBack?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function SurvivalGame({
  itemType,
  masteryFilter,
  bossMode,
  bossBestScore = 0,
  onComplete,
  onBossComplete,
  onBack,
}: SurvivalGameProps): React.ReactElement {
  const game = useSurvivalGame({
    itemType,
    masteryFilter,
    bossMode,
    bossBestScore,
    onComplete,
    onBossComplete,
  });

  const getTitle = () => {
    switch (itemType) {
      case 'left-hand':
        return 'Left Hand Survival';
      case 'right-hand':
        return 'Right Hand Survival';
      case 'cross-hand':
        return 'Cross-Hand Survival';
      case 'all-power-chords':
        return 'All Power Chords Survival';
      case 'word-chords':
        return 'Word Chords Survival';
      case 'fingers':
        return 'Finger Fundamentals Survival';
      default:
        return 'Survival Game';
    }
  };

  return (
    <div className="survival-game">
      {game.phase === 'select-difficulty' && (
        <DifficultySelectScreen
          bossMode={bossMode}
          items={game.items}
          itemType={itemType}
          masteryFilter={masteryFilter}
          title={getTitle()}
          onStartGame={game.startGame}
          onBack={onBack}
        />
      )}
      {game.phase === 'countdown' && <CountdownScreen countdownValue={game.countdownValue} />}
      {game.phase === 'playing' && (
        <PlayingScreen
          game={game}
          bossMode={bossMode}
        />
      )}
      {game.phase === 'game-over' && (
        <GameOverScreen
          game={game}
          bossMode={bossMode}
          bossBestScore={bossBestScore}
          itemType={itemType}
          onBack={onBack}
        />
      )}
    </div>
  );
}

// ============================================================================
// Difficulty Select Screen
// ============================================================================

interface DifficultySelectScreenProps {
  bossMode?: BossModeConfig;
  items: unknown[];
  itemType: SurvivalItemType;
  masteryFilter?: MasteryLevel;
  title: string;
  onStartGame: (difficulty: SurvivalDifficulty) => void;
  onBack?: () => void;
}

function DifficultySelectScreen({
  bossMode,
  items,
  itemType,
  masteryFilter,
  title,
  onStartGame,
  onBack,
}: DifficultySelectScreenProps) {
  const highScoreService = getHighScoreService();

  if (bossMode) {
    const totalItems = Math.min(bossMode.itemCount, items.length);
    return (
      <div className="training-phase survival-select boss-select">
        <h2>🏆 {bossMode.title || 'Boss Challenge'}</h2>
        <p className="subtitle">Prove your mastery!</p>

        <div className="boss-requirements">
          <div className="boss-req-item">
            <span className="boss-req-label">Items</span>
            <span className="boss-req-value">{totalItems}</span>
          </div>
          <div className="boss-req-item">
            <span className="boss-req-label">Time per item</span>
            <span className="boss-req-value">3 seconds</span>
          </div>
          <div className="boss-req-item">
            <span className="boss-req-label">Lives</span>
            <span className="boss-req-value">{'❤️'.repeat(BOSS_LIVES)}</span>
          </div>
          <div className="boss-req-item">
            <span className="boss-req-label">Target Score</span>
            <span className="boss-req-value">{bossMode.targetScorePercent}%</span>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="boss-no-items">No mastered items available for this challenge yet!</p>
        ) : (
          <button className="btn primary boss-start-btn" onClick={() => onStartGame('intermediate')}>
            Start Challenge
          </button>
        )}

        {onBack && (
          <button className="btn secondary back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="training-phase survival-select">
      <h2>{title}</h2>
      <p className="subtitle">Choose your difficulty</p>

      {items.length === 0 ? (
        <div className="survival-no-items">
          <p className="survival-no-items-text">
            {masteryFilter === MasteryLevel.MASTERED
              ? 'No mastered items available yet! Complete some review sessions to master characters first.'
              : 'No items available for this challenge.'}
          </p>
        </div>
      ) : (
        <div className="difficulty-options">
          {(Object.keys(DIFFICULTY_SETTINGS) as SurvivalDifficulty[]).map((diff) => {
            const setting = DIFFICULTY_SETTINGS[diff];
            const hs = highScoreService.getHighScore(toHighScoreCategory(itemType), diff);
            return (
              <button
                key={diff}
                className={`difficulty-option ${diff}`}
                onClick={() => onStartGame(diff)}
              >
                <span className="difficulty-label">{setting.label}</span>
                <span className="difficulty-desc">{setting.description}</span>
                {hs > 0 && <span className="difficulty-highscore">Best: {hs}</span>}
              </button>
            );
          })}
        </div>
      )}

      {onBack && (
        <button className="btn secondary back-btn" onClick={onBack}>
          ← Back
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Countdown Screen
// ============================================================================

interface CountdownScreenProps {
  countdownValue: number;
}

function CountdownScreen({ countdownValue }: CountdownScreenProps) {
  return (
    <div className="training-phase survival-countdown">
      <p className="countdown-label">Get Ready!</p>
      <div className="countdown-number">{countdownValue > 0 ? countdownValue : 'GO!'}</div>
      <p className="countdown-hint">Position your hands...</p>
    </div>
  );
}

// ============================================================================
// Playing Screen
// ============================================================================

interface PlayingScreenProps {
  game: ReturnType<typeof useSurvivalGame>;
  bossMode?: BossModeConfig;
}

function PlayingScreen({ game, bossMode }: PlayingScreenProps) {
  const { currentItem, settings, timeRemaining, feedback, score, lives, bossItemsCompleted, highScore } = game;

  if (!currentItem) return null;

  const timePercent = (timeRemaining / settings.timeLimitMs) * 100;
  const isLow = timePercent < 25;

  return (
    <div className={`training-phase survival-playing ${feedback ?? ''}`}>
      <div className={`survival-header ${bossMode ? 'survival-header--boss' : ''}`}>
        {bossMode ? (
          <>
            <span className="survival-progress">
              Progress: {bossItemsCompleted + 1}/{game.totalBossItems}
            </span>
            <span className="survival-lives">
              {'❤️'.repeat(lives)}
              {'🖤'.repeat(BOSS_LIVES - lives)}
            </span>
            <span className="survival-score">Score: {score}</span>
          </>
        ) : (
          <>
            <span className="survival-score">Score: {score}</span>
            <span className="survival-high">Best: {highScore}</span>
          </>
        )}
      </div>

      <div className={`survival-timer ${isLow ? 'low' : ''}`}>
        <div className="survival-timer-bar" style={{ width: `${timePercent}%` }} />
      </div>

      {currentItem.type === 'power-chord' && (
        <PowerChordDisplay challenge={currentItem} />
      )}

      {currentItem.type === 'character' && (
        <CharacterDisplay challenge={currentItem} />
      )}

      {currentItem.type === 'finger' && (
        <FingerDisplay challenge={currentItem} />
      )}

      {currentItem.type === 'word' && (
        <WordDisplay challenge={currentItem} />
      )}

      <input
        ref={game.inputRef}
        type="text"
        value={game.textInput}
        onChange={game.handleTextInputChange}
        className="chord-input chord-input--hidden"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-hidden="true"
      />

      {feedback === 'correct' && <div className="feedback correct">Correct!</div>}
    </div>
  );
}

// ============================================================================
// Challenge Display Components
// ============================================================================

interface PowerChordDisplayProps {
  challenge: { powerChord: { characters: readonly { char: string; color: string; displayChar: string }[] }; reverseDisplay: boolean };
}

function PowerChordDisplay({ challenge }: PowerChordDisplayProps) {
  const chars = challenge.powerChord.characters;
  const first = challenge.reverseDisplay ? chars[1] : chars[0];
  const second = challenge.reverseDisplay ? chars[0] : chars[1];

  return (
    <div className="power-chord-display survival-target">
      <span className="character large" style={{ color: first.color }}>
        {first.displayChar}
      </span>
      <span className="plus">+</span>
      <span className="character large" style={{ color: second.color }}>
        {second.displayChar}
      </span>
    </div>
  );
}

interface CharacterDisplayProps {
  challenge: { char: string; color: string };
}

function CharacterDisplay({ challenge }: CharacterDisplayProps) {
  return (
    <div className="character-challenge-display survival-target">
      <p className="character-prompt">Press:</p>
      <div className="character-display-wrapper">
        <CharacterWithReference
          char={challenge.char}
          color={challenge.color}
          showLabel={true}
          fontSize={6}
        />
      </div>
    </div>
  );
}

interface FingerDisplayProps {
  challenge: { fingerId: string; validChars: string[] };
}

function FingerDisplay({ challenge }: FingerDisplayProps) {
  const fingerId = challenge.fingerId as keyof typeof FINGER_NAMES;

  return (
    <div className="finger-challenge-display survival-target">
      <div className="finger-indicator-large">
        <ColoredFinger fingerId={fingerId} isActive size="large" showLabel />
      </div>
      <p className="finger-hint">
        Press any key for{' '}
        <strong style={{ color: FINGER_COLORS[fingerId] }}>{FINGER_NAMES[fingerId]}</strong>
      </p>
      <p className="finger-chars-hint">
        ({challenge.validChars.map((c) => c.toUpperCase()).join(', ')})
      </p>
    </div>
  );
}

interface WordDisplayProps {
  challenge: { word: { word: string; chord: { characters: readonly { color: string; displayChar: string }[] }; rank?: number } };
}

function WordDisplay({ challenge }: WordDisplayProps) {
  return (
    <div className="word-challenge-display survival-target">
      <h1 className="word-display survival-word">{challenge.word.word}</h1>
      <div className="power-chord-display">
        {challenge.word.chord.characters.map((char, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="plus">+</span>}
            <span className="character large" style={{ color: char.color }}>
              {char.displayChar}
            </span>
          </React.Fragment>
        ))}
      </div>
      {challenge.word.rank && <p className="word-rank-hint">#{challenge.word.rank} most common</p>}
    </div>
  );
}

// ============================================================================
// Game Over Screen
// ============================================================================

interface GameOverScreenProps {
  game: ReturnType<typeof useSurvivalGame>;
  bossMode?: BossModeConfig;
  bossBestScore: number;
  itemType: SurvivalItemType;
  onBack?: () => void;
}

function GameOverScreen({ game, bossMode, bossBestScore, itemType, onBack }: GameOverScreenProps) {
  const highScoreService = getHighScoreService();

  if (bossMode) {
    const scorePercent =
      game.totalBossItems > 0 ? Math.round((game.score / game.totalBossItems) * 100) : 0;
    const passed = scorePercent >= bossMode.targetScorePercent;
    const isNewBest = scorePercent > bossBestScore;
    const displayBestScore = Math.max(bossBestScore, scorePercent);

    return (
      <div
        className={`training-phase survival-game-over boss-game-over ${
          passed ? 'boss-victory' : 'boss-defeat'
        }`}
      >
        <h2>{passed ? '🏆 Victory!' : '💀 Defeated'}</h2>

        {isNewBest && scorePercent > 0 && <div className="new-high-score-banner">New Best Score!</div>}

        <div className="boss-result">
          <div className="boss-score-circle">
            <span className="boss-score-percent">{scorePercent}%</span>
            <span className="boss-score-detail">
              {game.score}/{game.totalBossItems}
            </span>
          </div>
          <p className="boss-target">Target: {bossMode.targetScorePercent}%</p>
          {displayBestScore > 0 && displayBestScore !== scorePercent && (
            <p className="boss-best-score">Best: {displayBestScore}%</p>
          )}
        </div>

        {game.feedback === 'timeout' && <p className="game-over-reason">Time ran out!</p>}
        {game.feedback === 'incorrect' && <p className="game-over-reason">Wrong answer!</p>}

        <div className="complete-actions">
          <button className="btn primary" onClick={() => game.startGame('intermediate')}>
            Try Again
          </button>
          {onBack && (
            <button className="btn secondary" onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="training-phase survival-game-over">
      <h2>Game Over!</h2>

      {game.isNewHighScore && <div className="new-high-score-banner">New High Score!</div>}

      <div className="survival-final-score">
        <span className="score-label">Final Score</span>
        <span className="score-value">{game.score}</span>
      </div>

      {game.feedback === 'timeout' && <p className="game-over-reason">Time ran out!</p>}
      {game.feedback === 'incorrect' && <p className="game-over-reason">Wrong answer!</p>}

      <div className="survival-stats">
        <div className="stat-item">
          <span className="stat-label">Difficulty</span>
          <span className="stat-value">{DIFFICULTY_SETTINGS[game.difficulty].label}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">High Score</span>
          <span className="stat-value">
            {highScoreService.getHighScore(toHighScoreCategory(itemType), game.difficulty)}
          </span>
        </div>
      </div>

      <div className="complete-actions">
        <button className="btn primary" onClick={() => game.startGame(game.difficulty)}>
          Play Again
        </button>
        <button className="btn secondary" onClick={() => game.setPhase('select-difficulty')}>
          Change Difficulty
        </button>
        {onBack && (
          <button className="btn secondary" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}

export default SurvivalGame;

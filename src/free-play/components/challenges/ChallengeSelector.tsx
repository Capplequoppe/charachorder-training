/**
 * Challenge Selector Component
 *
 * UI for selecting and configuring speed challenges.
 */

import React, { useState } from 'react';
import {
  type TimeAttackConfig,
  type SprintConfig,
  type ChallengeType,
  type ItemType,
  TIME_ATTACK_PRESETS,
  SPRINT_PRESETS,
  getDifficultyColor,
  getItemTypeDisplayName,
  getMedalEmoji,
} from '@/data/static/challengeConfig';
import {
  getChallengeRepository,
  type PersonalBest,
} from '@/free-play/data/repositories/ChallengeRepository';
import './challenges.css';

export interface ChallengeSelectorProps {
  onSelectTimeAttack: (config: TimeAttackConfig) => void;
  onSelectSprint: (config: SprintConfig) => void;
  onClose?: () => void;
}

export function ChallengeSelector({
  onSelectTimeAttack,
  onSelectSprint,
  onClose,
}: ChallengeSelectorProps) {
  const [selectedType, setSelectedType] = useState<ChallengeType>('timeAttack');
  const [selectedItemType, setSelectedItemType] = useState<ItemType | 'all'>('all');

  const challengeRepository = getChallengeRepository();

  // Filter presets by item type
  const filteredTimeAttack = selectedItemType === 'all'
    ? TIME_ATTACK_PRESETS
    : TIME_ATTACK_PRESETS.filter(p => p.itemType === selectedItemType);

  const filteredSprint = selectedItemType === 'all'
    ? SPRINT_PRESETS
    : SPRINT_PRESETS.filter(p => p.itemType === selectedItemType);

  const getPersonalBest = (challengeId: string): PersonalBest | null => {
    return challengeRepository.getPersonalBest(challengeId);
  };

  return (
    <div className="challenge-selector">
      <div className="selector-header">
        <h2>Speed Challenges</h2>
        <p>Test your speed and accuracy under pressure</p>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        )}
      </div>

      {/* Challenge Type Tabs */}
      <div className="challenge-type-tabs">
        <button
          className={`type-tab ${selectedType === 'timeAttack' ? 'active' : ''}`}
          onClick={() => setSelectedType('timeAttack')}
        >
          <span className="tab-icon">⏱️</span>
          <div className="tab-content">
            <span className="tab-title">Time Attack</span>
            <span className="tab-description">Score as many as possible</span>
          </div>
        </button>
        <button
          className={`type-tab ${selectedType === 'sprint' ? 'active' : ''}`}
          onClick={() => setSelectedType('sprint')}
        >
          <span className="tab-icon">🏃</span>
          <div className="tab-content">
            <span className="tab-title">Sprint</span>
            <span className="tab-description">Complete as fast as possible</span>
          </div>
        </button>
      </div>

      {/* Item Type Filter */}
      <div className="item-type-filter">
        <span className="filter-label">Filter by:</span>
        <div className="filter-chips">
          <button
            className={`filter-chip ${selectedItemType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedItemType('all')}
          >
            All
          </button>
          <button
            className={`filter-chip ${selectedItemType === 'finger' ? 'active' : ''}`}
            onClick={() => setSelectedItemType('finger')}
          >
            Fingers
          </button>
          <button
            className={`filter-chip ${selectedItemType === 'powerChord' ? 'active' : ''}`}
            onClick={() => setSelectedItemType('powerChord')}
          >
            Power Chords
          </button>
          <button
            className={`filter-chip ${selectedItemType === 'word' ? 'active' : ''}`}
            onClick={() => setSelectedItemType('word')}
          >
            Words
          </button>
        </div>
      </div>

      {/* Challenge Cards */}
      <div className="challenge-cards">
        {selectedType === 'timeAttack' ? (
          filteredTimeAttack.map(config => (
            <TimeAttackCard
              key={config.id}
              config={config}
              personalBest={getPersonalBest(config.id)}
              onSelect={() => onSelectTimeAttack(config)}
            />
          ))
        ) : (
          filteredSprint.map(config => (
            <SprintCard
              key={config.id}
              config={config}
              personalBest={getPersonalBest(config.id)}
              onSelect={() => onSelectSprint(config)}
            />
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="challenge-stats-summary">
        <div className="summary-stat">
          <span className="summary-value">
            {challengeRepository.getTotalChallengesCompleted()}
          </span>
          <span className="summary-label">Challenges Completed</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">
            {challengeRepository.getTotalScore().toLocaleString()}
          </span>
          <span className="summary-label">Total Score</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">
            {Math.round(challengeRepository.getAverageAccuracy() * 100)}%
          </span>
          <span className="summary-label">Avg Accuracy</span>
        </div>
      </div>
    </div>
  );
}

// ==================== Card Components ====================

interface TimeAttackCardProps {
  config: TimeAttackConfig;
  personalBest: PersonalBest | null;
  onSelect: () => void;
}

function TimeAttackCard({ config, personalBest, onSelect }: TimeAttackCardProps) {
  return (
    <div className="challenge-card" onClick={onSelect}>
      <div className="card-header">
        <span
          className="difficulty-badge"
          style={{ backgroundColor: getDifficultyColor(config.difficulty) }}
        >
          {config.difficulty}
        </span>
        <span className="item-type-badge">
          {getItemTypeDisplayName(config.itemType)}
        </span>
      </div>

      <h3 className="card-title">{config.displayName}</h3>
      <p className="card-description">{config.description}</p>

      <div className="card-details">
        <div className="detail">
          <span className="detail-icon">⏱️</span>
          <span>{config.duration}s</span>
        </div>
        <div className="detail">
          <span className="detail-icon">✅</span>
          <span>+{config.bonusTimeOnCorrect}s</span>
        </div>
        <div className="detail">
          <span className="detail-icon">❌</span>
          <span>-{config.penaltyOnWrong}s</span>
        </div>
      </div>

      {personalBest && (
        <div className="personal-best">
          <span className="pb-label">Personal Best</span>
          <span className="pb-value">{personalBest.score.toLocaleString()} pts</span>
        </div>
      )}

      <button className="card-play-btn">
        Play
      </button>
    </div>
  );
}

interface SprintCardProps {
  config: SprintConfig;
  personalBest: PersonalBest | null;
  onSelect: () => void;
}

function SprintCard({ config, personalBest, onSelect }: SprintCardProps) {
  return (
    <div className="challenge-card" onClick={onSelect}>
      <div className="card-header">
        <span
          className="difficulty-badge"
          style={{ backgroundColor: getDifficultyColor(config.difficulty) }}
        >
          {config.difficulty}
        </span>
        <span className="item-type-badge">
          {getItemTypeDisplayName(config.itemType)}
        </span>
      </div>

      <h3 className="card-title">{config.displayName}</h3>
      <p className="card-description">{config.description}</p>

      <div className="card-details">
        <div className="detail">
          <span className="detail-icon">🎯</span>
          <span>{config.itemCount} items</span>
        </div>
        <div className="medal-targets-small">
          <span>🥇 {config.goldTime}s</span>
          <span>🥈 {config.silverTime}s</span>
          <span>🥉 {config.bronzeTime}s</span>
        </div>
      </div>

      {personalBest && (
        <div className="personal-best">
          <span className="pb-label">Personal Best</span>
          <div className="pb-sprint">
            <span className="pb-medal">{getMedalEmoji(personalBest.medal)}</span>
            <span className="pb-time">{(personalBest.timeMs / 1000).toFixed(2)}s</span>
          </div>
        </div>
      )}

      <button className="card-play-btn">
        Play
      </button>
    </div>
  );
}

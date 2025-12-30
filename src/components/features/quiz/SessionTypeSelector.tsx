/**
 * SessionTypeSelector Component
 *
 * Allows users to choose between different quiz session types:
 * - Review: Focus on due items
 * - Learn: Introduce new items with review
 * - Weakness: Target difficult items
 * - Mixed: Balanced selection
 */

import React from 'react';
import { QuizSessionType, QuizStats } from '../../../services/QuizService';

/**
 * Props for SessionTypeSelector component.
 */
export interface SessionTypeSelectorProps {
  /** Callback when a session type is selected */
  onSelect: (type: QuizSessionType) => void;
  /** Current quiz statistics */
  stats: QuizStats;
  /** Currently selected type (for highlighting) */
  selectedType?: QuizSessionType;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Session type configuration.
 */
interface SessionTypeConfig {
  type: QuizSessionType;
  title: string;
  description: string;
  icon: string;
  color: string;
  getCount: (stats: QuizStats) => number;
  countLabel: string;
}

const SESSION_TYPES: SessionTypeConfig[] = [
  {
    type: 'review',
    title: 'Review',
    description: 'Practice items due for review',
    icon: '\u{1F501}', // Repeat
    color: '#3498DB',
    getCount: (stats) => stats.dueCount,
    countLabel: 'due',
  },
  {
    type: 'learn',
    title: 'Learn',
    description: 'Learn new items with review',
    icon: '\u{1F4DA}', // Books
    color: '#2ECC71',
    getCount: (stats) => stats.newCount,
    countLabel: 'new',
  },
  {
    type: 'weakness',
    title: 'Weakness',
    description: 'Focus on difficult items',
    icon: '\u{1F3AF}', // Target
    color: '#E74C3C',
    getCount: (stats) => stats.weakCount,
    countLabel: 'weak',
  },
  {
    type: 'mixed',
    title: 'Mixed',
    description: 'Balanced practice session',
    icon: '\u{1F500}', // Shuffle
    color: '#9B59B6',
    getCount: (stats) => stats.totalCount,
    countLabel: 'total',
  },
];

/**
 * SessionTypeSelector displays session type options.
 */
export function SessionTypeSelector({
  onSelect,
  stats,
  selectedType,
  disabled = false,
  className = '',
}: SessionTypeSelectorProps): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  };

  return (
    <div className={`session-type-selector ${className}`} style={containerStyle}>
      {SESSION_TYPES.map((config) => (
        <SessionTypeCard
          key={config.type}
          config={config}
          stats={stats}
          isSelected={selectedType === config.type}
          disabled={disabled}
          onClick={() => onSelect(config.type)}
        />
      ))}
    </div>
  );
}

/**
 * Props for SessionTypeCard.
 */
interface SessionTypeCardProps {
  config: SessionTypeConfig;
  stats: QuizStats;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}

/**
 * Individual session type card.
 */
function SessionTypeCard({
  config,
  stats,
  isSelected,
  disabled,
  onClick,
}: SessionTypeCardProps): React.ReactElement {
  const count = config.getCount(stats);
  const isEmpty = config.type !== 'mixed' && count === 0;

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    backgroundColor: isSelected ? `${config.color}20` : '#1E1E1E',
    border: `2px solid ${isSelected ? config.color : '#333'}`,
    borderRadius: 12,
    cursor: disabled || isEmpty ? 'not-allowed' : 'pointer',
    opacity: disabled || isEmpty ? 0.5 : 1,
    transition: 'all 0.2s ease-out',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 32,
    marginBottom: 8,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: isSelected ? config.color : '#FFF',
    marginBottom: 4,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  };

  const countStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    color: config.color,
    fontWeight: 500,
  };

  const handleClick = () => {
    if (!disabled && !isEmpty) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !isEmpty) {
      onClick();
    }
  };

  return (
    <div
      className={`session-type-card ${isSelected ? 'selected' : ''}`}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled || isEmpty ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled || isEmpty}
    >
      <span style={iconStyle}>{config.icon}</span>
      <span style={titleStyle}>{config.title}</span>
      <span style={descStyle}>{config.description}</span>
      <span style={countStyle}>
        <strong>{count}</strong>
        <span>{config.countLabel}</span>
      </span>
    </div>
  );
}

/**
 * Compact version of session type selector.
 */
export interface SessionTypeSelectorCompactProps {
  /** Callback when a session type is selected */
  onSelect: (type: QuizSessionType) => void;
  /** Currently selected type */
  selectedType?: QuizSessionType;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

export function SessionTypeSelectorCompact({
  onSelect,
  selectedType,
  disabled = false,
  className = '',
}: SessionTypeSelectorCompactProps): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
  };

  const buttonStyle = (
    type: QuizSessionType,
    color: string
  ): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: selectedType === type ? color : 'transparent',
    border: `2px solid ${color}`,
    borderRadius: 8,
    color: selectedType === type ? '#FFF' : color,
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease-out',
  });

  return (
    <div className={`session-type-selector-compact ${className}`} style={containerStyle}>
      {SESSION_TYPES.map((config) => (
        <button
          key={config.type}
          style={buttonStyle(config.type, config.color)}
          onClick={() => !disabled && onSelect(config.type)}
          disabled={disabled}
          aria-pressed={selectedType === config.type}
        >
          {config.icon} {config.title}
        </button>
      ))}
    </div>
  );
}

export default SessionTypeSelector;

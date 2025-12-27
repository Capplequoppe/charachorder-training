/**
 * ConfidenceIndicator Component
 *
 * Displays a visual indicator of confidence level (weak/moderate/strong).
 * Uses color-coded dots or badges to show mastery status.
 */

import React from 'react';

/**
 * Confidence level type.
 */
export type ConfidenceLevel = 'weak' | 'moderate' | 'strong';

/**
 * Props for ConfidenceIndicator component.
 */
export interface ConfidenceIndicatorProps {
  /** Confidence level to display */
  level: ConfidenceLevel;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Whether to show as a badge with background */
  asBadge?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Color mapping for confidence levels.
 */
export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  weak: '#E74C3C',      // Red
  moderate: '#F1C40F',  // Yellow
  strong: '#2ECC71',    // Green
};

/**
 * Size configurations.
 */
const SIZE_CONFIG = {
  small: { dot: 8, fontSize: 10, padding: '2px 6px' },
  medium: { dot: 12, fontSize: 12, padding: '4px 10px' },
  large: { dot: 16, fontSize: 14, padding: '6px 14px' },
};

/**
 * Label text for confidence levels.
 */
const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  weak: 'Weak',
  moderate: 'Moderate',
  strong: 'Strong',
};

/**
 * ConfidenceIndicator displays confidence level visually.
 */
export function ConfidenceIndicator({
  level,
  size = 'medium',
  showLabel = false,
  asBadge = false,
  className = '',
}: ConfidenceIndicatorProps): React.ReactElement {
  const config = SIZE_CONFIG[size];
  const color = CONFIDENCE_COLORS[level];
  const label = CONFIDENCE_LABELS[level];

  if (asBadge) {
    const badgeStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${color}20`, // 20% opacity background
      border: `1px solid ${color}`,
      borderRadius: 12,
      padding: config.padding,
      fontSize: config.fontSize,
      fontWeight: 500,
      color: color,
    };

    return (
      <span className={`confidence-badge confidence-${level} ${className}`} style={badgeStyle}>
        <span
          style={{
            width: config.dot,
            height: config.dot,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        {showLabel && <span>{label}</span>}
      </span>
    );
  }

  // Simple dot indicator
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  const dotStyle: React.CSSProperties = {
    width: config.dot,
    height: config.dot,
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: `0 0 ${config.dot / 2}px ${color}40`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: config.fontSize,
    color: color,
    fontWeight: 500,
  };

  return (
    <span
      className={`confidence-indicator confidence-${level} ${className}`}
      style={containerStyle}
      title={`Confidence: ${label}`}
    >
      <span style={dotStyle} />
      {showLabel && <span style={labelStyle}>{label}</span>}
    </span>
  );
}

/**
 * ConfidenceBar displays confidence as a horizontal progress bar.
 */
export interface ConfidenceBarProps {
  /** Confidence level */
  level: ConfidenceLevel;
  /** Optional accuracy percentage (0-1) */
  accuracy?: number;
  /** Height of the bar */
  height?: number;
  /** Whether to show the percentage label */
  showPercentage?: boolean;
  /** Additional CSS class names */
  className?: string;
}

export function ConfidenceBar({
  level,
  accuracy,
  height = 8,
  showPercentage = false,
  className = '',
}: ConfidenceBarProps): React.ReactElement {
  const color = CONFIDENCE_COLORS[level];

  // Calculate fill percentage from level or accuracy
  const fillPercent =
    accuracy !== undefined
      ? accuracy * 100
      : level === 'strong'
      ? 100
      : level === 'moderate'
      ? 60
      : 30;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  };

  const barContainerStyle: React.CSSProperties = {
    flex: 1,
    height,
    backgroundColor: '#2A2A2A',
    borderRadius: height / 2,
    overflow: 'hidden',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${fillPercent}%`,
    backgroundColor: color,
    borderRadius: height / 2,
    transition: 'width 0.3s ease-out',
  };

  const percentStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: color,
    minWidth: 40,
    textAlign: 'right',
  };

  return (
    <div className={`confidence-bar ${className}`} style={containerStyle}>
      <div style={barContainerStyle}>
        <div style={fillStyle} />
      </div>
      {showPercentage && (
        <span style={percentStyle}>{Math.round(fillPercent)}%</span>
      )}
    </div>
  );
}

/**
 * ConfidenceStars displays confidence as star rating.
 */
export interface ConfidenceStarsProps {
  /** Confidence level */
  level: ConfidenceLevel;
  /** Size of stars */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS class names */
  className?: string;
}

export function ConfidenceStars({
  level,
  size = 'medium',
  className = '',
}: ConfidenceStarsProps): React.ReactElement {
  const starCount = level === 'strong' ? 3 : level === 'moderate' ? 2 : 1;
  const color = CONFIDENCE_COLORS[level];
  const starSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    gap: 2,
  };

  const starStyle = (filled: boolean): React.CSSProperties => ({
    color: filled ? color : '#444',
    fontSize: starSize,
  });

  return (
    <span
      className={`confidence-stars ${className}`}
      style={containerStyle}
      title={`Confidence: ${CONFIDENCE_LABELS[level]}`}
    >
      {[1, 2, 3].map((i) => (
        <span key={i} style={starStyle(i <= starCount)}>
          {i <= starCount ? '\u2605' : '\u2606'}
        </span>
      ))}
    </span>
  );
}

export default ConfidenceIndicator;

/**
 * Overview Card Component
 *
 * Displays a single metric with optional trend indicator.
 */

import React from 'react';

export interface OverviewCardProps {
  /** Card title */
  title: string;
  /** Main value (can be number or string) */
  value: number | string;
  /** Optional suffix (e.g., "%", " days") */
  suffix?: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Change percentage (for trend) */
  changePercent?: number;
  /** Custom accent color */
  color?: string;
}

/**
 * Overview card displaying a metric.
 */
export function OverviewCard({
  title,
  value,
  suffix = '',
  subtitle,
  trend,
  changePercent,
  color,
}: OverviewCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <span className="trend-icon up">&#9650;</span>;
      case 'down':
        return <span className="trend-icon down">&#9660;</span>;
      default:
        return <span className="trend-icon neutral">&#8212;</span>;
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case 'up':
        return 'trend-positive';
      case 'down':
        return 'trend-negative';
      default:
        return 'trend-neutral';
    }
  };

  return (
    <div className="overview-card">
      <span className="card-title">{title}</span>
      <div className="card-value-row">
        <span
          className="card-value"
          style={color ? { color } : undefined}
        >
          {value}{suffix}
        </span>
        {trend && (
          <span className={`card-trend ${getTrendClass()}`}>
            {getTrendIcon()}
            {changePercent !== undefined && (
              <span className="change-percent">
                {changePercent > 0 ? '+' : ''}{changePercent}%
              </span>
            )}
          </span>
        )}
      </div>
      {subtitle && <span className="card-subtitle">{subtitle}</span>}
    </div>
  );
}

export default OverviewCard;

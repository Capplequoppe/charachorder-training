/**
 * Insights List Component
 *
 * Displays actionable insights and practice recommendations.
 */

import React from 'react';
import type { Insight, Recommendation } from '../../data/models/Analytics';

export interface InsightsListProps {
  /** List of insights */
  insights: Insight[];
  /** List of recommendations */
  recommendations: Recommendation[];
  /** Action callback */
  onAction?: (path: string) => void;
}

/**
 * Get icon for insight type.
 */
function getInsightIcon(type: Insight['type']): string {
  switch (type) {
    case 'achievement':
      return '&#127942;'; // Trophy
    case 'improvement':
      return '&#128200;'; // Chart up
    case 'warning':
      return '&#9888;'; // Warning
    case 'tip':
      return '&#128161;'; // Lightbulb
    default:
      return '&#128172;'; // Speech bubble
  }
}

/**
 * Get color for insight type.
 */
function getInsightColor(type: Insight['type']): string {
  switch (type) {
    case 'achievement':
      return '#f1c40f';
    case 'improvement':
      return '#2ecc71';
    case 'warning':
      return '#e74c3c';
    case 'tip':
      return '#3498db';
    default:
      return '#95a5a6';
  }
}

/**
 * Get color for recommendation priority.
 */
function getPriorityColor(priority: Recommendation['priority']): string {
  switch (priority) {
    case 'high':
      return '#e74c3c';
    case 'medium':
      return '#f1c40f';
    case 'low':
      return '#2ecc71';
    default:
      return '#95a5a6';
  }
}

/**
 * Individual insight card.
 */
function InsightCard({
  insight,
  onAction,
}: {
  insight: Insight;
  onAction?: (path: string) => void;
}) {
  const color = getInsightColor(insight.type);

  return (
    <div
      className={`insight-card ${insight.type}`}
      style={{ borderLeftColor: color }}
    >
      <div className="insight-header">
        <span
          className="insight-icon"
          style={{ color }}
          dangerouslySetInnerHTML={{ __html: getInsightIcon(insight.type) }}
        />
        <span className="insight-title">{insight.title}</span>
      </div>
      <p className="insight-message">{insight.message}</p>
      {insight.actionable && insight.action && (
        <button
          className="insight-action"
          onClick={() => onAction?.(insight.action!.href)}
        >
          {insight.action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Individual recommendation card.
 */
function RecommendationCard({
  recommendation,
  onAction,
}: {
  recommendation: Recommendation;
  onAction?: (path: string) => void;
}) {
  const priorityColor = getPriorityColor(recommendation.priority);

  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <span className="recommendation-title">{recommendation.title}</span>
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColor }}
        >
          {recommendation.priority}
        </span>
      </div>
      <p className="recommendation-description">{recommendation.description}</p>
      <p className="recommendation-reason">{recommendation.reason}</p>
      <button
        className="recommendation-action"
        onClick={() => onAction?.(recommendation.link)}
      >
        Start
      </button>
    </div>
  );
}

/**
 * Insights list component.
 */
export function InsightsList({
  insights,
  recommendations,
  onAction,
}: InsightsListProps) {
  const hasContent = insights.length > 0 || recommendations.length > 0;

  if (!hasContent) {
    return (
      <div className="insights-list empty">
        <div className="empty-state">
          <span className="empty-icon">&#128172;</span>
          <p>No insights yet</p>
          <p className="empty-hint">
            Keep practicing to unlock personalized insights and recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-list">
      {insights.length > 0 && (
        <div className="insights-section">
          <h3>Insights</h3>
          <div className="insights-grid">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>Recommendations</h3>
          <div className="recommendations-grid">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InsightsList;

/**
 * Trouble Items List Component
 *
 * Displays items that need more practice based on accuracy and attempts.
 */

import React from 'react';
import type { ItemAnalytics } from '../../data/models/Analytics';

export interface TroubleItemsListProps {
  /** List of trouble items */
  items: ItemAnalytics[];
  /** Callback when user wants to practice an item */
  onPractice?: (path: string) => void;
}

/**
 * Get display name for an item.
 */
function getItemDisplayName(item: ItemAnalytics): string {
  switch (item.itemType) {
    case 'finger':
      return `"${item.itemId}"`;
    case 'powerChord':
      return `Chord: ${item.itemId}`;
    case 'word':
      return `"${item.itemId}"`;
    default:
      return item.itemId;
  }
}

/**
 * Get item type badge color.
 */
function getItemTypeColor(itemType: string): string {
  switch (itemType) {
    case 'finger':
      return '#3498db';
    case 'powerChord':
      return '#9b59b6';
    case 'word':
      return '#2ecc71';
    default:
      return '#95a5a6';
  }
}

/**
 * Mini sparkline for response time trend.
 */
function ResponseTimeTrendMini({ data }: { data: number[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 20;
  const width = 60;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="trend-mini" width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Individual trouble item display.
 */
function TroubleItem({
  item,
  onPractice,
}: {
  item: ItemAnalytics;
  onPractice?: (path: string) => void;
}) {
  const accuracyColor =
    item.accuracy >= 0.8 ? '#2ecc71' :
    item.accuracy >= 0.6 ? '#f1c40f' : '#e74c3c';

  return (
    <div className="trouble-item">
      <div className="item-info">
        <span className="item-name">{getItemDisplayName(item)}</span>
        <span
          className="item-type"
          style={{ backgroundColor: getItemTypeColor(item.itemType) }}
        >
          {item.itemType}
        </span>
      </div>

      <div className="item-stats">
        <div className="stat">
          <span className="value" style={{ color: accuracyColor }}>
            {Math.round(item.accuracy * 100)}%
          </span>
          <span className="label">Accuracy</span>
        </div>
        <div className="stat">
          <span className="value">{Math.round(item.averageResponseTimeMs)}ms</span>
          <span className="label">Avg Time</span>
        </div>
        <div className="stat">
          <span className="value">{item.totalAttempts}</span>
          <span className="label">Attempts</span>
        </div>
      </div>

      {item.responseTimeTrend.length > 0 && (
        <ResponseTimeTrendMini data={item.responseTimeTrend} />
      )}

      <button
        className="practice-button"
        onClick={() => onPractice?.(`/practice?focus=${item.itemId}`)}
      >
        Practice This
      </button>
    </div>
  );
}

/**
 * Trouble items list component.
 */
export function TroubleItemsList({ items, onPractice }: TroubleItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="trouble-items empty">
        <div className="empty-state">
          <span className="empty-icon">&#10003;</span>
          <p>No trouble items found. Great job!</p>
          <p className="empty-hint">Keep practicing to maintain your skills.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trouble-items">
      {items.map((item) => (
        <TroubleItem
          key={`${item.itemType}-${item.itemId}`}
          item={item}
          onPractice={onPractice}
        />
      ))}
    </div>
  );
}

export default TroubleItemsList;

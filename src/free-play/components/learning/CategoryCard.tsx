/**
 * CategoryCard Component
 *
 * Displays a semantic category with progress information.
 * Used in the CategoryBrowser for category selection.
 */

import React from 'react';
import { CategoryDefinition, SemanticCategory } from '../../data/static/semanticCategories';
import './learning.css';

/**
 * Props for CategoryCard component.
 */
export interface CategoryCardProps {
  /** Category definition */
  category: CategoryDefinition;
  /** Total words in this category */
  wordCount: number;
  /** Number of mastered words */
  masteredCount: number;
  /** Click handler */
  onClick: () => void;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * CategoryCard displays a semantic category with progress.
 */
export function CategoryCard({
  category,
  wordCount,
  masteredCount,
  onClick,
  isSelected = false,
  size = 'medium',
}: CategoryCardProps): React.ReactElement {
  const progress = wordCount > 0 ? masteredCount / wordCount : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <div
      className={`category-card ${size} ${isSelected ? 'selected' : ''}`}
      style={{ '--category-color': category.color } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="category-card-icon">{category.icon}</div>

      <h3 className="category-card-title">{category.displayName}</h3>

      <p className="category-card-description">{category.description}</p>

      <div className="category-card-examples">
        {category.examples.slice(0, 4).map((word) => (
          <span key={word} className="example-word">
            {word}
          </span>
        ))}
        {category.examples.length > 4 && (
          <span className="example-more">+{category.examples.length - 4}</span>
        )}
      </div>

      <div className="category-card-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: category.color,
            }}
          />
        </div>
        <div className="progress-text">
          {masteredCount} / {wordCount} mastered ({progressPercent}%)
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version of CategoryCard for smaller displays.
 */
export interface CategoryChipProps {
  /** Category definition */
  category: CategoryDefinition;
  /** Click handler */
  onClick?: () => void;
  /** Whether this chip is selected */
  isSelected?: boolean;
}

export function CategoryChip({
  category,
  onClick,
  isSelected = false,
}: CategoryChipProps): React.ReactElement {
  return (
    <button
      className={`category-chip ${isSelected ? 'selected' : ''}`}
      style={{ '--category-color': category.color } as React.CSSProperties}
      onClick={onClick}
    >
      <span className="chip-icon">{category.icon}</span>
      <span className="chip-label">{category.displayName}</span>
    </button>
  );
}

/**
 * Category icon badge for inline display.
 */
export interface CategoryBadgeProps {
  /** Category ID or definition */
  category: SemanticCategory | CategoryDefinition;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
}

export function CategoryBadge({
  category,
  showLabel = false,
  size = 'small',
}: CategoryBadgeProps): React.ReactElement {
  // Handle both category ID and full definition
  const isDefinition = typeof category === 'object';
  const icon = isDefinition ? category.icon : getCategoryIconById(category);
  const label = isDefinition ? category.displayName : category;
  const color = isDefinition ? category.color : getCategoryColorById(category);

  return (
    <span
      className={`category-badge ${size}`}
      style={{ '--category-color': color } as React.CSSProperties}
    >
      <span className="badge-icon">{icon}</span>
      {showLabel && <span className="badge-label">{label}</span>}
    </span>
  );
}

// Helper functions for when only category ID is provided
function getCategoryIconById(id: SemanticCategory): string {
  const icons: Record<SemanticCategory, string> = {
    determiner: '📌',
    pronoun: '👤',
    preposition: '📍',
    conjunction: '🔗',
    verb_common: '⚡',
    verb_modal: '💭',
    noun_common: '📦',
    adjective: '🎨',
    adverb: '🏃',
    time: '⏰',
    place: '🗺️',
    question: '❓',
    negation: '🚫',
    action: '🎬',
    common: '📝',
  };
  return icons[id] ?? '📝';
}

function getCategoryColorById(id: SemanticCategory): string {
  const colors: Record<SemanticCategory, string> = {
    determiner: '#3498DB',
    pronoun: '#9B59B6',
    preposition: '#E74C3C',
    conjunction: '#F1C40F',
    verb_common: '#2ECC71',
    verb_modal: '#1ABC9C',
    noun_common: '#95A5A6',
    adjective: '#FF6B6B',
    adverb: '#4ECDC4',
    time: '#E67E22',
    place: '#16A085',
    question: '#8E44AD',
    negation: '#C0392B',
    action: '#27AE60',
    common: '#7F8C8D',
  };
  return colors[id] ?? '#7F8C8D';
}

export default CategoryCard;

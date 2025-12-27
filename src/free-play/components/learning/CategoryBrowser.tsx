/**
 * CategoryBrowser Component
 *
 * Displays all semantic categories with progress tracking.
 * Allows users to browse and select categories for focused practice.
 */

import React, { useState, useMemo } from 'react';
import {
  CATEGORY_DEFINITIONS,
  SemanticCategory,
  CategoryDefinition,
  getWordsByCategory,
} from '../../data/static/semanticCategories';
import { getRepositories } from '../../data';
import { CategoryCard, CategoryChip } from './CategoryCard';
import './learning.css';

/**
 * Props for CategoryBrowser component.
 */
export interface CategoryBrowserProps {
  /** Callback when a category is selected for practice */
  onSelectCategory?: (category: SemanticCategory) => void;
  /** Callback when starting practice for a category */
  onStartPractice?: (category: SemanticCategory) => void;
  /** Optional filter for which categories to show */
  categoryFilter?: SemanticCategory[];
  /** Layout variant */
  layout?: 'grid' | 'list' | 'compact';
}

/**
 * Progress information for a category.
 */
interface CategoryProgress {
  category: CategoryDefinition;
  wordCount: number;
  masteredCount: number;
  progressPercent: number;
}

/**
 * CategoryBrowser displays all categories with progress.
 */
export function CategoryBrowser({
  onSelectCategory,
  onStartPractice,
  categoryFilter,
  layout = 'grid',
}: CategoryBrowserProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<SemanticCategory | null>(null);

  // Calculate progress for each category
  const categoryProgress = useMemo<CategoryProgress[]>(() => {
    const categories = categoryFilter
      ? CATEGORY_DEFINITIONS.filter((c) => categoryFilter.includes(c.id))
      : CATEGORY_DEFINITIONS;

    return categories.map((category) => {
      const words = getWordsByCategory(category.id);
      // In a real app, would query progress service for mastered count
      // For now, simulate with 0 mastered
      const masteredCount = 0;

      return {
        category,
        wordCount: words.length,
        masteredCount,
        progressPercent: words.length > 0 ? (masteredCount / words.length) * 100 : 0,
      };
    });
  }, [categoryFilter]);

  // Handle category selection
  const handleCategoryClick = (categoryId: SemanticCategory) => {
    setSelectedCategory(categoryId);
    onSelectCategory?.(categoryId);
  };

  // Get selected category details
  const selectedCategoryData = selectedCategory
    ? categoryProgress.find((p) => p.category.id === selectedCategory)
    : null;

  // Render grid layout
  const renderGrid = () => (
    <div className="category-grid">
      {categoryProgress.map((progress) => (
        <CategoryCard
          key={progress.category.id}
          category={progress.category}
          wordCount={progress.wordCount}
          masteredCount={progress.masteredCount}
          onClick={() => handleCategoryClick(progress.category.id)}
          isSelected={selectedCategory === progress.category.id}
        />
      ))}
    </div>
  );

  // Render list layout
  const renderList = () => (
    <div className="category-list">
      {categoryProgress.map((progress) => (
        <div
          key={progress.category.id}
          className={`category-list-item ${selectedCategory === progress.category.id ? 'selected' : ''}`}
          onClick={() => handleCategoryClick(progress.category.id)}
        >
          <span className="list-icon">{progress.category.icon}</span>
          <div className="list-content">
            <h4>{progress.category.displayName}</h4>
            <p>{progress.category.description}</p>
          </div>
          <div className="list-progress">
            <span className="progress-count">
              {progress.masteredCount}/{progress.wordCount}
            </span>
            <div className="progress-bar-mini">
              <div
                className="progress-fill"
                style={{
                  width: `${progress.progressPercent}%`,
                  backgroundColor: progress.category.color,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render compact layout
  const renderCompact = () => (
    <div className="category-chips">
      {categoryProgress.map((progress) => (
        <CategoryChip
          key={progress.category.id}
          category={progress.category}
          onClick={() => handleCategoryClick(progress.category.id)}
          isSelected={selectedCategory === progress.category.id}
        />
      ))}
    </div>
  );

  return (
    <div className="category-browser">
      <div className="browser-header">
        <h2>Learn by Category</h2>
        <p>Words grouped by meaning are easier to remember together.</p>
      </div>

      {layout === 'grid' && renderGrid()}
      {layout === 'list' && renderList()}
      {layout === 'compact' && renderCompact()}

      {/* Category Detail Panel */}
      {selectedCategoryData && (
        <div className="category-detail">
          <div
            className="detail-header"
            style={{ backgroundColor: selectedCategoryData.category.color }}
          >
            <span className="detail-icon">{selectedCategoryData.category.icon}</span>
            <h3>{selectedCategoryData.category.displayName}</h3>
          </div>

          <p className="detail-description">{selectedCategoryData.category.description}</p>

          <div className="detail-tip">
            <strong>Tip:</strong> {selectedCategoryData.category.learningTip}
          </div>

          <div className="detail-examples">
            <h4>Example Words:</h4>
            <div className="example-list">
              {selectedCategoryData.category.examples.map((word) => (
                <span key={word} className="example-word-large">
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-stats">
            <div className="stat">
              <span className="stat-value">{selectedCategoryData.wordCount}</span>
              <span className="stat-label">Total Words</span>
            </div>
            <div className="stat">
              <span className="stat-value">{selectedCategoryData.masteredCount}</span>
              <span className="stat-label">Mastered</span>
            </div>
            <div className="stat">
              <span className="stat-value">{Math.round(selectedCategoryData.progressPercent)}%</span>
              <span className="stat-label">Progress</span>
            </div>
          </div>

          <div className="detail-actions">
            <button
              className="btn primary"
              onClick={() => onStartPractice?.(selectedCategoryData.category.id)}
            >
              Practice This Category
            </button>
            <button
              className="btn secondary"
              onClick={() => setSelectedCategory(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CategorySelector - simplified category picker.
 */
export interface CategorySelectorProps {
  /** Currently selected category */
  value?: SemanticCategory | null;
  /** Change handler */
  onChange: (category: SemanticCategory | null) => void;
  /** Whether to allow clearing selection */
  allowClear?: boolean;
  /** Label text */
  label?: string;
}

export function CategorySelector({
  value,
  onChange,
  allowClear = true,
  label = 'Category',
}: CategorySelectorProps): React.ReactElement {
  return (
    <div className="category-selector">
      {label && <label className="selector-label">{label}</label>}
      <div className="selector-chips">
        {allowClear && (
          <button
            className={`selector-chip ${value === null ? 'selected' : ''}`}
            onClick={() => onChange(null)}
          >
            All
          </button>
        )}
        {CATEGORY_DEFINITIONS.map((category) => (
          <button
            key={category.id}
            className={`selector-chip ${value === category.id ? 'selected' : ''}`}
            style={{ '--category-color': category.color } as React.CSSProperties}
            onClick={() => onChange(category.id)}
          >
            {category.icon} {category.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryBrowser;

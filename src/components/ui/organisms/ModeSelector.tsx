/**
 * Mode Selector Component
 *
 * Full-screen mode selection interface shown to new users,
 * allowing them to choose between Campaign Mode and Free Play.
 */

import React, { useMemo } from 'react';
import { useTips, TipTrigger } from '../../../tips';
import { useKeyboardNavigation } from '../../../hooks';
import './ModeSelector.css';

interface ModeSelectorProps {
  onSelectMode: (mode: 'campaign' | 'freeplay') => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  const { triggerTip } = useTips();

  const handleSelectCampaign = () => {
    onSelectMode('campaign');
    // Trigger introductory tip after a short delay to let the UI transition
    setTimeout(() => {
      triggerTip(TipTrigger.CAMPAIGN_START);
    }, 300);
  };

  // Navigation items for keyboard navigation
  const navigationItems = useMemo(() => [
    { id: 'campaign', onActivate: handleSelectCampaign },
    // { id: 'freeplay', onActivate: () => onSelectMode('freeplay') }, // Future
  ], []);

  // Keyboard navigation hook
  const { getItemProps } = useKeyboardNavigation({
    areaId: 'mode-selector',
    layout: 'horizontal',
    items: navigationItems,
  });

  return (
    <div className="mode-selector">
      <div className="mode-selector-header">
        <h1 className="mode-selector-title">CharaChorder Trainer</h1>
        <p className="mode-selector-subtitle">Choose your learning path</p>
      </div>

      <div className="mode-selector-cards" role="listbox" aria-label="Mode selection">
        <button
          className={`mode-card mode-card-campaign ${getItemProps('campaign', 'keyboard-focus--card').className}`}
          onClick={getItemProps('campaign').onClick}
          data-keyboard-focus={getItemProps('campaign')['data-keyboard-focus']}
          aria-label="Start Campaign Mode - Guided learning journey"
        >
          <div className="mode-card-icon">🗺️</div>
          <h2 className="mode-card-title">Campaign Mode</h2>
          <p className="mode-card-subtitle">Guided Learning Journey</p>
          <p className="mode-card-description">
            Progress through structured chapters from finger basics to full word
            chords. Features unlock as you advance through each milestone.
          </p>
          <div className="mode-card-features">
            <span className="mode-card-feature">✓ Step-by-step progression</span>
            <span className="mode-card-feature">✓ Progressive unlocks</span>
            <span className="mode-card-feature">✓ Achievement milestones</span>
          </div>
          <span className="mode-card-cta">Start Journey →</span>
        </button>

        {/* Free Play mode hidden for now */}
      </div>

      <p className="mode-selector-footer">
        Learn CharaChorder step by step
      </p>
    </div>
  );
}

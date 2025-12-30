/**
 * Mode Selector Component
 *
 * Full-screen mode selection interface shown to new users,
 * allowing them to choose between Campaign Mode and Free Play.
 */

import React from 'react';
import { useTips, TipTrigger } from '../../../tips';
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

  return (
    <div className="mode-selector">
      <div className="mode-selector-header">
        <h1 className="mode-selector-title">CharaChorder Trainer</h1>
        <p className="mode-selector-subtitle">Choose your learning path</p>
      </div>

      <div className="mode-selector-cards">
        <button
          className="mode-card mode-card-campaign"
          onClick={handleSelectCampaign}
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

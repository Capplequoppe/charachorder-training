/**
 * Campaign Dashboard Component
 *
 * Main hub for campaign mode. Contains the chapter roadmap
 * and renders the active chapter's content.
 */

import React, { useState, useCallback } from 'react';
import { ChapterRoadmap } from '../../ui/organisms/ChapterRoadmap';
import { FingerFundamentals } from './FingerFundamentals';
import { IntraHandTraining } from '../training/IntraHandTraining';
import { CrossHandTraining } from '../training/CrossHandTraining';
import { WordChordTraining } from '../training/WordChordTraining';
import { Settings } from '../settings/Settings';
import {
  useCampaign,
  ChapterId,
  CHAPTERS,
} from '../../../campaign';
import './CampaignDashboard.css';

export function CampaignDashboard() {
  const {
    campaignState,
    setActiveChapter,
    completeChapter,
    isChapterCompleted,
    isCampaignComplete,
  } = useCampaign();

  const [showSettings, setShowSettings] = useState(false);
  // Counter to force chapter component remount when re-selecting the same chapter
  const [chapterSelectionKey, setChapterSelectionKey] = useState(0);

  const { activeChapterId, chapters } = campaignState;

  // Handle chapter selection - always increment key to force remount to mode-select
  const handleSelectChapter = useCallback((chapterId: ChapterId) => {
    setActiveChapter(chapterId);
    setChapterSelectionKey(prev => prev + 1);
  }, [setActiveChapter]);

  // Get active chapter definition
  const activeChapter = activeChapterId
    ? CHAPTERS.find((c) => c.id === activeChapterId)
    : null;

  // Check if user is revisiting a completed chapter
  const isRevisiting = activeChapterId
    ? isChapterCompleted(activeChapterId)
    : false;

  // Handle chapter completion
  const handleChapterComplete = () => {
    if (activeChapterId && !isRevisiting) {
      completeChapter(activeChapterId);
    }
  };

  // Render the content for the active chapter
  const renderChapterContent = () => {
    if (!activeChapterId || !activeChapter) {
      return (
        <div className="campaign-dashboard__welcome">
          <h2>Welcome to Campaign Mode!</h2>
          <p>Select a chapter from the roadmap to begin your journey.</p>
          <p className="campaign-dashboard__hint">
            Start with Chapter 1 to learn the finger fundamentals.
          </p>
        </div>
      );
    }

    // Common props for campaign-aware components
    const campaignProps = {
      inCampaignMode: true,
      onChapterComplete: isRevisiting ? undefined : handleChapterComplete,
      isRevisiting,
    };

    // Use chapterSelectionKey in the key to force remount when chapter is re-selected
    const componentKey = `${activeChapterId}-${chapterSelectionKey}`;

    switch (activeChapterId) {
      case ChapterId.FINGER_FUNDAMENTALS:
        return <FingerFundamentals key={componentKey} {...campaignProps} />;

      case ChapterId.POWER_CHORDS_LEFT:
        return <IntraHandTraining key={componentKey} hand="left" {...campaignProps} />;

      case ChapterId.POWER_CHORDS_RIGHT:
        return <IntraHandTraining key={componentKey} hand="right" {...campaignProps} />;

      case ChapterId.POWER_CHORDS_CROSS:
        return <CrossHandTraining key={componentKey} onComplete={() => {}} {...campaignProps} />;

      case ChapterId.WORD_CHORDS:
        return (
          <WordChordTraining
            key={componentKey}
            onComplete={handleChapterComplete}
            {...campaignProps}
          />
        );

      default:
        return (
          <div className="campaign-dashboard__welcome">
            <p>Unknown chapter</p>
          </div>
        );
    }
  };

  return (
    <div className="campaign-dashboard">
      {/* Header */}
      <header className="campaign-dashboard__header">
        <div className="campaign-dashboard__title-group">
          <h1 className="campaign-dashboard__title">
            <span className="campaign-dashboard__icon">🗺️</span>
            Campaign Mode
          </h1>
          {isCampaignComplete() && (
            <span className="campaign-dashboard__complete-badge">
              ✓ Complete!
            </span>
          )}
        </div>
        <button
          className="campaign-dashboard__settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙️ Settings
        </button>
      </header>

      <div className="campaign-dashboard__layout">
        {/* Sidebar with roadmap */}
        <aside className="campaign-dashboard__sidebar">
          <ChapterRoadmap
            chapterStatuses={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={handleSelectChapter}
          />
        </aside>

        {/* Main content area */}
        <main className="campaign-dashboard__content">
          {showSettings ? (
            <div className="campaign-dashboard__settings-panel">
              <button
                className="campaign-dashboard__back-button"
                onClick={() => setShowSettings(false)}
              >
                ← Back to Campaign
              </button>
              <Settings />
            </div>
          ) : (
            <>
              {activeChapter && (
                <div className="campaign-dashboard__chapter-header">
                  <span className="campaign-dashboard__chapter-number">
                    Chapter {activeChapter.number}
                  </span>
                  <h2 className="campaign-dashboard__chapter-title">
                    {activeChapter.icon} {activeChapter.title}
                  </h2>
                  <p className="campaign-dashboard__chapter-description">
                    {activeChapter.description}
                  </p>
                  {isRevisiting && (
                    <span className="campaign-dashboard__revisiting-badge">
                      Practicing
                    </span>
                  )}
                </div>
              )}

              <div className="campaign-dashboard__chapter-content">
                {renderChapterContent()}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

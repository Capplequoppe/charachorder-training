/**
 * Chapter Roadmap Component
 *
 * Visual navigation showing all chapters arranged to display
 * the progression path and dependencies.
 */

import React, { useMemo, useCallback } from 'react';
import { ChapterCard } from '../molecules/ChapterCard';
import {
  ChapterId,
  CHAPTERS,
  type ChapterDefinition,
  type ChapterStatus,
} from '../../../campaign';
import { useKeyboardNavigation, useKeyboardNavigationContext } from '../../../hooks';
import './ChapterRoadmap.css';

interface ChapterRoadmapProps {
  /** Status of each chapter */
  chapterStatuses: Record<ChapterId, ChapterStatus>;
  /** Currently active chapter */
  activeChapterId: ChapterId | null;
  /** Callback when a chapter is selected */
  onSelectChapter: (chapterId: ChapterId) => void;
}

/**
 * Count completed chapters.
 */
function countCompleted(statuses: Record<ChapterId, ChapterStatus>): number {
  return Object.values(statuses).filter((s) => s.isCompleted).length;
}

export function ChapterRoadmap({
  chapterStatuses,
  activeChapterId,
  onSelectChapter,
}: ChapterRoadmapProps) {
  const { setActiveArea } = useKeyboardNavigationContext();
  const completedCount = countCompleted(chapterStatuses);
  const totalCount = CHAPTERS.length;

  // Group chapters for layout
  const chapter1 = CHAPTERS.find((c) => c.id === ChapterId.FINGER_FUNDAMENTALS)!;
  const chapter2a = CHAPTERS.find((c) => c.id === ChapterId.POWER_CHORDS_LEFT)!;
  const chapter2b = CHAPTERS.find((c) => c.id === ChapterId.POWER_CHORDS_RIGHT)!;
  const chapter2c = CHAPTERS.find((c) => c.id === ChapterId.POWER_CHORDS_CROSS)!;
  const chapter3 = CHAPTERS.find((c) => c.id === ChapterId.WORD_CHORDS)!;

  // Chapter order for keyboard navigation (vertical list)
  const chapterOrder = [
    ChapterId.FINGER_FUNDAMENTALS,
    ChapterId.POWER_CHORDS_LEFT,
    ChapterId.POWER_CHORDS_RIGHT,
    ChapterId.POWER_CHORDS_CROSS,
    ChapterId.WORD_CHORDS,
  ];

  // Handle chapter selection with focus transfer
  const handleChapterSelect = useCallback((chapterId: ChapterId) => {
    onSelectChapter(chapterId);
    // Move focus to the content area after selecting a chapter
    // Use a small delay to ensure the content area is registered
    setTimeout(() => {
      setActiveArea('campaign-content');
    }, 50);
  }, [onSelectChapter, setActiveArea]);

  // Create navigation items for keyboard navigation
  const navigationItems = useMemo(() => {
    return chapterOrder.map((chapterId) => ({
      id: chapterId,
      onActivate: () => {
        if (chapterStatuses[chapterId].isUnlocked) {
          handleChapterSelect(chapterId);
        }
      },
      disabled: !chapterStatuses[chapterId].isUnlocked,
    }));
  }, [chapterStatuses, handleChapterSelect]);

  // Keyboard navigation hook
  const { getItemProps, focusedItemId } = useKeyboardNavigation({
    areaId: 'campaign-sidebar',
    layout: 'vertical',
    items: navigationItems,
    rightArea: 'campaign-content',
  });

  const renderChapterCard = (chapter: ChapterDefinition) => {
    const itemProps = getItemProps(chapter.id, 'keyboard-focus--card');
    return (
      <ChapterCard
        key={chapter.id}
        chapter={chapter}
        status={chapterStatuses[chapter.id]}
        isActive={activeChapterId === chapter.id}
        onClick={itemProps.onClick}
        data-keyboard-focus={itemProps['data-keyboard-focus']}
        keyboardClassName={itemProps.className}
      />
    );
  };

  // Determine line states based on completion
  const line1State = chapterStatuses[ChapterId.FINGER_FUNDAMENTALS].isCompleted
    ? 'completed'
    : 'pending';
  const line2aState = chapterStatuses[ChapterId.POWER_CHORDS_LEFT].isCompleted
    ? 'completed'
    : chapterStatuses[ChapterId.POWER_CHORDS_LEFT].isUnlocked
    ? 'unlocked'
    : 'pending';
  const line2bState = chapterStatuses[ChapterId.POWER_CHORDS_RIGHT].isCompleted
    ? 'completed'
    : chapterStatuses[ChapterId.POWER_CHORDS_RIGHT].isUnlocked
    ? 'unlocked'
    : 'pending';
  const line2cState = chapterStatuses[ChapterId.POWER_CHORDS_CROSS].isCompleted
    ? 'completed'
    : chapterStatuses[ChapterId.POWER_CHORDS_CROSS].isUnlocked
    ? 'unlocked'
    : 'pending';

  return (
    <div className="chapter-roadmap">
      {/* Progress summary */}
      <div className="chapter-roadmap__progress">
        <span className="chapter-roadmap__progress-text">
          {completedCount} of {totalCount} Chapters Complete
        </span>
        <div className="chapter-roadmap__progress-bar">
          <div
            className="chapter-roadmap__progress-fill"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Roadmap visualization */}
      <div className="chapter-roadmap__map">
        {/* Chapter 1 */}
        <div className="chapter-roadmap__row chapter-roadmap__row--single">
          {renderChapterCard(chapter1)}
        </div>

        {/* Connecting line from Chapter 1 */}
        <div className={`chapter-roadmap__connector chapter-roadmap__connector--fork chapter-roadmap__connector--${line1State}`}>
          <svg viewBox="0 0 200 40" className="chapter-roadmap__line-svg">
            <path
              d="M100,0 L100,20 M100,20 L40,40 M100,20 L160,40"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Chapters 2a and 2b side by side */}
        <div className="chapter-roadmap__row chapter-roadmap__row--double">
          {renderChapterCard(chapter2a)}
          {renderChapterCard(chapter2b)}
        </div>

        {/* Connecting lines from 2a and 2b to 2c */}
        <div className={`chapter-roadmap__connector chapter-roadmap__connector--join`}>
          <svg viewBox="0 0 200 40" className="chapter-roadmap__line-svg">
            <path
              d="M40,0 L40,20 M160,0 L160,20 M40,20 L100,40 M160,20 L100,40"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              className={`chapter-roadmap__line--${line2aState}`}
            />
          </svg>
        </div>

        {/* Chapter 2c */}
        <div className="chapter-roadmap__row chapter-roadmap__row--single">
          {renderChapterCard(chapter2c)}
        </div>

        {/* Connecting line from 2c to 3 */}
        <div className={`chapter-roadmap__connector chapter-roadmap__connector--single chapter-roadmap__connector--${line2cState}`}>
          <svg viewBox="0 0 200 40" className="chapter-roadmap__line-svg">
            <path
              d="M100,0 L100,40"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Chapter 3 */}
        <div className="chapter-roadmap__row chapter-roadmap__row--single">
          {renderChapterCard(chapter3)}
        </div>
      </div>
    </div>
  );
}

/**
 * Campaign React Context
 *
 * Provides campaign state and actions to the component tree.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  ChapterId,
  CampaignState,
  CampaignContextValue,
  ChapterMasteryProgress,
  UnlockableFeature,
  ChapterDefinition,
} from './types';
import { getServices } from '../services';
import { CHAPTER_MAP, CHAPTERS } from './constants';

/**
 * React context for campaign state.
 */
const CampaignContext = createContext<CampaignContextValue | null>(null);

/**
 * Props for the CampaignProvider component.
 */
interface CampaignProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the application and provides campaign context.
 */
export function CampaignProvider({ children }: CampaignProviderProps) {
  // Get campaign service from container
  const campaignService = getServices().campaign;

  // Initialize state from service
  const [campaignState, setCampaignState] = useState<CampaignState>(() =>
    campaignService.getState()
  );

  // Sync state changes from service
  const updateState = useCallback((newState: CampaignState) => {
    setCampaignState(newState);
  }, []);

  // Actions
  const setMode = useCallback(
    (mode: 'campaign' | 'freeplay') => {
      const newState = campaignService.setMode(mode);
      updateState(newState);
    },
    [campaignService, updateState]
  );

  const setActiveChapter = useCallback(
    (chapterId: ChapterId) => {
      const newState = campaignService.setActiveChapter(chapterId);
      updateState(newState);
    },
    [campaignService, updateState]
  );

  const completeChapter = useCallback(
    (chapterId: ChapterId) => {
      const newState = campaignService.completeChapter(chapterId);
      updateState(newState);
    },
    [campaignService, updateState]
  );

  const recordBossAttempt = useCallback(
    (chapterId: ChapterId, scorePercent: number) => {
      const newState = campaignService.recordBossAttempt(chapterId, scorePercent);
      updateState(newState);
    },
    [campaignService, updateState]
  );

  const clearPendingUnlock = useCallback(() => {
    const newState = campaignService.clearPendingUnlock();
    updateState(newState);
  }, [campaignService, updateState]);

  const resetCampaign = useCallback(() => {
    const newState = campaignService.resetCampaign();
    updateState(newState);
  }, [campaignService, updateState]);

  const unlockChapter = useCallback(
    (chapterId: ChapterId) => {
      const newState = campaignService.unlockChapter(chapterId);
      updateState(newState);
    },
    [campaignService, updateState]
  );

  // Queries
  const isChapterUnlocked = useCallback(
    (chapterId: ChapterId): boolean => {
      return campaignState.chapters[chapterId]?.isUnlocked ?? false;
    },
    [campaignState.chapters]
  );

  const isChapterCompleted = useCallback(
    (chapterId: ChapterId): boolean => {
      return campaignState.chapters[chapterId]?.isCompleted ?? false;
    },
    [campaignState.chapters]
  );

  const isFeatureUnlocked = useCallback(
    (feature: UnlockableFeature): boolean => {
      return campaignService.isFeatureUnlocked(feature);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaignService, campaignState.unlockedFeatures]
  );

  const getChapterDefinition = useCallback(
    (chapterId: ChapterId): ChapterDefinition | undefined => {
      return CHAPTER_MAP.get(chapterId);
    },
    []
  );

  const getNextChapters = useCallback(
    (chapterId: ChapterId): ChapterDefinition[] => {
      const chapter = CHAPTER_MAP.get(chapterId);
      if (!chapter) return [];

      return CHAPTERS.filter((c) => {
        if (!c.requires.includes(chapterId)) return false;
        const otherReqs = c.requires.filter((r) => r !== chapterId);
        return otherReqs.every((r) => campaignState.chapters[r]?.isCompleted);
      });
    },
    [campaignState.chapters]
  );

  const isCampaignComplete = useCallback((): boolean => {
    return CHAPTERS.every((chapter) => campaignState.chapters[chapter.id]?.isCompleted);
  }, [campaignState.chapters]);

  const getChapterMasteryProgress = useCallback(
    (chapterId: ChapterId): ChapterMasteryProgress => {
      return campaignService.getChapterMasteryProgress(chapterId);
    },
    [campaignService]
  );

  const isChapterMastered = useCallback(
    (chapterId: ChapterId): boolean => {
      return campaignService.isChapterMastered(chapterId);
    },
    [campaignService]
  );

  const isBossDefeated = useCallback(
    (chapterId: ChapterId): boolean => {
      return campaignState.chapters[chapterId]?.bossDefeated ?? false;
    },
    [campaignState.chapters]
  );

  const isChapterReadyForCompletion = useCallback(
    (chapterId: ChapterId): boolean => {
      return campaignService.isChapterReadyForCompletion(chapterId);
    },
    [campaignService]
  );

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<CampaignContextValue>(
    () => ({
      campaignState,
      setMode,
      setActiveChapter,
      completeChapter,
      recordBossAttempt,
      clearPendingUnlock,
      resetCampaign,
      unlockChapter,
      isChapterUnlocked,
      isChapterCompleted,
      isFeatureUnlocked,
      getChapterDefinition,
      getNextChapters,
      isCampaignComplete,
      getChapterMasteryProgress,
      isChapterMastered,
      isBossDefeated,
      isChapterReadyForCompletion,
    }),
    [
      campaignState,
      setMode,
      setActiveChapter,
      completeChapter,
      recordBossAttempt,
      clearPendingUnlock,
      resetCampaign,
      unlockChapter,
      isChapterUnlocked,
      isChapterCompleted,
      isFeatureUnlocked,
      getChapterDefinition,
      getNextChapters,
      isCampaignComplete,
      getChapterMasteryProgress,
      isChapterMastered,
      isBossDefeated,
      isChapterReadyForCompletion,
    ]
  );

  return (
    <CampaignContext.Provider value={contextValue}>
      {children}
    </CampaignContext.Provider>
  );
}

/**
 * Hook to access campaign context.
 * Must be used within a CampaignProvider.
 */
export function useCampaign(): CampaignContextValue {
  const context = useContext(CampaignContext);

  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }

  return context;
}

/**
 * Hook to check if we're in campaign mode.
 * Convenience wrapper for common check.
 */
export function useIsCampaignMode(): boolean {
  const { campaignState } = useCampaign();
  return campaignState.mode === 'campaign';
}

/**
 * Hook to get the current active chapter.
 */
export function useActiveChapter(): ChapterDefinition | null {
  const { campaignState, getChapterDefinition } = useCampaign();

  if (!campaignState.activeChapterId) return null;
  return getChapterDefinition(campaignState.activeChapterId) ?? null;
}

/**
 * Campaign Module
 *
 * Public exports for the campaign system.
 */

// Types
export {
  ChapterId,
  UnlockableFeature,
  type ChapterComponentKey,
  type ChapterStatus,
  type ChapterMasteryProgress,
  type ChapterDefinition,
  type CampaignState,
  type CampaignActions,
  type CampaignQueries,
  type CampaignContextValue,
} from './types';

// Constants
export {
  CHAPTERS,
  CHAPTER_MAP,
  ALWAYS_AVAILABLE_FEATURES,
  BOSS_REQUIREMENTS,
  CAMPAIGN_STORAGE_KEY,
  FEATURE_INFO,
  createInitialCampaignState,
  getDependentChapters,
  arePrerequisitesMet,
} from './constants';

// Service
export { CampaignService } from './CampaignService';

// React Context and Hooks
export {
  CampaignProvider,
  useCampaign,
  useIsCampaignMode,
  useActiveChapter,
} from './CampaignContext';

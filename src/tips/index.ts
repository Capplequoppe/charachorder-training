/**
 * Tips Module
 *
 * Educational tip system for explaining learning techniques
 * to users throughout their CharaChorder training journey.
 */

// Types
export { TipId, TipTrigger, createInitialTipsState } from './types';
export type { TipDefinition, TipsState } from './types';

// Content
export { TIPS, TIPS_MAP, TIPS_BY_TRIGGER, getTipById, getTipsForTrigger } from './tips';

// Service
export { TipsService, getTipsService, resetTipsService } from './TipsService';

// Context and hooks
export { TipsProvider, useTips, useTipTrigger } from './TipsContext';

// Components
export { TipModal } from './TipModal';

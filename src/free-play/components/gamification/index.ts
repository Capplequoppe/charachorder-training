/**
 * Gamification Components
 *
 * Components for combo system, achievements, and reward effects.
 */

// Combo components
export { ComboDisplay, ComboInline, ComboMeter } from './ComboDisplay';
export type { ComboDisplayProps, ComboInlineProps, ComboMeterProps } from './ComboDisplay';

export { ComboEffects, ParticleBurst, useScreenEffects } from './ComboEffects';
export type { ComboEffectsProps, ParticleBurstProps } from './ComboEffects';

// Achievement components
export { AchievementCard, AchievementModal } from './AchievementCard';
export type { AchievementCardProps, AchievementModalProps } from './AchievementCard';

export {
  AchievementNotification,
  AchievementQueue,
  AchievementBadge,
} from './AchievementNotification';
export type {
  AchievementNotificationProps,
  AchievementQueueProps,
  AchievementBadgeProps,
} from './AchievementNotification';

export {
  AchievementGallery,
  AchievementWidget,
  RecentUnlocks,
} from './AchievementGallery';
export type {
  AchievementGalleryProps,
  AchievementWidgetProps,
  RecentUnlocksProps,
} from './AchievementGallery';

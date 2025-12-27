/**
 * Tips Context
 *
 * React context for managing educational tips throughout the application.
 * Provides state management and actions for triggering/dismissing tips.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { TipTrigger, type TipDefinition, type TipsState } from './types';
import { getTipsService } from './TipsService';

/**
 * Context value interface.
 */
interface TipsContextValue {
  /** Current tips state */
  tipsState: TipsState;
  /** Currently displayed tip (null if none) */
  currentTip: TipDefinition | null;
  /** Trigger a tip for a specific trigger point */
  triggerTip: (trigger: TipTrigger) => void;
  /** Dismiss the current tip */
  dismissTip: () => void;
  /** Enable or disable tips globally */
  setTipsEnabled: (enabled: boolean) => void;
  /** Reset all tips to show again */
  resetTips: () => void;
}

const TipsContext = createContext<TipsContextValue | null>(null);

/**
 * Props for TipsProvider.
 */
interface TipsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for tips context.
 */
export function TipsProvider({ children }: TipsProviderProps) {
  const tipsService = getTipsService();

  const [tipsState, setTipsState] = useState<TipsState>(tipsService.getState());
  const [currentTip, setCurrentTip] = useState<TipDefinition | null>(null);

  // Subscribe to service state changes
  useEffect(() => {
    const unsubscribe = tipsService.subscribe((newState) => {
      setTipsState(newState);
    });

    return unsubscribe;
  }, [tipsService]);

  /**
   * Trigger a tip for a specific trigger point.
   * Only shows if the tip hasn't been shown before.
   */
  const triggerTip = useCallback(
    (trigger: TipTrigger) => {
      // Don't trigger if a tip is already showing
      if (currentTip) {
        return;
      }

      const tip = tipsService.getNextUnshownTip(trigger);
      if (tip) {
        setCurrentTip(tip);
      }
    },
    [currentTip, tipsService]
  );

  /**
   * Dismiss the current tip and mark it as shown.
   */
  const dismissTip = useCallback(() => {
    if (currentTip) {
      tipsService.markTipAsShown(currentTip.id);
      setCurrentTip(null);
    }
  }, [currentTip, tipsService]);

  /**
   * Enable or disable tips globally.
   */
  const setTipsEnabled = useCallback(
    (enabled: boolean) => {
      tipsService.setTipsEnabled(enabled);
      // If disabling and a tip is showing, dismiss it
      if (!enabled && currentTip) {
        setCurrentTip(null);
      }
    },
    [currentTip, tipsService]
  );

  /**
   * Reset all tips to show again.
   */
  const resetTips = useCallback(() => {
    tipsService.resetTips();
  }, [tipsService]);

  const contextValue: TipsContextValue = {
    tipsState,
    currentTip,
    triggerTip,
    dismissTip,
    setTipsEnabled,
    resetTips,
  };

  return (
    <TipsContext.Provider value={contextValue}>{children}</TipsContext.Provider>
  );
}

/**
 * Hook to access tips context.
 * @throws Error if used outside TipsProvider
 */
export function useTips(): TipsContextValue {
  const context = useContext(TipsContext);

  if (!context) {
    throw new Error('useTips must be used within a TipsProvider');
  }

  return context;
}

/**
 * Hook for triggering tips at specific points.
 * Simpler API for components that only need to trigger tips.
 */
export function useTipTrigger() {
  const { triggerTip } = useTips();
  return triggerTip;
}

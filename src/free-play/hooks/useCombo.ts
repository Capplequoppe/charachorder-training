/**
 * useCombo Hook
 *
 * React hook for integrating combo system into components.
 * Handles state updates, audio playback, and provides combo actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getComboService,
  type ComboState,
} from '@/free-play/services/ComboService';
import { getComboTierIndex } from '@/data/static/comboConfig';
import { getServices } from '@/services';

export interface UseComboResult {
  comboState: ComboState;
  recordCorrect: () => ComboState;
  recordIncorrect: () => ComboState;
  reset: () => void;
  currentMultiplier: number;
  isOnFire: boolean;
}

export interface UseComboOptions {
  enableAudio?: boolean;
  onLevelUp?: (tier: number) => void;
  onStreakBroken?: (streak: number) => void;
}

export function useCombo(options: UseComboOptions = {}): UseComboResult {
  const {
    enableAudio = true,
    onLevelUp,
    onStreakBroken,
  } = options;

  const comboService = getComboService();
  const [comboState, setComboState] = useState<ComboState>(comboService.getState());

  // Subscribe to combo state changes
  useEffect(() => {
    return comboService.onStateChange((state) => {
      setComboState(state);

      // Play appropriate sounds
      if (enableAudio) {
        try {
          const { audio } = getServices();

          if (state.justLeveledUp) {
            const tierIndex = getComboTierIndex(state.currentStreak);
            audio.playLevelUpSound(tierIndex);
            onLevelUp?.(tierIndex);
          } else if (state.justBrokeStreak) {
            audio.playStreakBrokenSound(state.brokenStreak);
            onStreakBroken?.(state.brokenStreak);
          }
        } catch {
          // Audio service may not be initialized
        }
      }
    });
  }, [comboService, enableAudio, onLevelUp, onStreakBroken]);

  const recordCorrect = useCallback(() => {
    return comboService.recordCorrect();
  }, [comboService]);

  const recordIncorrect = useCallback(() => {
    return comboService.recordIncorrect();
  }, [comboService]);

  const reset = useCallback(() => {
    comboService.reset();
  }, [comboService]);

  return {
    comboState,
    recordCorrect,
    recordIncorrect,
    reset,
    currentMultiplier: comboState.currentTier.scoreMultiplier,
    isOnFire: comboState.currentStreak >= 10,
  };
}

// ==================== Simpler Alternative Hook ====================

/**
 * Simple streak counter hook without the full combo system.
 * Useful for components that just need to track streaks.
 */
export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const recordCorrect = useCallback(() => {
    setStreak(prev => {
      const newStreak = prev + 1;
      setBestStreak(best => Math.max(best, newStreak));
      return newStreak;
    });
  }, []);

  const recordIncorrect = useCallback(() => {
    setStreak(0);
  }, []);

  const reset = useCallback(() => {
    setStreak(0);
    setBestStreak(0);
  }, []);

  return {
    streak,
    bestStreak,
    recordCorrect,
    recordIncorrect,
    reset,
  };
}

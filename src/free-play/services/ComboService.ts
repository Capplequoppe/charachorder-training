/**
 * Combo Service
 *
 * Manages combo/streak state and notifies listeners of changes.
 */

import {
  type ComboTier,
  COMBO_TIERS,
  getComboTier,
  isNewTier,
} from '@/data/static/comboConfig';

// ==================== Types ====================

export interface ComboState {
  currentStreak: number;
  bestStreak: number;
  currentTier: ComboTier;
  previousTier: ComboTier | null;
  justLeveledUp: boolean;
  justBrokeStreak: boolean;
  brokenStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
}

export type ComboStateListener = (state: ComboState) => void;

export interface IComboService {
  getState(): ComboState;
  recordCorrect(): ComboState;
  recordIncorrect(): ComboState;
  reset(): void;
  onStateChange(callback: ComboStateListener): () => void;
}

// ==================== Implementation ====================

export class ComboService implements IComboService {
  private currentStreak = 0;
  private bestStreak = 0;
  private totalCorrect = 0;
  private totalIncorrect = 0;
  private listeners: Set<ComboStateListener> = new Set();

  /**
   * Get current combo state
   */
  getState(): ComboState {
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      currentTier: getComboTier(this.currentStreak),
      previousTier: null,
      justLeveledUp: false,
      justBrokeStreak: false,
      brokenStreak: 0,
      totalCorrect: this.totalCorrect,
      totalIncorrect: this.totalIncorrect,
    };
  }

  /**
   * Record a correct answer
   */
  recordCorrect(): ComboState {
    const previousStreak = this.currentStreak;
    const previousTier = getComboTier(previousStreak);

    this.currentStreak++;
    this.totalCorrect++;
    this.bestStreak = Math.max(this.bestStreak, this.currentStreak);

    const currentTier = getComboTier(this.currentStreak);
    const justLeveledUp = isNewTier(previousStreak, this.currentStreak);

    const state: ComboState = {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      currentTier,
      previousTier: justLeveledUp ? previousTier : null,
      justLeveledUp,
      justBrokeStreak: false,
      brokenStreak: 0,
      totalCorrect: this.totalCorrect,
      totalIncorrect: this.totalIncorrect,
    };

    this.notifyListeners(state);
    return state;
  }

  /**
   * Record an incorrect answer
   */
  recordIncorrect(): ComboState {
    const brokenStreak = this.currentStreak;
    const previousTier = getComboTier(this.currentStreak);

    this.currentStreak = 0;
    this.totalIncorrect++;

    const state: ComboState = {
      currentStreak: 0,
      bestStreak: this.bestStreak,
      currentTier: COMBO_TIERS[0],
      previousTier,
      justLeveledUp: false,
      justBrokeStreak: brokenStreak >= 3, // Only show broken message for streaks >= 3
      brokenStreak,
      totalCorrect: this.totalCorrect,
      totalIncorrect: this.totalIncorrect,
    };

    this.notifyListeners(state);
    return state;
  }

  /**
   * Reset all combo state
   */
  reset(): void {
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.totalCorrect = 0;
    this.totalIncorrect = 0;
    this.notifyListeners(this.getState());
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  onStateChange(callback: ComboStateListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(state: ComboState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in combo state listener:', error);
      }
    });
  }
}

// ==================== Singleton ====================

let comboServiceInstance: ComboService | null = null;

export function getComboService(): ComboService {
  if (!comboServiceInstance) {
    comboServiceInstance = new ComboService();
  }
  return comboServiceInstance;
}

export function resetComboService(): void {
  comboServiceInstance = null;
}

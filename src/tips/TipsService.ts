/**
 * Tips Service
 *
 * Business logic for managing educational tips.
 * Handles state persistence and tip visibility tracking.
 */

import {
  TipId,
  TipTrigger,
  type TipDefinition,
  type TipsState,
  createInitialTipsState,
} from './types';
import { getTipsForTrigger } from './tips';

/** Storage key for tips state */
const TIPS_STORAGE_KEY = 'cc_tips_state';

/**
 * Service for managing educational tips.
 * Follows the singleton pattern for consistent state access.
 */
export class TipsService {
  private state: TipsState;
  private subscribers: Set<(state: TipsState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  /**
   * Get current tips state.
   */
  getState(): TipsState {
    return this.state;
  }

  /**
   * Check if a specific tip has been shown.
   */
  hasTipBeenShown(tipId: TipId): boolean {
    return this.state.shownTips.includes(tipId);
  }

  /**
   * Check if tips are enabled globally.
   */
  areTipsEnabled(): boolean {
    return this.state.tipsEnabled;
  }

  /**
   * Mark a tip as shown.
   */
  markTipAsShown(tipId: TipId): TipsState {
    if (this.hasTipBeenShown(tipId)) {
      return this.state;
    }

    this.state = {
      ...this.state,
      shownTips: [...this.state.shownTips, tipId],
      lastTipShownAt: new Date().toISOString(),
    };

    this.saveState();
    return this.state;
  }

  /**
   * Get the next unshown tip for a trigger point.
   * Returns null if all tips for this trigger have been shown or tips are disabled.
   */
  getNextUnshownTip(trigger: TipTrigger): TipDefinition | null {
    if (!this.state.tipsEnabled) {
      return null;
    }

    const tipsForTrigger = getTipsForTrigger(trigger);

    for (const tip of tipsForTrigger) {
      if (!this.hasTipBeenShown(tip.id)) {
        return tip;
      }
    }

    return null;
  }

  /**
   * Enable or disable tips globally.
   */
  setTipsEnabled(enabled: boolean): TipsState {
    this.state = {
      ...this.state,
      tipsEnabled: enabled,
    };

    this.saveState();
    return this.state;
  }

  /**
   * Reset all tips so they can be shown again.
   */
  resetTips(): TipsState {
    this.state = {
      ...createInitialTipsState(),
      tipsEnabled: this.state.tipsEnabled, // Preserve enabled state
    };

    this.saveState();
    return this.state;
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(callback: (state: TipsState) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Load state from localStorage.
   */
  private loadState(): TipsState {
    try {
      const stored = localStorage.getItem(TIPS_STORAGE_KEY);
      if (!stored) {
        return createInitialTipsState();
      }

      const parsed = JSON.parse(stored) as TipsState;

      // Validate structure
      if (!this.isValidState(parsed)) {
        console.warn('Invalid tips state in storage, resetting');
        return createInitialTipsState();
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load tips state:', error);
      return createInitialTipsState();
    }
  }

  /**
   * Save state to localStorage.
   */
  private saveState(): void {
    try {
      localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(this.state));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save tips state:', error);
    }
  }

  /**
   * Validate state structure.
   */
  private isValidState(state: unknown): state is TipsState {
    if (!state || typeof state !== 'object') {
      return false;
    }

    const s = state as Record<string, unknown>;

    return (
      Array.isArray(s.shownTips) &&
      typeof s.tipsEnabled === 'boolean' &&
      (s.lastTipShownAt === null || typeof s.lastTipShownAt === 'string')
    );
  }

  /**
   * Notify all subscribers of state change.
   */
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }
}

// Singleton instance
let tipsServiceInstance: TipsService | null = null;

/**
 * Get the singleton TipsService instance.
 */
export function getTipsService(): TipsService {
  if (!tipsServiceInstance) {
    tipsServiceInstance = new TipsService();
  }
  return tipsServiceInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetTipsService(): void {
  tipsServiceInstance = null;
}

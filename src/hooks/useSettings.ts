/**
 * Settings Hook
 *
 * Manages persistent application settings including audio preferences.
 * Settings are stored in localStorage and synchronized with services.
 */

import { useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '../data/storage/LocalStorageAdapter';
import { getServices } from '../services/ServiceContainer';
import type { InstrumentPreset } from '../services/AudioService';

/**
 * Application settings structure.
 */
export interface AppSettings {
  // Audio settings
  audio: {
    /** Whether sound is enabled */
    enabled: boolean;
    /** Master volume (0-1) */
    volume: number;
    /** Whether to use soundfont instruments (vs oscillator synthesis) */
    useSoundfonts: boolean;
    /** Current instrument preset */
    instrument: InstrumentPreset;
  };
  // Display settings (for future expansion)
  display: {
    /** Show finger labels on keyboard */
    showFingerLabels: boolean;
    /** Show note names */
    showNoteNames: boolean;
  };
  // Training settings
  training: {
    /** Number of items to learn in one session (5-10) */
    itemsPerLearnSession: number;
  };
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: AppSettings = {
  audio: {
    enabled: true,
    volume: 0.8,
    useSoundfonts: true,
    instrument: 'guitarNylon',
  },
  display: {
    showFingerLabels: true,
    showNoteNames: false,
  },
  training: {
    itemsPerLearnSession: 5,
  },
};

/**
 * Hook result interface.
 */
export interface UseSettingsResult {
  settings: AppSettings;
  isLoading: boolean;

  // Audio settings
  setAudioEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setUseSoundfonts: (enabled: boolean) => void;
  setInstrument: (instrument: InstrumentPreset) => Promise<void>;

  // Display settings
  setShowFingerLabels: (show: boolean) => void;
  setShowNoteNames: (show: boolean) => void;

  // Training settings
  setItemsPerLearnSession: (count: number) => void;

  // Bulk operations
  resetToDefaults: () => void;
}

/**
 * Hook for managing application settings.
 * Persists settings to localStorage and syncs with audio service.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const saved = storage.get<AppSettings>(STORAGE_KEYS.SETTINGS);
      if (saved) {
        // Merge with defaults to handle new settings fields
        const merged: AppSettings = {
          audio: { ...DEFAULT_SETTINGS.audio, ...saved.audio },
          display: { ...DEFAULT_SETTINGS.display, ...saved.display },
          training: { ...DEFAULT_SETTINGS.training, ...saved.training },
        };
        setSettings(merged);

        // Apply audio settings to service
        const { audio } = getServices();
        audio.setMuted(!merged.audio.enabled);
        audio.setMasterVolume(merged.audio.volume);
        audio.setUseSoundfonts(merged.audio.useSoundfonts);

        // Load instrument if using soundfonts
        if (merged.audio.useSoundfonts) {
          try {
            await audio.setInstrument(merged.audio.instrument);
          } catch (error) {
            console.warn('Failed to load saved instrument:', error);
          }
        }
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  // Save settings whenever they change
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
  }, []);

  // Audio settings handlers
  const setAudioEnabled = useCallback((enabled: boolean) => {
    const { audio } = getServices();
    audio.setMuted(!enabled);

    saveSettings({
      ...settings,
      audio: { ...settings.audio, enabled },
    });
  }, [settings, saveSettings]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const { audio } = getServices();
    audio.setMasterVolume(clampedVolume);

    saveSettings({
      ...settings,
      audio: { ...settings.audio, volume: clampedVolume },
    });
  }, [settings, saveSettings]);

  const setUseSoundfonts = useCallback((enabled: boolean) => {
    const { audio } = getServices();
    audio.setUseSoundfonts(enabled);

    saveSettings({
      ...settings,
      audio: { ...settings.audio, useSoundfonts: enabled },
    });
  }, [settings, saveSettings]);

  const setInstrument = useCallback(async (instrument: InstrumentPreset) => {
    const { audio } = getServices();

    try {
      await audio.setInstrument(instrument);
      saveSettings({
        ...settings,
        audio: { ...settings.audio, instrument },
      });
    } catch (error) {
      console.error('Failed to set instrument:', error);
      throw error;
    }
  }, [settings, saveSettings]);

  // Display settings handlers
  const setShowFingerLabels = useCallback((show: boolean) => {
    saveSettings({
      ...settings,
      display: { ...settings.display, showFingerLabels: show },
    });
  }, [settings, saveSettings]);

  const setShowNoteNames = useCallback((show: boolean) => {
    saveSettings({
      ...settings,
      display: { ...settings.display, showNoteNames: show },
    });
  }, [settings, saveSettings]);

  // Training settings handlers
  const setItemsPerLearnSession = useCallback((count: number) => {
    // Clamp to valid range (5-10)
    const clampedCount = Math.max(5, Math.min(10, count));
    saveSettings({
      ...settings,
      training: { ...settings.training, itemsPerLearnSession: clampedCount },
    });
  }, [settings, saveSettings]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const { audio } = getServices();
    audio.setMuted(!DEFAULT_SETTINGS.audio.enabled);
    audio.setMasterVolume(DEFAULT_SETTINGS.audio.volume);
    audio.setUseSoundfonts(DEFAULT_SETTINGS.audio.useSoundfonts);
    audio.setInstrument(DEFAULT_SETTINGS.audio.instrument);

    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    setAudioEnabled,
    setVolume,
    setUseSoundfonts,
    setInstrument,
    setShowFingerLabels,
    setShowNoteNames,
    setItemsPerLearnSession,
    resetToDefaults,
  };
}

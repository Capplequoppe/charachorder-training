/**
 * useLayouts Hook
 *
 * React hook for managing custom keyboard layouts.
 * Wraps LayoutService and provides reactive state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FingerId,
  Direction,
  LayoutProfile,
  CharacterMapping,
} from '../domain';
import {
  getLayoutService,
  type ILayoutService,
} from '../services/LayoutService';
import type { CharacterConfigEntry } from '../data/static/characterConfig';

/**
 * Result of the useLayouts hook.
 */
export interface UseLayoutsResult {
  // State
  isLoading: boolean;
  activeProfile: LayoutProfile | null;
  profiles: LayoutProfile[];

  // Profile management
  setActiveProfile: (profileId: string | null) => void;
  createProfile: (name: string) => LayoutProfile;
  updateProfile: (profile: LayoutProfile) => void;
  deleteProfile: (profileId: string) => void;
  duplicateProfile: (profileId: string, newName: string) => LayoutProfile;

  // Mapping helpers (using domain entities)
  addMapping: (
    profileId: string,
    char: string,
    fingerId: FingerId,
    direction: Direction
  ) => void;
  removeMapping: (profileId: string, char: string) => void;
  resetProfileMappings: (profileId: string) => void;

  // Effective config access
  getConfigForChar: (char: string) => CharacterConfigEntry | undefined;
  getCharsForFinger: (fingerId: FingerId) => string[];
  getCharForFingerDirection: (
    fingerId: FingerId,
    direction: Direction
  ) => string | undefined;
  getAllCharacters: () => string[];

  // Service reference (for advanced usage)
  layoutService: ILayoutService;
}

/**
 * Hook for managing custom keyboard layouts.
 */
export function useLayouts(): UseLayoutsResult {
  const [layoutService] = useState(() => getLayoutService());
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);

  // Force re-render when service changes
  const forceUpdate = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  // Subscribe to service changes
  useEffect(() => {
    const unsubscribe = layoutService.subscribe(forceUpdate);
    setIsLoading(false);
    return unsubscribe;
  }, [layoutService, forceUpdate]);

  // Current state from service
  const activeProfile = useMemo(
    () => layoutService.getActiveProfile(),
    [layoutService, version]
  );

  const profiles = useMemo(
    () => layoutService.getProfiles(),
    [layoutService, version]
  );

  // Profile management actions
  const setActiveProfile = useCallback(
    (profileId: string | null) => {
      layoutService.setActiveProfile(profileId);
    },
    [layoutService]
  );

  const createProfile = useCallback(
    (name: string) => {
      return layoutService.createProfile(name);
    },
    [layoutService]
  );

  const updateProfile = useCallback(
    (profile: LayoutProfile) => {
      layoutService.updateProfile(profile);
    },
    [layoutService]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      layoutService.deleteProfile(profileId);
    },
    [layoutService]
  );

  const duplicateProfile = useCallback(
    (profileId: string, newName: string) => {
      return layoutService.duplicateProfile(profileId, newName);
    },
    [layoutService]
  );

  // Mapping helpers using domain entities
  const addMapping = useCallback(
    (profileId: string, char: string, fingerId: FingerId, direction: Direction) => {
      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) return;

      try {
        const mapping = CharacterMapping.create(char, fingerId, direction);
        const updatedProfile = profile.withMapping(mapping);
        layoutService.updateProfile(updatedProfile);
      } catch (error) {
        console.warn('Failed to create mapping:', error);
      }
    },
    [layoutService, profiles]
  );

  const removeMapping = useCallback(
    (profileId: string, char: string) => {
      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) return;

      const updatedProfile = profile.withoutMapping(char);
      layoutService.updateProfile(updatedProfile);
    },
    [layoutService, profiles]
  );

  const resetProfileMappings = useCallback(
    (profileId: string) => {
      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) return;

      const updatedProfile = profile.withClearedMappings();
      layoutService.updateProfile(updatedProfile);
    },
    [layoutService, profiles]
  );

  // Effective config access
  const getConfigForChar = useCallback(
    (char: string) => {
      return layoutService.getEffectiveConfigForChar(char);
    },
    [layoutService, version]
  );

  const getCharsForFinger = useCallback(
    (fingerId: FingerId) => {
      return layoutService.getEffectiveCharsForFinger(fingerId);
    },
    [layoutService, version]
  );

  const getCharForFingerDirection = useCallback(
    (fingerId: FingerId, direction: Direction) => {
      return layoutService.getEffectiveCharForFingerDirection(
        fingerId,
        direction
      );
    },
    [layoutService, version]
  );

  const getAllCharacters = useCallback(() => {
    return layoutService.getAllEffectiveCharacters();
  }, [layoutService, version]);

  return {
    isLoading,
    activeProfile,
    profiles,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    addMapping,
    removeMapping,
    resetProfileMappings,
    getConfigForChar,
    getCharsForFinger,
    getCharForFingerDirection,
    getAllCharacters,
    layoutService,
  };
}

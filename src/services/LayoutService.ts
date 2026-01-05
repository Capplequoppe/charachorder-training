/**
 * Layout Service
 *
 * Manages custom CharaChorder keyboard layouts.
 * Provides the "effective" configuration by merging custom layouts with defaults.
 *
 * Follows Single Responsibility Principle:
 * - Profile management (CRUD) is delegated to ILayoutRepository
 * - This service handles business logic: effective config calculation, notifications
 */

import {
  FingerId,
  Direction,
  LayoutProfile,
  CharacterMapping,
} from '../domain';
import {
  ILayoutRepository,
  getLayoutRepository,
} from '../data/repositories/LayoutRepository';
import {
  CharacterConfigEntry,
  CHARACTER_CONFIG,
  CHAR_TO_CONFIG,
  FINGER_DIRECTION_TO_CHAR,
} from '../data/static/characterConfig';

/**
 * Interface for the Layout Service.
 */
export interface ILayoutService {
  // Profile queries (delegated to repository)
  getActiveProfile(): LayoutProfile | null;
  getProfiles(): LayoutProfile[];

  // Profile management
  setActiveProfile(profileId: string | null): void;
  createProfile(name: string): LayoutProfile;
  updateProfile(profile: LayoutProfile): void;
  deleteProfile(profileId: string): void;
  duplicateProfile(profileId: string, newName: string): LayoutProfile;

  // Effective config access (custom + fallback to default)
  getEffectiveConfigForChar(char: string): CharacterConfigEntry | undefined;
  getEffectiveCharsForFinger(fingerId: FingerId): string[];
  getEffectiveCharForFingerDirection(
    fingerId: FingerId,
    direction: Direction
  ): string | undefined;
  getAllEffectiveCharacters(): string[];
  getEffectiveCharToConfig(): Map<string, CharacterConfigEntry>;
  getEffectiveFingerDirectionToChar(): Map<string, string>;

  // Subscription for changes
  subscribe(listener: () => void): () => void;
}

/**
 * Layout service implementation.
 */
export class LayoutService implements ILayoutService {
  private readonly repository: ILayoutRepository;
  private readonly listeners: Set<() => void> = new Set();

  // Cached effective config maps
  private effectiveCharToConfig: Map<string, CharacterConfigEntry> | null = null;
  private effectiveFingerDirectionToChar: Map<string, string> | null = null;

  constructor(repository?: ILayoutRepository) {
    this.repository = repository ?? getLayoutRepository();
  }

  // ==================== Private Methods ====================

  /**
   * Invalidates cached effective config.
   */
  private invalidateCache(): void {
    this.effectiveCharToConfig = null;
    this.effectiveFingerDirectionToChar = null;
  }

  /**
   * Notifies all listeners of changes.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Builds the effective config maps if not cached.
   */
  private ensureEffectiveConfig(): void {
    if (this.effectiveCharToConfig && this.effectiveFingerDirectionToChar) {
      return;
    }

    // Start with default config
    this.effectiveCharToConfig = new Map(CHAR_TO_CONFIG);
    this.effectiveFingerDirectionToChar = new Map(FINGER_DIRECTION_TO_CHAR);

    // If a custom profile is active, overlay its mappings
    const profile = this.getActiveProfile();
    if (profile) {
      for (const mapping of profile.mappings) {
        const entry: CharacterConfigEntry = {
          char: mapping.char,
          fingerId: mapping.fingerId,
          direction: mapping.direction,
        };

        // Override char → config mapping
        this.effectiveCharToConfig.set(mapping.char.toLowerCase(), entry);

        // Override finger+direction → char mapping
        this.effectiveFingerDirectionToChar.set(
          `${mapping.fingerId}:${mapping.direction}`,
          mapping.char
        );
      }
    }
  }

  // ==================== Profile Queries ====================

  getActiveProfile(): LayoutProfile | null {
    return this.repository.getActiveProfile();
  }

  getProfiles(): LayoutProfile[] {
    return this.repository.getAllProfiles();
  }

  // ==================== Profile Management ====================

  setActiveProfile(profileId: string | null): void {
    this.repository.setActiveProfileId(profileId);
    this.invalidateCache();
    this.notifyListeners();
  }

  createProfile(name: string): LayoutProfile {
    const profile = LayoutProfile.create(name);
    this.repository.saveProfile(profile);
    this.notifyListeners();
    return profile;
  }

  updateProfile(profile: LayoutProfile): void {
    this.repository.saveProfile(profile);

    // Invalidate cache if this is the active profile
    const activeId = this.repository.getActiveProfileId();
    if (activeId === profile.id) {
      this.invalidateCache();
    }

    this.notifyListeners();
  }

  deleteProfile(profileId: string): void {
    const wasActive = this.repository.getActiveProfileId() === profileId;
    this.repository.deleteProfile(profileId);

    if (wasActive) {
      this.invalidateCache();
    }

    this.notifyListeners();
  }

  duplicateProfile(profileId: string, newName: string): LayoutProfile {
    const original = this.repository.getProfile(profileId);
    if (!original) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const duplicate = original.duplicate(newName);
    this.repository.saveProfile(duplicate);
    this.notifyListeners();

    return duplicate;
  }

  // ==================== Effective Config Access ====================

  getEffectiveConfigForChar(char: string): CharacterConfigEntry | undefined {
    this.ensureEffectiveConfig();
    return this.effectiveCharToConfig!.get(char.toLowerCase());
  }

  getEffectiveCharsForFinger(fingerId: FingerId): string[] {
    this.ensureEffectiveConfig();
    const chars: string[] = [];

    // Collect all chars for this finger from effective config
    for (const [, entry] of this.effectiveCharToConfig!) {
      if (entry.fingerId === fingerId) {
        chars.push(entry.char);
      }
    }

    return chars;
  }

  getEffectiveCharForFingerDirection(
    fingerId: FingerId,
    direction: Direction
  ): string | undefined {
    this.ensureEffectiveConfig();
    return this.effectiveFingerDirectionToChar!.get(`${fingerId}:${direction}`);
  }

  getAllEffectiveCharacters(): string[] {
    this.ensureEffectiveConfig();
    return Array.from(this.effectiveCharToConfig!.keys());
  }

  getEffectiveCharToConfig(): Map<string, CharacterConfigEntry> {
    this.ensureEffectiveConfig();
    return this.effectiveCharToConfig!;
  }

  getEffectiveFingerDirectionToChar(): Map<string, string> {
    this.ensureEffectiveConfig();
    return this.effectiveFingerDirectionToChar!;
  }

  // ==================== Subscription ====================

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/**
 * Singleton instance.
 */
let layoutServiceInstance: LayoutService | null = null;

/**
 * Gets the singleton LayoutService instance.
 */
export function getLayoutService(): ILayoutService {
  if (!layoutServiceInstance) {
    layoutServiceInstance = new LayoutService();
  }
  return layoutServiceInstance;
}

/**
 * Resets the singleton (for testing).
 */
export function resetLayoutService(): void {
  layoutServiceInstance = null;
}

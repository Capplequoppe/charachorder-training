/**
 * Repository for managing custom keyboard layouts.
 * Persists data to LocalStorage.
 */

import { LayoutProfile, FingerId, Direction } from '../../domain';
import { storage, STORAGE_KEYS } from '../storage/LocalStorageAdapter';

/**
 * Stored layout settings structure.
 */
interface StoredLayoutSettings {
  activeProfileId: string | null;
  profiles: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    mappings: Array<{
      char: string;
      fingerId: FingerId;
      direction: Direction;
    }>;
  }>;
}

/**
 * Interface for layout repository operations.
 */
export interface ILayoutRepository {
  // Profile queries
  getActiveProfileId(): string | null;
  getActiveProfile(): LayoutProfile | null;
  getProfile(id: string): LayoutProfile | undefined;
  getAllProfiles(): LayoutProfile[];

  // Profile mutations
  setActiveProfileId(profileId: string | null): void;
  saveProfile(profile: LayoutProfile): void;
  deleteProfile(profileId: string): void;

  // Persistence
  save(): void;
  reload(): void;
}

/**
 * Default empty settings.
 */
const DEFAULT_SETTINGS: StoredLayoutSettings = {
  activeProfileId: null,
  profiles: [],
};

/**
 * Layout repository implementation with LocalStorage persistence.
 */
export class LayoutRepository implements ILayoutRepository {
  private activeProfileId: string | null;
  private profiles: Map<string, LayoutProfile>;

  constructor() {
    this.activeProfileId = null;
    this.profiles = new Map();
    this.reload();
  }

  // ==================== Profile Queries ====================

  getActiveProfileId(): string | null {
    return this.activeProfileId;
  }

  getActiveProfile(): LayoutProfile | null {
    if (!this.activeProfileId) {
      return null;
    }
    return this.profiles.get(this.activeProfileId) ?? null;
  }

  getProfile(id: string): LayoutProfile | undefined {
    return this.profiles.get(id);
  }

  getAllProfiles(): LayoutProfile[] {
    return Array.from(this.profiles.values());
  }

  // ==================== Profile Mutations ====================

  setActiveProfileId(profileId: string | null): void {
    // Validate profile exists if not null
    if (profileId !== null && !this.profiles.has(profileId)) {
      console.warn(`LayoutRepository: Profile ${profileId} not found`);
      return;
    }

    this.activeProfileId = profileId;
    this.save();
  }

  saveProfile(profile: LayoutProfile): void {
    this.profiles.set(profile.id, profile);
    this.save();
  }

  deleteProfile(profileId: string): void {
    if (!this.profiles.has(profileId)) {
      console.warn(`LayoutRepository: Profile ${profileId} not found`);
      return;
    }

    this.profiles.delete(profileId);

    // If deleting active profile, clear active
    if (this.activeProfileId === profileId) {
      this.activeProfileId = null;
    }

    this.save();
  }

  // ==================== Persistence ====================

  save(): void {
    const data: StoredLayoutSettings = {
      activeProfileId: this.activeProfileId,
      profiles: Array.from(this.profiles.values()).map((p) => p.toPlain()),
    };
    storage.set(STORAGE_KEYS.LAYOUTS, data);
  }

  reload(): void {
    const data = storage.get<StoredLayoutSettings>(STORAGE_KEYS.LAYOUTS);
    const settings = data ?? DEFAULT_SETTINGS;

    this.activeProfileId = settings.activeProfileId;
    this.profiles = new Map();

    for (const profileData of settings.profiles) {
      try {
        const profile = LayoutProfile.fromPlain(profileData);
        this.profiles.set(profile.id, profile);
      } catch (error) {
        console.warn('LayoutRepository: Failed to load profile', profileData.id, error);
      }
    }

    // Validate active profile still exists
    if (this.activeProfileId && !this.profiles.has(this.activeProfileId)) {
      console.warn('LayoutRepository: Active profile not found, clearing');
      this.activeProfileId = null;
      this.save();
    }
  }
}

/**
 * Singleton instance.
 */
let repositoryInstance: LayoutRepository | null = null;

/**
 * Gets the singleton LayoutRepository instance.
 */
export function getLayoutRepository(): ILayoutRepository {
  if (!repositoryInstance) {
    repositoryInstance = new LayoutRepository();
  }
  return repositoryInstance;
}

/**
 * Resets the singleton (for testing).
 */
export function resetLayoutRepository(): void {
  repositoryInstance = null;
}

/**
 * LocalStorage adapter for persistent data storage.
 * Provides type-safe access to localStorage with JSON serialization.
 */

/**
 * Storage keys used by the application.
 */
export const STORAGE_KEYS = {
  CHARACTER_PROGRESS: 'cc_progress_characters',
  POWER_CHORD_PROGRESS: 'cc_progress_powerchords',
  WORD_PROGRESS: 'cc_progress_words',
  STATS: 'cc_stats',
  SETTINGS: 'cc_settings',
} as const;

/**
 * Type-safe localStorage wrapper with JSON serialization.
 */
export class LocalStorageAdapter {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  /**
   * Gets a value from localStorage, deserializing from JSON.
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const value = localStorage.getItem(fullKey);
      if (value === null) return null;
      return JSON.parse(value, this.reviver) as T;
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error);
      return null;
    }
  }

  /**
   * Sets a value in localStorage, serializing to JSON.
   */
  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage [${key}]:`, error);
      return false;
    }
  }

  /**
   * Removes a value from localStorage.
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error);
      return false;
    }
  }

  /**
   * Checks if a key exists in localStorage.
   */
  has(key: string): boolean {
    const fullKey = this.prefix + key;
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * Clears all keys with the current prefix.
   */
  clearAll(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Gets all keys with the current prefix.
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }

  /**
   * Custom reviver for JSON.parse to handle Date objects.
   */
  private reviver(_key: string, value: unknown): unknown {
    // Handle ISO date strings
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return value;
  }
}

/**
 * Singleton instance of the storage adapter.
 */
export const storage = new LocalStorageAdapter();

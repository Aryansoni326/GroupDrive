/**
 * Secure Session & Storage Service for GROUPDRIVE Mobile
 * Cross-platform storage abstraction with memory fallback
 */

const memoryStore: Record<string, string> = {};

function getBrowserStorage(): any {
  try {
    const g = typeof globalThis !== "undefined" ? (globalThis as any) : null;
    return g?.window?.localStorage || g?.localStorage || null;
  } catch {
    return null;
  }
}

export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = getBrowserStorage();
      if (storage) {
        storage.setItem(key, value);
      } else {
        memoryStore[key] = value;
      }
    } catch {
      memoryStore[key] = value;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const storage = getBrowserStorage();
      if (storage) {
        return storage.getItem(key);
      }
      return memoryStore[key] || null;
    } catch {
      return memoryStore[key] || null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const storage = getBrowserStorage();
      if (storage) {
        storage.removeItem(key);
      }
      delete memoryStore[key];
    } catch {
      delete memoryStore[key];
    }
  },

  async clear(): Promise<void> {
    try {
      const storage = getBrowserStorage();
      if (storage) {
        storage.clear();
      }
      Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
    } catch {
      // fallback
    }
  },
};

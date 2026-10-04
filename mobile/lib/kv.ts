// Synchronous key-value cache backed by AsyncStorage.
// Lets the mobile store mirror the web store's localStorage calls 1:1.
import AsyncStorage from '@react-native-async-storage/async-storage';

const cache = new Map<string, string>();
let hydrated = false;

export const kv = {
  async hydrate(): Promise<void> {
    if (hydrated) return;
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('fd_'));
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([k, v]) => v != null && cache.set(k, v));
    } catch (e) {
      console.warn('[kv] hydrate failed', e);
    }
    hydrated = true;
  },
  getItem(key: string): string | null {
    return cache.has(key) ? (cache.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  removeItem(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },
};

// Drop-in for web `localStorage` usage in ported code.
export const localStorage = kv;

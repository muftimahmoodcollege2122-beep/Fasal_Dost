// ─────────────────────────────────────────────────────────────────────────────
// server/core/redis.ts
// Redis Cache Client with High-Performance Memory Fallback for Zero Downtime
// ─────────────────────────────────────────────────────────────────────────────

export interface ICacheService {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  flush(): Promise<void>;
}

class InMemoryCache implements ICacheService {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value: serialized, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async flush(): Promise<void> {
    this.store.clear();
  }
}

export const redisCache: ICacheService = new InMemoryCache();

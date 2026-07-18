// Redis-backed working memory client for short-lived run state.
import type { MemorySubsystemConfig } from "./types.js";

export type WorkingMemoryEntry = {
  key: string;
  value: unknown;
  ttlSeconds?: number;
};

export type WorkingMemoryClient = {
  set(params: WorkingMemoryEntry): Promise<void>;
  get(key: string): Promise<unknown>;
  del(key: string): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
  ttl(key: string): Promise<number>;
  exists(key: string): Promise<boolean>;
};

export function createWorkingMemoryClient(
  config: MemorySubsystemConfig["working"],
): WorkingMemoryClient {
  const keyPrefix = config.keyPrefix ?? "memory:working:";
  const defaultTtl = config.defaultTtlSeconds ?? 3600;

  let client: {
    get: (k: string) => Promise<string | null>;
    set: (k: string, v: string, ex?: number) => Promise<void>;
    del: (k: string) => Promise<void>;
    keys: (p: string) => Promise<string[]>;
    exists: (k: string) => Promise<number>;
    ttl: (k: string) => Promise<number>;
  } | null = null;

  async function ensureClient() {
    if (client) return client;
    try {
      const mod: any = await import("redis");
      const redisClient = mod.createClient({ url: config.redisUrl });
      await redisClient.connect();
      client = {
        get: (k) => redisClient.get(k),
        set: (k, v, ex) => redisClient.setEx(k, ex!, v),
        del: (k) => redisClient.del(k),
        keys: (p) => redisClient.keys(p),
        exists: (k) => redisClient.exists(k),
        ttl: (k) => redisClient.ttl(k),
      };
      return client;
    } catch {
      return null;
    }
  }

  return {
    async set(params) {
      const c = await ensureClient();
      if (!c) return;
      const fullKey = `${keyPrefix}${params.key}`;
      const ttl = params.ttlSeconds ?? defaultTtl;
      await c.set(fullKey, JSON.stringify(params.value), ttl);
    },
    async get(key) {
      const c = await ensureClient();
      if (!c) return null;
      const raw = await c.get(`${keyPrefix}${key}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    async del(key) {
      const c = await ensureClient();
      if (!c) return;
      await c.del(`${keyPrefix}${key}`);
    },
    async delByPrefix(prefix) {
      const c = await ensureClient();
      if (!c) return;
      const keys = await c.keys(`${keyPrefix}${prefix}*`);
      if (keys.length === 0) return;
      await Promise.all(keys.map((k) => c.del(k)));
    },
    async ttl(key) {
      const c = await ensureClient();
      if (!c) return -1;
      return c.ttl(`${keyPrefix}${key}`);
    },
    async exists(key) {
      const c = await ensureClient();
      if (!c) return false;
      return (await c.exists(`${keyPrefix}${key}`)) === 1;
    },
  };
}

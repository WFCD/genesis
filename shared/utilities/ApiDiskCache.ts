import path from 'node:path';

import flatCache from 'flat-cache';

const defaultTtlMs = Number.parseInt(process.env.API_CACHE_TTL_MS ?? '', 10) || 24 * 60 * 60 * 1000;
const cacheDir = process.env.API_CACHE_DIR
  ? path.resolve(process.env.API_CACHE_DIR)
  : path.resolve(process.cwd(), '.cache');
const cacheId = 'api-catalog';

type CacheLogger = {
  debug?: (message: string) => void;
  warn?: (message: string) => void;
};

type CacheEntry<T> = {
  cachedAt: number;
  data: T;
};

let cache: ReturnType<typeof flatCache.load> | undefined;

function getCache() {
  if (!cache) {
    cache = flatCache.load(cacheId, cacheDir);
  }
  return cache;
}

function readEntry<T>(key: string): CacheEntry<T> | undefined {
  return getCache().getKey(key) as CacheEntry<T> | undefined;
}

function writeEntry<T>(key: string, data: T) {
  const store = getCache();
  store.setKey(key, { cachedAt: Date.now(), data });
  store.save(true);
}

export async function readCache<T>(key: string, { maxAgeMs = defaultTtlMs } = {}): Promise<T | undefined> {
  const entry = readEntry<T>(key);
  if (!entry) return undefined;
  if (maxAgeMs > 0 && Date.now() - entry.cachedAt > maxAgeMs) return undefined;
  return entry.data;
}

export async function readStaleCache<T>(key: string): Promise<T | undefined> {
  return readEntry<T>(key)?.data;
}

export function readStaleCacheSync<T>(key: string): T | undefined {
  return readEntry<T>(key)?.data;
}

export function writeCache<T>(key: string, data: T) {
  writeEntry(key, data);
}

export { defaultTtlMs as apiCacheTtlMs, cacheDir as apiCacheDir };

export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  { maxAgeMs = defaultTtlMs, logger: log }: { maxAgeMs?: number; logger?: CacheLogger } = {}
): Promise<T> {
  const cached = await readCache<T>(key, { maxAgeMs });
  if (cached !== undefined) {
    log?.debug?.(`API cache hit: ${key}`);
    return cached;
  }

  try {
    log?.debug?.(`API cache miss: ${key}`);
    const data = await fetchFn();
    writeEntry(key, data);
    return data;
  } catch (err) {
    const stale = await readStaleCache<T>(key);
    if (stale !== undefined) {
      log?.warn?.(`API fetch failed, using stale cache: ${key} (${(err as Error).message})`);
      return stale;
    }
    throw err;
  }
}

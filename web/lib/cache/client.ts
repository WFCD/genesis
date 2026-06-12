type CachedPayload<T> = { at: number; value: T };

const memory = new Map<string, CachedPayload<unknown>>();

function readSession<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload<T>;
    if (Date.now() - parsed.at > ttlMs) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeSession<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedPayload<T> = { at: Date.now(), value };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore quota / privacy mode errors.
  }
}

export async function fetchJsonCached<T>(url: string, ttlMs = 3_600_000): Promise<T> {
  const key = `fetch:${url}`;
  const fromMemory = memory.get(key);
  if (fromMemory && Date.now() - fromMemory.at <= ttlMs) {
    return fromMemory.value as T;
  }

  const fromSession = readSession<T>(key, ttlMs);
  if (fromSession) {
    memory.set(key, { at: Date.now(), value: fromSession });
    return fromSession;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const value = (await res.json()) as T;
  memory.set(key, { at: Date.now(), value });
  writeSession(key, value);
  return value;
}

export function clearClientCache(prefix = 'fetch:') {
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  if (typeof window === 'undefined') return;
  for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(prefix)) window.sessionStorage.removeItem(key);
  }
}

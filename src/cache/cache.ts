type CachedResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

const cache = new Map<string, CachedResponse>();

export function get(key: string) {
  return cache.get(key);
}

export function set(key: string, value: CachedResponse) {
  cache.set(key, value);
}

export function clear() {
  cache.clear();
}
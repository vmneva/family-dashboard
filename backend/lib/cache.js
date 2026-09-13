function createCache(ttlMs) {
  const store = new Map();

  function get(key) {
    const entry = store.get(key);
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.data;
  }

  function set(key, data) {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  return { get, set };
}

module.exports = { createCache };

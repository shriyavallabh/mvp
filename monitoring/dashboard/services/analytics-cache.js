class AnalyticsCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 60000; // 1 minute default TTL
  }

  set(key, value, ttl = this.ttl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Clean up expired entries periodically
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }
}

module.exports = new AnalyticsCache();
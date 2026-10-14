import { Redis } from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private memoryFallback = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy(times: number) {
          if (times > 2) return null;
          return Math.min(times * 100, 1000);
        },
      });

      this.client.connect().catch(() => {
        // Redis not running locally, seamlessly fallback to in-memory cache
        this.client = null;
      });
    } catch {
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback
      }
    }

    const item = this.memoryFallback.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    if (this.client) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback
      }
    }

    this.memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // Fallback
      }
    }
    this.memoryFallback.delete(key);
  }
}

export const redis = new CacheService();
export default redis;

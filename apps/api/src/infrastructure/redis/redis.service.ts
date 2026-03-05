import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK' | null> {
    if (ttl) {
      return this.redisClient.set(key, value, 'EX', ttl);
    }
    return this.redisClient.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  getClient(): Redis {
    return this.redisClient;
  }
  async isHealthy(): Promise<boolean> {
    try {
      const client = this.redisClient;

      if (!client || client.status !== 'ready') {
        return false;
      }

      const result = await Promise.race([
        client.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 1500),
        ),
      ]);

      return result === 'PONG' || result === 'OK';
    } catch {
      return false;
    }
  }
}

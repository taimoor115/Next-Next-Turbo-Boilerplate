import {
  DynamicModule,
  Global,
  Logger,
  Module,
  Provider,
} from '@nestjs/common';
import Redis from 'ioredis';
import { RedisModuleAsyncOptions } from './interfaces';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class RedisModule {
  static registerAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);

        const client = new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db,
          lazyConnect: false,
          retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
          },
        });

        client.on('connect', () => {
          Logger.log('Redis Connected Successfully... ✔', 'RedisModule');
        });

        client.on('error', (err: Error) => {
          Logger.error('Redis Error', err.stack);
        });

        return client;
      },
      inject: options.inject || [],
    };

    return {
      module: RedisModule,
      imports: options.imports || [],
      providers: [redisClientProvider, RedisService],
      exports: [redisClientProvider, RedisService],
    };
  }
}

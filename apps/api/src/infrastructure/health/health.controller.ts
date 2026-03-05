import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { DATABASE_CONNECTION } from '../database/database.contants';
import * as databaseModule from '../database/database.module';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,

    @Inject(DATABASE_CONNECTION)
    private readonly db: databaseModule.DB,

    private readonly redisService: RedisService,
  ) {}

  @Get('live')
  live() {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  @Get('ready')
  async ready() {
    const result = {
      database: 'unknown',
      redis: 'unknown',
    };

    try {
      await this.db.execute('SELECT 1');
      result.database = 'up';
    } catch (err) {
      this.logger.error('Database health failed', err);
      result.database = 'down';
    }

    try {
      const isRedisHealthy = await this.redisService.isHealthy();
      console.log('Redis health check result:', isRedisHealthy);
      if (isRedisHealthy) {
        result.redis = 'up';
      } else {
        result.redis = 'down';
      }
    } catch (err) {
      this.logger.error('Redis health failed', err);
      result.redis = 'down';
    }

    return {
      status:
        result.database === 'up' && result.redis === 'up' ? 'ok' : 'degraded',
      services: result,
      timestamp: new Date(),
    };
  }
}

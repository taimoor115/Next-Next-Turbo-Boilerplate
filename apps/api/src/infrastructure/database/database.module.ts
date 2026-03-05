import { Module, Logger } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from './database.contants';
import * as schema from './schema/index';

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('Database');

        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        try {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();

          logger.log('✔ Database connected successfully');
        } catch (error) {
          logger.error('❌ Database connection failed', error);
          throw error;
        }

        pool.on('error', (err) => {
          logger.error('❌ Unexpected database error', err);
        });

        const db = drizzle(pool, { schema });

        return db;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}

export type DB = NodePgDatabase<typeof schema>;

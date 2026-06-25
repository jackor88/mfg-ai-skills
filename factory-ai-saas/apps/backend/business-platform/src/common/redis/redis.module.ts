import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const logger = new Logger('RedisModule');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('REDIS_HOST', 'localhost');
        const port = parseInt(configService.get('REDIS_PORT', '6379'), 10);
        const password = configService.get('REDIS_PASSWORD', 'factory123456');
        const db = parseInt(configService.get('REDIS_DB', '0'), 10);

        const redis = new Redis({
          host,
          port,
          password,
          db,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) {
              logger.warn(`Redis连接失败，已重试${times}次，停止重试`);
              return null;
            }
            return Math.min(times * 200, 2000);
          },
        });

        redis.connect().catch((err) => {
          logger.warn(`Redis连接失败（${host}:${port}），缓存功能将不可用: ${err.message}`);
        });

        redis.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND') {
            logger.error(`Redis错误: ${err.message}`);
          }
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

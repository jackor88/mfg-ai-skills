import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379'), 10),
          password: configService.get('REDIS_PASSWORD', 'factory123456'),
          db: parseInt(configService.get('REDIS_DB', '0'), 10),
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

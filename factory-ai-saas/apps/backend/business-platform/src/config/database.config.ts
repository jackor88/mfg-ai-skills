import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import * as path from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const dbType = (process.env.DB_TYPE || 'sqlite') as 'mysql' | 'sqlite';

    if (dbType === 'sqlite') {
      return {
        type: 'sqljs',
        location: 'factory',
        autoSave: true,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      };
    }

    return {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'factory',
      password: process.env.DB_PASSWORD || 'factory123456',
      database: process.env.DB_DATABASE || 'factory_ai_platform',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      timezone: '+08:00',
      charset: 'utf8mb4',
      extra: {
        connectionLimit: 10,
      },
    };
  },
);

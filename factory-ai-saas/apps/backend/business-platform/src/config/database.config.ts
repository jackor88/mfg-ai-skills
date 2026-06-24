import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
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
  }),
);

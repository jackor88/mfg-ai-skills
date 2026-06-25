import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TenantContextService } from './context/tenant-context.service';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    TenantContextService,
    TenantInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [TenantContextService, RedisModule],
})
export class CommonModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { User } from '../modules/user/entities/user.entity';
import { Role } from '../modules/rbac/entities/role.entity';
import { Permission } from '../modules/rbac/entities/permission.entity';
import { InitSeedService } from './seeds/init.seed';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User, Role, Permission])],
  providers: [InitSeedService],
})
export class DatabaseModule {}

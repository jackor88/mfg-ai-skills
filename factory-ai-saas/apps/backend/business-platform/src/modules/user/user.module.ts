import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TenantContextService } from '../../common/context/tenant-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UserService, TenantContextService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}

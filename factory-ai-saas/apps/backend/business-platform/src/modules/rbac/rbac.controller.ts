import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('角色权限管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('roles')
  @ApiOperation({ summary: '创建角色' })
  @RequirePermissions('role:manage')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole(createRoleDto);
  }

  @Get('roles')
  @ApiOperation({ summary: '查询角色列表' })
  @RequirePermissions('role:view')
  findAllRoles(@Query() queryDto: QueryRoleDto) {
    return this.rbacService.findAllRoles(queryDto);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: '获取角色详情' })
  @RequirePermissions('role:view')
  findRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rbacService.findRole(id);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: '更新角色' })
  @RequirePermissions('role:manage')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: '删除角色' })
  @RequirePermissions('role:manage')
  deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rbacService.deleteRole(id);
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: '分配角色权限' })
  @RequirePermissions('role:manage')
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('permissionIds') permissionIds: string[],
  ) {
    return this.rbacService.assignPermissions(id, permissionIds);
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取所有权限列表' })
  @RequirePermissions('role:view', 'user:view')
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @Get('permissions/grouped')
  @ApiOperation({ summary: '获取分组后的权限树' })
  @RequirePermissions('role:view')
  getPermissionsByGroup() {
    return this.rbacService.getPermissionsByGroup();
  }
}

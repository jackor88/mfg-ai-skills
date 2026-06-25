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
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('用户管理')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: '未登录或Token过期' })
@ApiForbiddenResponse({ description: '无权限访问' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @RequirePermissions('user:manage')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '查询用户列表' })
  @RequirePermissions('user:view')
  findAll(@Query() queryDto: QueryUserDto) {
    return this.userService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @RequirePermissions('user:view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @RequirePermissions('user:manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户（软删除）' })
  @RequirePermissions('user:manage')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  @RequirePermissions('user:manage')
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(id, resetPasswordDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: '修改当前用户密码' })
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, changePasswordDto);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: '分配用户角色' })
  @RequirePermissions('user:manage')
  assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('roleIds') roleIds: string[],
  ) {
    return this.userService.assignRoles(id, roleIds);
  }
}

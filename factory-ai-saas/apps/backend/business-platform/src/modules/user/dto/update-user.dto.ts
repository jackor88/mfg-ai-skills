import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Length, IsArray } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '真实姓名' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  realName?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: '角色ID列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiPropertyOptional({ description: '权限ID列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

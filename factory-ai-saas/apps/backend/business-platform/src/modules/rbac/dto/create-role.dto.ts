import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '角色编码（如: boss, salesman, merchandiser, finance）' })
  @IsString()
  @Length(2, 50)
  code: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiPropertyOptional({ description: '是否系统内置' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: '权限ID列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

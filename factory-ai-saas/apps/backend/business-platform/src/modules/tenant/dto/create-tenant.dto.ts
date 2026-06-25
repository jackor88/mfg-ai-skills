import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { TenantPlan, TenantStatus } from '../entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({ description: '租户名称（企业名称）' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: '租户编码' })
  @IsString()
  @Length(2, 50)
  code: string;

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  contactPerson?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: '联系邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '企业地址' })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  address?: string;

  @ApiPropertyOptional({ description: '行业' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  industry?: string;

  @ApiPropertyOptional({ description: '套餐等级', enum: TenantPlan, default: TenantPlan.FREE })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

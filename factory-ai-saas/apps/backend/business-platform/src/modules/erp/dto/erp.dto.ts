import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber, Min, MaxLength, IsInt } from 'class-validator';
import { ErpType, SyncEntityType } from '../entities/erp.entity';

export class CreateErpConfigDto {
  @ApiProperty({ enum: ErpType, description: 'ERP类型' })
  @IsEnum(ErpType)
  erpType: ErpType;

  @ApiProperty({ description: 'ERP名称' })
  @IsString()
  @MaxLength(100)
  erpName: string;

  @ApiPropertyOptional({ description: 'API地址' })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'AppKey' })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional({ description: 'AppSecret' })
  @IsOptional()
  @IsString()
  appSecret?: string;

  @ApiPropertyOptional({ description: '同步客户数据', default: true })
  @IsOptional()
  @IsBoolean()
  syncCustomers?: boolean;

  @ApiPropertyOptional({ description: '同步物料数据', default: true })
  @IsOptional()
  @IsBoolean()
  syncMaterials?: boolean;

  @ApiPropertyOptional({ description: '同步工序数据', default: true })
  @IsOptional()
  @IsBoolean()
  syncProcesses?: boolean;

  @ApiPropertyOptional({ description: '同步订单数据', default: true })
  @IsOptional()
  @IsBoolean()
  syncOrders?: boolean;

  @ApiPropertyOptional({ description: '自动推送报价单到ERP', default: false })
  @IsOptional()
  @IsBoolean()
  autoPushQuotation?: boolean;

  @ApiPropertyOptional({ description: '同步间隔（分钟）', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  syncInterval?: number;
}

export class UpdateErpConfigDto {
  @ApiPropertyOptional({ enum: ErpType })
  @IsOptional()
  @IsEnum(ErpType)
  erpType?: ErpType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  erpName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncCustomers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncMaterials?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncProcesses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  syncOrders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoPushQuotation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(5)
  syncInterval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ManualSyncDto {
  @ApiProperty({ enum: SyncEntityType, description: '同步数据类型', isArray: true })
  @IsEnum(SyncEntityType, { each: true })
  entityTypes: SyncEntityType[];

  @ApiPropertyOptional({ description: '同步方向', default: 'pull' })
  @IsOptional()
  @IsString()
  direction?: 'pull' | 'push';
}

export class QuerySyncLogDto {
  @ApiPropertyOptional({ enum: SyncEntityType })
  @IsOptional()
  @IsEnum(SyncEntityType)
  entityType?: SyncEntityType;

  @ApiPropertyOptional({ description: '同步方向' })
  @IsOptional()
  @IsString()
  syncDirection?: 'pull' | 'push';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

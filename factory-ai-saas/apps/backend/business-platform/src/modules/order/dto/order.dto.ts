import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional({ description: '关联报价单ID，从报价单转单时传入' })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @ApiProperty({ description: '产品名称' })
  @IsString()
  @Length(1, 100)
  productName: string;

  @ApiPropertyOptional({ description: '产品描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '订单数量' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '订单单价' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: '订单总金额' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: '客户ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: '要求交期' })
  @IsDateString()
  requiredDate: string;

  @ApiPropertyOptional({ description: '销售员ID' })
  @IsOptional()
  @IsUUID()
  salespersonId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: '产品名称' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: '产品描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '订单数量' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: '订单单价' })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: '要求交期' })
  @IsOptional()
  @IsDateString()
  requiredDate?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateProgressDto {
  @ApiProperty({ description: '生产阶段', enum: [
    'not_started', 'cutting', 'welding', 'polishing', 'assembly', 'qc', 'packing', 'done'
  ]})
  @IsString()
  stage: string;

  @ApiProperty({ description: '完成百分比 0-100' })
  @IsNumber()
  @Min(0)
  percent: number;

  @ApiPropertyOptional({ description: '进度说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否标记该阶段完成' })
  @IsOptional()
  complete?: boolean;
}

export class QueryOrderDto {
  @ApiPropertyOptional({ description: '订单号/产品名 模糊搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '订单状态', enum: [
    'confirmed', 'material_preparing', 'in_production', 'quality_check',
    'packaging', 'shipped', 'delivered', 'completed', 'cancelled'
  ]})
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '客户ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  pageSize?: number;
}

export class ShipOrderDto {
  @ApiPropertyOptional({ description: '物流单号' })
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @ApiPropertyOptional({ description: '发货备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class CompleteOrderDto {
  @ApiProperty({ description: '实际总成本' })
  @IsNumber()
  @Min(0)
  actualCost: number;

  @ApiPropertyOptional({ description: '交付备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

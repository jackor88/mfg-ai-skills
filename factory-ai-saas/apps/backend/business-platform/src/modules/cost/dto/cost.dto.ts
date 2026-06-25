import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateCostRecordDto {
  @ApiPropertyOptional({ description: '关联订单ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: '成本项名称' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: '成本类型',
    enum: ['material', 'labor', 'overhead', 'logistics', 'outsourcing', 'other'],
  })
  @IsEnum(['material', 'labor', 'overhead', 'logistics', 'outsourcing', 'other'])
  type: string;

  @ApiProperty({ description: '金额' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: '发生日期' })
  @IsDateString()
  occurredDate: string;

  @ApiPropertyOptional({ description: '供应商/收款方' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: '发票号' })
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryCostDto {
  @ApiPropertyOptional({ description: '成本类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '订单ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  pageSize?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: '关联订单ID' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: '收款金额' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: '收款日期' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ description: '收款方式' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: '交易流水号' })
  @IsOptional()
  @IsString()
  transactionNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryPaymentDto {
  @ApiPropertyOptional({ description: '订单ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  pageSize?: number;
}

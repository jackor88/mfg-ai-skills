import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRechargeDto {
  @ApiProperty({ description: '套餐ID: basic/pro/enterprise/ultimate' })
  @IsString()
  packageId: string;

  @ApiProperty({ description: '支付方式', enum: ['alipay', 'wechat'] })
  @IsEnum(['alipay', 'wechat'])
  paymentMethod: string;
}

export class QueryRechargeDto {
  @ApiPropertyOptional({ description: '订单状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  pageSize?: number;
}

export class ConsumeAiDto {
  @ApiProperty({ description: 'AI服务类型' })
  @IsString()
  serviceType: string;

  @ApiProperty({ description: '消耗金额' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: '消耗次数' })
  @IsNumber()
  @Min(1)
  count: number;

  @ApiPropertyOptional({ description: '关联报价单ID' })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CreateQuotationDto } from './create-quotation.dto';

class BomItemDto {
  @ApiPropertyOptional({ description: '物料名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '材质' })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({ description: '数量' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: '单位' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: '规格' })
  @IsOptional()
  @IsString()
  spec?: string;
}

class ProcessItemDto {
  @ApiPropertyOptional({ description: '工序名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '工艺描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '预估工时（分钟）' })
  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;
}

export class UpdateQuotationDto {
  @ApiPropertyOptional({ description: '产品名称' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  productName?: string;

  @ApiPropertyOptional({ description: '产品描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '产品图片' })
  @IsOptional()
  @IsString()
  images?: string;

  @ApiPropertyOptional({ description: '物料清单' })
  @IsOptional()
  @IsArray()
  bomItems?: BomItemDto[];

  @ApiPropertyOptional({ description: '工艺要求' })
  @IsOptional()
  @IsArray()
  processes?: ProcessItemDto[];

  @ApiPropertyOptional({ description: '报价数量' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: '客户ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: '最终报价' })
  @IsOptional()
  @IsNumber()
  finalPrice?: number;

  @ApiPropertyOptional({ description: '利润率（%）' })
  @IsOptional()
  @IsNumber()
  profitMargin?: number;

  @ApiPropertyOptional({ description: '预计交期（天）' })
  @IsOptional()
  @IsNumber()
  estimatedLeadDays?: number;
}

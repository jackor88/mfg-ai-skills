import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

class BomItemDto {
  @ApiProperty({ description: '物料名称' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '材质' })
  @IsString()
  @Length(1, 100)
  material: string;

  @ApiProperty({ description: '数量' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: '单位' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: '规格' })
  @IsOptional()
  @IsString()
  spec?: string;
}

class ProcessItemDto {
  @ApiProperty({ description: '工序名称' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '工艺描述' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: '预估工时（分钟）' })
  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;
}

export class CreateQuotationDto {
  @ApiProperty({ description: '产品名称' })
  @IsString()
  @Length(1, 100)
  productName: string;

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

  @ApiProperty({ description: '客户ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: '期望利润率（%）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  profitMargin?: number;
}

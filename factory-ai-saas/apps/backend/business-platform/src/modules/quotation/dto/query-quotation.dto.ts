import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { QuotationStatus } from '../entities/quotation.entity';

export class QueryQuotationDto extends PaginationDto {
  @ApiPropertyOptional({ description: '产品名称/报价单号 模糊搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '报价状态',
    enum: QuotationStatus,
  })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiPropertyOptional({ description: '客户ID' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReviewQuotationDto {
  @ApiProperty({ description: '是否通过审核' })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ description: '审核后最终报价' })
  @IsNumber()
  @Min(0)
  finalPrice: number;

  @ApiPropertyOptional({ description: '预计交期（天）' })
  @IsOptional()
  @IsNumber()
  estimatedLeadDays?: number;

  @ApiPropertyOptional({ description: '审核意见' })
  @IsOptional()
  @IsString()
  comment?: string;
}

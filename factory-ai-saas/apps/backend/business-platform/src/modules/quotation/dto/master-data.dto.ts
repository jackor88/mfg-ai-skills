import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Length, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: '客户名称' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  contact?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '客户等级' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: '客户名称' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '客户等级' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateMaterialDto {
  @ApiProperty({ description: '物料名称' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: '物料编码' })
  @IsString()
  @Length(2, 50)
  code: string;

  @ApiProperty({ description: '规格型号' })
  @IsString()
  @Length(1, 50)
  spec: string;

  @ApiProperty({ description: '单位' })
  @IsString()
  unit: string;

  @ApiProperty({ description: '单价' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: '分类' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsOptional()
  @IsString()
  supplier?: string;
}

export class UpdateMaterialDto {
  @ApiPropertyOptional({ description: '物料名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '物料编码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '规格型号' })
  @IsOptional()
  @IsString()
  spec?: string;

  @ApiPropertyOptional({ description: '单位' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: '单价' })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: '分类' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '供应商' })
  @IsOptional()
  @IsString()
  supplier?: string;
}

export class CreateProcessDto {
  @ApiProperty({ description: '工序名称' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: '工序编码' })
  @IsString()
  @Length(2, 50)
  code: string;

  @ApiProperty({ description: '每小时人工费' })
  @IsNumber()
  @Min(0)
  hourlyCost: number;

  @ApiPropertyOptional({ description: '所属车间' })
  @IsOptional()
  @IsString()
  workshop?: string;

  @ApiPropertyOptional({ description: '工序说明' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProcessDto {
  @ApiPropertyOptional({ description: '工序名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '工序编码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '每小时人工费' })
  @IsOptional()
  @IsNumber()
  hourlyCost?: number;

  @ApiPropertyOptional({ description: '所属车间' })
  @IsOptional()
  @IsString()
  workshop?: string;

  @ApiPropertyOptional({ description: '工序说明' })
  @IsOptional()
  @IsString()
  description?: string;
}

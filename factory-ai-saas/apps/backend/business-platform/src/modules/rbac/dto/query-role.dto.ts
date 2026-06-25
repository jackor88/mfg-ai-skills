import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryRoleDto extends PaginationDto {
  @ApiPropertyOptional({ description: '角色名称/编码 模糊搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

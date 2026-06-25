import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../entities/user.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({ description: '用户名/真实姓名 模糊搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '用户状态', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: '角色ID' })
  @IsOptional()
  @IsString()
  roleId?: string;
}

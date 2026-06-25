import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名/手机号', example: 'admin' })
  @IsString()
  @Length(2, 50)
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @Length(6, 50)
  password: string;

  @ApiProperty({ description: '租户编码（多租户登录时需要）', required: false })
  @IsString()
  @Length(0, 50)
  tenantCode?: string;
}

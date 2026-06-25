import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 50 })
  @IsString()
  @Length(6, 50)
  newPassword: string;

  @ApiPropertyOptional({ description: '是否强制用户下次登录修改密码' })
  @IsOptional()
  @IsString()
  mustChangePassword?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 50 })
  @IsString()
  @Length(6, 50)
  newPassword: string;
}

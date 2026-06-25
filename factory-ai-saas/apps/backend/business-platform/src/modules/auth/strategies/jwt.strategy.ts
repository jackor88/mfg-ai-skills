import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'factory-ai-secret-key'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: payload.tenantId },
    });

    return {
      userId: user.id,
      tenantId: payload.tenantId,
      username: user.username,
      realName: user.realName,
      roles: user.roles?.map((r) => r.code) || [],
      permissions: user.roles?.flatMap((r) => r.permissions?.map((p) => p.code)) || [],
      user,
      tenant,
    };
  }
}

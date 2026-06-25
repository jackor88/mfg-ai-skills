import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../user/entities/user.entity';
import { Tenant, TenantStatus } from '../tenant/entities/tenant.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password, tenantCode } = loginDto;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('user.username = :username', { username });

    if (tenantCode) {
      const tenant = await this.tenantRepository.findOne({
        where: { code: tenantCode },
      });
      if (!tenant) {
        throw new UnauthorizedException('租户不存在');
      }
      if (tenant.status !== TenantStatus.ACTIVE) {
        throw new UnauthorizedException('租户已被禁用或过期');
      }
      queryBuilder = queryBuilder.andWhere('user.tenantId = :tenantId', {
        tenantId: tenant.id,
      });
    }

    const user = await queryBuilder.getOne();

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('用户账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'factory-ai-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        roles: user.roles?.map((r) => r.code) || [],
        permissions: user.roles?.flatMap((r) => r.permissions?.map((p) => p.code)) || [],
      },
    };
  }

  async validateUser(userId: string, tenantId: string) {
    return this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles', 'roles.permissions'],
    });
  }
}

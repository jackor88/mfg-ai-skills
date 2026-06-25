import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserStatus } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private tenantContext: TenantContextService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const tenantId = this.tenantContext.getTenantId();

    // 检查用户名唯一性
    const existing = await this.userRepository.findOne({
      where: { username: createUserDto.username, tenantId },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    // 处理密码
    const password = createUserDto.password || '123456'; // 默认密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 处理角色
    let roles: Role[] = [];
    if (createUserDto.roleIds?.length) {
      roles = await this.roleRepository.findBy({
        id: In(createUserDto.roleIds),
        tenantId,
      });
    }

    const user = this.userRepository.create({
      id: uuidv4(),
      tenantId,
      username: createUserDto.username,
      realName: createUserDto.realName,
      password: hashedPassword,
      phone: createUserDto.phone,
      email: createUserDto.email,
      avatar: createUserDto.avatar,
      status: createUserDto.status || UserStatus.ACTIVE,
      roles,
    });

    return this.userRepository.save(user);
  }

  async findAll(queryDto: QueryUserDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 10, keyword, status, roleId } = queryDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.deletedAt IS NULL');

    if (keyword) {
      queryBuilder.andWhere(
        '(user.username LIKE :keyword OR user.realName LIKE :keyword OR user.phone LIKE :keyword OR user.email LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (roleId) {
      queryBuilder.andWhere('role.id = :roleId', { roleId });
    }

    const [items, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findById(id: string) {
    return this.findOne(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 更新基本信息
    const { roleIds, ...updateData } = updateUserDto;
    Object.assign(user, updateData);

    // 更新角色
    if (roleIds !== undefined) {
      if (roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({
          id: In(roleIds),
          tenantId,
        });
        user.roles = roles;
      } else {
        user.roles = [];
      }
    }

    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 软删除
    await this.userRepository.update(id, { deletedAt: new Date() });
    return { message: '删除成功' };
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });

    return { message: '密码重置成功' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId, deletedAt: null as any },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('当前密码错误');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });

    return { message: '密码修改成功' };
  }

  async assignRoles(userId: string, roleIds: string[]) {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId, deletedAt: null as any },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const roles = await this.roleRepository.findBy({
      id: In(roleIds),
      tenantId,
    });

    user.roles = roles;
    await this.userRepository.save(user);

    return user;
  }

  async findByUsername(username: string, tenantId?: string) {
    const where: any = { username, deletedAt: null as any };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return this.userRepository.findOne({
      where,
      relations: ['roles', 'roles.permissions'],
    });
  }
}

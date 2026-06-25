import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private tenantContext: TenantContextService,
  ) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const tenantId = this.tenantContext.getTenantId();

    const existing = await this.roleRepository.findOne({
      where: { code: createRoleDto.code, tenantId },
    });
    if (existing) {
      throw new ConflictException('角色编码已存在');
    }

    let permissions: Permission[] = [];
    if (createRoleDto.permissionIds?.length) {
      permissions = await this.permissionRepository.findBy({
        id: In(createRoleDto.permissionIds),
      });
    }

    const role = this.roleRepository.create({
      id: uuidv4(),
      tenantId,
      name: createRoleDto.name,
      code: createRoleDto.code,
      description: createRoleDto.description,
      isSystem: createRoleDto.isSystem || false,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async findAllRoles(queryDto: QueryRoleDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 10, keyword } = queryDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.tenantId = :tenantId', { tenantId })
      .andWhere('role.deletedAt IS NULL');

    if (keyword) {
      queryBuilder.andWhere(
        '(role.name LIKE :keyword OR role.code LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('role.isSystem', 'DESC')
      .addOrderBy('role.createdAt', 'DESC')
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

  async findRole(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const role = await this.roleRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const tenantId = this.tenantContext.getTenantId();
    const role = await this.roleRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const { permissionIds, ...updateData } = updateRoleDto;
    Object.assign(role, updateData);

    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findBy({
          id: In(permissionIds),
        });
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const role = await this.roleRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不能删除');
    }

    await this.roleRepository.update(id, { deletedAt: new Date() });
    return { message: '删除成功' };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    const tenantId = this.tenantContext.getTenantId();
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId, deletedAt: null as any },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds),
    });

    role.permissions = permissions;
    await this.roleRepository.save(role);

    return role;
  }

  async findAllPermissions() {
    return this.permissionRepository.find({
      order: { group: 'ASC', code: 'ASC' },
    });
  }

  async getPermissionsByGroup() {
    const permissions = await this.permissionRepository.find({
      order: { group: 'ASC', code: 'ASC' },
    });

    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      if (!grouped[p.group]) {
        grouped[p.group] = [];
      }
      grouped[p.group].push(p);
    });

    return Object.entries(grouped).map(([group, items]) => ({
      group,
      permissions: items,
    }));
  }
}

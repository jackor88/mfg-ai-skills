import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Tenant, TenantPlan, TenantStatus } from '../../modules/tenant/entities/tenant.entity';
import { User, UserStatus } from '../../modules/user/entities/user.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';

const DEFAULT_PERMISSIONS = [
  { code: 'tenant:manage', name: '租户管理', group: 'system', description: '租户创建、编辑、删除' },
  { code: 'tenant:view', name: '查看租户', group: 'system', description: '查看租户列表' },
  { code: 'user:manage', name: '用户管理', group: 'system', description: '用户创建、编辑、删除' },
  { code: 'user:view', name: '查看用户', group: 'system', description: '查看用户列表' },
  { code: 'role:manage', name: '角色管理', group: 'system', description: '角色权限配置' },
  { code: 'role:view', name: '查看角色', group: 'system', description: '查看角色列表' },
  { code: 'quotation:manage', name: '报价管理', group: 'business', description: '核价报价操作' },
  { code: 'quotation:create', name: '创建报价', group: 'business', description: '创建报价单' },
  { code: 'quotation:view', name: '查看报价', group: 'business', description: '查看报价单' },
  { code: 'quotation:approve', name: '审批报价', group: 'business', description: '报价审批' },
  { code: 'order:manage', name: '订单管理', group: 'business', description: '订单跟踪' },
  { code: 'order:view', name: '查看订单', group: 'business', description: '查看订单' },
  { code: 'order:update', name: '更新订单', group: 'business', description: '更新订单状态' },
  { code: 'cost:manage', name: '成本核算', group: 'finance', description: '成本核算管理' },
  { code: 'cost:view', name: '查看成本', group: 'finance', description: '查看成本数据' },
  { code: 'finance:manage', name: '财务管理', group: 'finance', description: '财务对账结算' },
  { code: 'ai:call', name: 'AI调用', group: 'ai', description: '调用AI核价引擎' },
  { code: 'erp:sync', name: 'ERP同步', group: 'integration', description: 'ERP数据同步' },
];

@Injectable()
export class InitSeedService implements OnModuleInit {
  private readonly logger = new Logger(InitSeedService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.initPermissions();
    await this.initSuperAdmin();
  }

  private async initPermissions() {
    const count = await this.permissionRepository.count();
    if (count > 0) {
      this.logger.log(`权限数据已存在，跳过初始化，共${count}条`);
      return;
    }

    this.logger.log('开始初始化权限数据...');
    const permissions = DEFAULT_PERMISSIONS.map((p) =>
      this.permissionRepository.create({
        id: uuidv4(),
        ...p,
      }),
    );
    await this.permissionRepository.save(permissions);
    this.logger.log(`权限数据初始化完成，共${permissions.length}条`);
  }

  private async initSuperAdmin() {
    const adminTenantCode = 'ADMIN';
    let tenant = await this.tenantRepository.findOne({ where: { code: adminTenantCode } });

    if (!tenant) {
      this.logger.log('创建平台超级管理员租户...');
      tenant = await this.tenantRepository.save(
        this.tenantRepository.create({
          id: uuidv4(),
          name: '平台超级管理员',
          code: adminTenantCode,
          status: TenantStatus.ACTIVE,
          plan: TenantPlan.ENTERPRISE,
          contactPerson: '系统管理员',
          contactPhone: '00000000000',
          email: 'T1T2c@dE2r6Kd.9rq',
        }),
      );
    }

    const adminUsername = 'admin';
    const adminUser = await this.userRepository.findOne({
      where: { username: adminUsername, tenantId: tenant.id },
    });

    if (adminUser) {
      this.logger.log('超级管理员用户已存在，跳过创建');
    } else {
      this.logger.log('创建超级管理员用户...');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const allPermissions = await this.permissionRepository.find();
      const superAdminRole = await this.roleRepository.save(
        this.roleRepository.create({
          id: uuidv4(),
          tenantId: tenant.id,
          name: '超级管理员',
          code: 'super_admin',
          description: '平台超级管理员，拥有所有权限',
          isSystem: true,
          permissions: allPermissions,
        }),
      );

      await this.userRepository.save(
        this.userRepository.create({
          id: uuidv4(),
          tenantId: tenant.id,
          username: adminUsername,
          realName: '超级管理员',
          password: hashedPassword,
          email: 'T1T2c@dE2r6Kd.9rq',
          phone: '00000000000',
          status: UserStatus.ACTIVE,
          roles: [superAdminRole],
        }),
      );

      this.logger.log('========================================');
      this.logger.log('🎉 初始化完成！');
      this.logger.log('默认管理员账号: admin');
      this.logger.log('默认管理员密码: admin123');
      this.logger.log('========================================');
    }
  }
}

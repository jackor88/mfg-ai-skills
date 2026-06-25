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
  { code: 'quotation:create', name: '创建报价', group: 'quotation', description: '创建报价单' },
  { code: 'quotation:view', name: '查看报价', group: 'quotation', description: '查看报价单' },
  { code: 'quotation:edit', name: '编辑报价', group: 'quotation', description: '编辑报价单' },
  { code: 'quotation:delete', name: '删除报价', group: 'quotation', description: '删除报价单' },
  { code: 'quotation:ai_calculate', name: 'AI核价', group: 'quotation', description: '触发AI核价' },
  { code: 'quotation:review', name: '审核报价', group: 'quotation', description: '老板审核报价' },
  { code: 'quotation:confirm', name: '确认报价', group: 'quotation', description: '确认报价转订单' },
  { code: 'customer:view', name: '查看客户', group: 'master', description: '查看客户列表' },
  { code: 'customer:manage', name: '客户管理', group: 'master', description: '客户增删改' },
  { code: 'material:view', name: '查看物料', group: 'master', description: '查看物料列表' },
  { code: 'material:manage', name: '物料管理', group: 'master', description: '物料增删改' },
  { code: 'process:view', name: '查看工序', group: 'master', description: '查看工序列表' },
  { code: 'process:manage', name: '工序管理', group: 'master', description: '工序增删改' },
  { code: 'order:manage', name: '订单管理', group: 'order', description: '订单跟踪' },
  { code: 'order:view', name: '查看订单', group: 'order', description: '查看订单' },
  { code: 'order:update', name: '更新订单', group: 'order', description: '更新订单状态' },
  { code: 'cost:manage', name: '成本核算', group: 'finance', description: '成本核算管理' },
  { code: 'cost:view', name: '查看成本', group: 'finance', description: '查看成本数据' },
  { code: 'finance:manage', name: '财务管理', group: 'finance', description: '财务对账结算' },
  { code: 'payment:recharge', name: '算力充值', group: 'billing', description: 'AI算力充值' },
  { code: 'payment:view', name: '账单查询', group: 'billing', description: '账单明细查询' },
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
    await this.initDemoTenant();
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

  private async initDemoTenant() {
    const demoTenantCode = 'DEMO';
    let tenant = await this.tenantRepository.findOne({ where: { code: demoTenantCode } });
    if (tenant) return;

    this.logger.log('创建演示工厂租户...');
    tenant = await this.tenantRepository.save(
      this.tenantRepository.create({
        id: uuidv4(),
        name: '演示五金制品厂',
        code: demoTenantCode,
        status: TenantStatus.ACTIVE,
        plan: TenantPlan.PROFESSIONAL,
        contactPerson: '张老板',
        contactPhone: '13800138000',
        email: 'Bcb3i@v29jY.Dv',
      }),
    );

    const allPermissions = await this.permissionRepository.find();
    const permMap = new Map(allPermissions.map((p) => [p.code, p]));

    const bossRole = await this.roleRepository.save(
      this.roleRepository.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: '老板',
        code: 'boss',
        description: '工厂老板，拥有全部业务权限',
        isSystem: true,
        permissions: allPermissions.filter(
          (p) => !p.code.startsWith('tenant:'),
        ),
      }),
    );

    const salesmanPerms = [
      'quotation:view',
      'quotation:create',
      'quotation:edit',
      'quotation:ai_calculate',
      'quotation:confirm',
      'customer:view',
      'customer:manage',
      'material:view',
      'process:view',
      'order:view',
    ].map((c) => permMap.get(c)).filter(Boolean) as Permission[];

    const salesmanRole = await this.roleRepository.save(
      this.roleRepository.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: '业务员',
        code: 'salesman',
        description: '负责客户开发和报价',
        isSystem: true,
        permissions: salesmanPerms,
      }),
    );

    const merchandiserPerms = [
      'quotation:view',
      'customer:view',
      'order:view',
      'order:update',
      'material:view',
      'process:view',
      'erp:sync',
    ].map((c) => permMap.get(c)).filter(Boolean) as Permission[];

    const merchandiserRole = await this.roleRepository.save(
      this.roleRepository.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: '跟单员',
        code: 'merchandiser',
        description: '负责生产跟踪与订单进度',
        isSystem: true,
        permissions: merchandiserPerms,
      }),
    );

    const financePerms = [
      'quotation:view',
      'order:view',
      'cost:view',
      'cost:manage',
      'finance:manage',
      'payment:view',
      'payment:recharge',
    ].map((c) => permMap.get(c)).filter(Boolean) as Permission[];

    const financeRole = await this.roleRepository.save(
      this.roleRepository.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: '财务',
        code: 'finance',
        description: '负责成本核算和财务对账',
        isSystem: true,
        permissions: financePerms,
      }),
    );

    const hashedPassword = await bcrypt.hash('123456', 10);
    const demoUsers = [
      { username: 'boss', realName: '张老板', phone: '13800138000', role: bossRole },
      { username: 'sales', realName: '小李', phone: '13800138001', role: salesmanRole },
      { username: 'merch', realName: '王跟单', phone: '13800138002', role: merchandiserRole },
      { username: 'finance', realName: '赵会计', phone: '13800138003', role: financeRole },
    ];

    for (const u of demoUsers) {
      await this.userRepository.save(
        this.userRepository.create({
          id: uuidv4(),
          tenantId: tenant.id,
          username: u.username,
          realName: u.realName,
          password: hashedPassword,
          phone: u.phone,
          email: `${u.username}@demo.com`,
          status: UserStatus.ACTIVE,
          roles: [u.role],
        }),
      );
    }

    this.logger.log('========================================');
    this.logger.log('🏭 演示租户初始化完成！');
    this.logger.log('演示租户账号: boss / 123456');
    this.logger.log('业务员账号: sales / 123456');
    this.logger.log('跟单员账号: merch / 123456');
    this.logger.log('财务账号: finance / 123456');
    this.logger.log('========================================');
  }
}

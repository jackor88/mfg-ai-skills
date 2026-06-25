import { Column, Entity } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

export enum TenantPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant extends AbstractBaseEntity {
  @Column({ length: 100, comment: '租户名称（企业名称）' })
  name: string;

  @Column({ length: 50, unique: true, comment: '租户编码' })
  code: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: TenantStatus.ACTIVE,
    comment: '租户状态',
  })
  status: TenantStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: TenantPlan.FREE,
    comment: '套餐等级',
  })
  plan: TenantPlan;

  @Column({ name: 'contact_person', length: 50, nullable: true, comment: '联系人' })
  contactPerson?: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true, comment: '联系电话' })
  contactPhone?: string;

  @Column({ length: 100, nullable: true, comment: '联系邮箱' })
  email?: string;

  @Column({ length: 255, nullable: true, comment: '企业地址' })
  address?: string;

  @Column({ length: 50, nullable: true, comment: '行业' })
  industry?: string;

  @Column({ name: 'expire_at', type: 'datetime', nullable: true, comment: '过期时间' })
  expireAt?: Date;

  @Column({ type: 'simple-json', nullable: true, comment: '租户配置' })
  config?: Record<string, any>;
}

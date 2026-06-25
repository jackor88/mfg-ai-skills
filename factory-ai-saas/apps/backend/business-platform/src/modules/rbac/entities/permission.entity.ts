import { Column, Entity, ManyToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends AbstractBaseEntity {
  @Column({ length: 100, unique: true, comment: '权限标识（如：tenant:create）' })
  code: string;

  @Column({ length: 100, comment: '权限名称' })
  name: string;

  @Column({ length: 50, comment: '权限分组（如：租户管理、用户管理）' })
  group: string;

  @Column({ length: 255, nullable: true, comment: '权限描述' })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}

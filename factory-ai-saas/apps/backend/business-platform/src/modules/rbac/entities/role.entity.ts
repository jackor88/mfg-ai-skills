import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 50, comment: '角色名称' })
  name: string;

  @Column({ length: 50, comment: '角色编码（如：admin, boss, salesman, merchandiser, finance）' })
  code: string;

  @Column({ length: 255, nullable: true, comment: '角色描述' })
  description?: string;

  @Column({ default: true, comment: '是否系统内置角色' })
  isSystem: boolean;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}

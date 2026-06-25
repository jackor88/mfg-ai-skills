import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Role } from '../../rbac/entities/role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  LOCKED = 'locked',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 50, comment: '用户名' })
  username: string;

  @Column({ name: 'real_name', length: 50, nullable: true, comment: '真实姓名' })
  realName?: string;

  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone?: string;

  @Column({ length: 100, nullable: true, comment: '邮箱' })
  email?: string;

  @Exclude()
  @Column({ length: 255, comment: '密码哈希' })
  password: string;

  @Column({ length: 255, nullable: true, comment: '头像URL' })
  avatar?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserStatus.ACTIVE,
    comment: '用户状态',
  })
  status: UserStatus;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true, comment: '最后登录时间' })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', length: 50, nullable: true, comment: '最后登录IP' })
  lastLoginIp?: string;

  @ManyToMany(() => Role, { cascade: true, eager: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}

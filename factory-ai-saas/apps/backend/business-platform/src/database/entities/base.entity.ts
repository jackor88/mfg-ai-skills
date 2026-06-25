import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

export abstract class AbstractBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, comment: '删除时间（软删除）' })
  deletedAt?: Date;

  @Column({ name: 'created_by', nullable: true, length: 36, comment: '创建人ID' })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true, length: 36, comment: '更新人ID' })
  updatedBy?: string;
}

export abstract class BaseEntity extends AbstractBaseEntity {
  @Column({ name: 'tenant_id', length: 36, comment: '租户ID' })
  tenantId: string;
}

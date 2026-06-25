import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 100, comment: '客户名称' })
  name: string;

  @Column({ length: 50, nullable: true, comment: '联系人' })
  contact?: string;

  @Column({ length: 20, nullable: true, comment: '联系电话' })
  phone?: string;

  @Column({ length: 100, nullable: true, comment: '邮箱' })
  email?: string;

  @Column({ length: 255, nullable: true, comment: '地址' })
  address?: string;

  @Column({ length: 50, nullable: true, comment: '客户等级' })
  level?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;
}

@Entity('materials')
export class Material extends BaseEntity {
  @Column({ length: 100, comment: '物料名称' })
  name: string;

  @Column({ length: 50, comment: '物料编码' })
  code: string;

  @Column({ length: 50, comment: '规格型号' })
  spec: string;

  @Column({ length: 20, comment: '单位' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '单价' })
  unitPrice: number;

  @Column({ length: 50, nullable: true, comment: '分类' })
  category?: string;

  @Column({ length: 255, nullable: true, comment: '供应商' })
  supplier?: string;
}

@Entity('processes')
export class Process extends BaseEntity {
  @Column({ length: 100, comment: '工序名称' })
  name: string;

  @Column({ length: 50, comment: '工序编码' })
  code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '每小时人工费' })
  hourlyCost: number;

  @Column({ length: 50, nullable: true, comment: '所属车间' })
  workshop?: string;

  @Column({ type: 'text', nullable: true, comment: '工序说明' })
  description?: string;
}

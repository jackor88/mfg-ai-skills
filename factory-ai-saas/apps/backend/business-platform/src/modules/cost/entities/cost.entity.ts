import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

export enum CostType {
  MATERIAL = 'material',
  LABOR = 'labor',
  OVERHEAD = 'overhead',
  LOGISTICS = 'logistics',
  OUTSOURCING = 'outsourcing',
  OTHER = 'other',
}

@Entity('cost_records')
export class CostRecord extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, comment: '关联订单ID' })
  orderId?: string;

  @Column({ length: 50, nullable: true, comment: '关联订单号' })
  orderNo?: string;

  @Column({ length: 100, comment: '成本项名称' })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '成本类型',
  })
  type: CostType;

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '金额' })
  amount: number;

  @Column({ type: 'date', comment: '发生日期' })
  occurredDate: Date;

  @Column({ length: 100, nullable: true, comment: '供应商/收款方' })
  supplier?: string;

  @Column({ length: 50, nullable: true, comment: '发票号' })
  invoiceNo?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ type: 'uuid', nullable: true, comment: '录入人ID' })
  createdById?: string;

  @Column({ length: 50, nullable: true, comment: '录入人' })
  createdByName?: string;
}

@Entity('payment_records')
export class PaymentRecord extends BaseEntity {
  @Column({ type: 'uuid', comment: '关联订单ID' })
  orderId: string;

  @Column({ length: 50, comment: '关联订单号' })
  orderNo: string;

  @Column({ type: 'uuid', comment: '客户ID' })
  customerId: string;

  @Column({ length: 100, comment: '客户名称' })
  customerName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '收款金额' })
  amount: number;

  @Column({ type: 'date', comment: '收款日期' })
  paymentDate: Date;

  @Column({ length: 50, comment: '收款方式: bank_transfer, cash, wechat, alipay, other' })
  paymentMethod: string;

  @Column({ length: 100, nullable: true, comment: '交易流水号' })
  transactionNo?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ type: 'uuid', nullable: true, comment: '确认人ID' })
  confirmedById?: string;

  @Column({ length: 50, nullable: true, comment: '确认人' })
  confirmedByName?: string;
}

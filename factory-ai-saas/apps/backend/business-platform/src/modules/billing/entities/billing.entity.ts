import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

export enum RechargeOrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BALANCE = 'balance',
  OFFLINE = 'offline',
}

@Entity('ai_accounts')
export class AiAccount extends BaseEntity {
  @Column({ type: 'uuid', unique: true, comment: '租户ID' })
  declare tenantId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 100, comment: '算力余额（元）' })
  balance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '累计充值（元）' })
  totalRecharged: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '累计消费（元）' })
  totalConsumed: number;

  @Column({ type: 'int', default: 50, comment: '剩余AI核价次数' })
  quotaCount: number;

  @Column({ type: 'int', default: 0, comment: '累计核价次数' })
  totalUsedCount: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后消费时间' })
  lastConsumedAt?: Date;
}

@Entity('recharge_orders')
export class RechargeOrder extends BaseEntity {
  @Column({ length: 50, unique: true, comment: '充值订单号' })
  orderNo: string;

  @Column({ type: 'uuid', comment: '租户ID' })
  declare tenantId: string;

  @Column({ length: 100, comment: '套餐名称' })
  packageName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '充值金额（元）' })
  amount: number;

  @Column({ type: 'int', comment: '获得算力点数' })
  credits: number;

  @Column({ type: 'int', nullable: true, comment: '额外赠送次数' })
  bonusCount?: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: RechargeOrderStatus.PENDING,
    comment: '订单状态',
  })
  status: RechargeOrderStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: PaymentMethod.ALIPAY,
    comment: '支付方式',
  })
  paymentMethod: PaymentMethod;

  @Column({ length: 255, nullable: true, comment: '支付交易号' })
  transactionNo?: string;

  @Column({ type: 'datetime', nullable: true, comment: '支付时间' })
  paidAt?: Date;

  @Column({ type: 'uuid', comment: '创建人ID' })
  createdById: string;

  @Column({ length: 50, comment: '创建人' })
  createdByName: string;
}

@Entity('ai_consume_logs')
export class AiConsumeLog extends BaseEntity {
  @Column({ type: 'uuid', comment: '租户ID' })
  declare tenantId: string;

  @Column({ type: 'uuid', nullable: true, comment: '关联报价单ID' })
  quotationId?: string;

  @Column({ length: 100, comment: 'AI服务类型' })
  serviceType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '消耗金额（元）' })
  amount: number;

  @Column({ type: 'int', default: 1, comment: '消耗次数' })
  count: number;

  @Column({ length: 255, nullable: true, comment: '服务描述' })
  description?: string;

  @Column({ type: 'uuid', nullable: true, comment: '充值订单ID（充值赠送）' })
  orderId?: string;

  @ManyToOne(() => RechargeOrder, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order?: RechargeOrder;

  @Column({ type: 'uuid', nullable: true, comment: '操作人ID' })
  operatorId?: string;

  @Column({ length: 50, nullable: true, comment: '操作人' })
  operatorName?: string;
}

export const AI_PACKAGES = [
  { id: 'basic', name: '基础版', amount: 99, credits: 100, bonusCount: 10, desc: '适合小型工厂，约100次核价' },
  { id: 'pro', name: '专业版', amount: 299, credits: 350, bonusCount: 50, desc: '适合中型工厂，约400次核价', popular: true },
  { id: 'enterprise', name: '企业版', amount: 999, credits: 1500, bonusCount: 300, desc: '适合大型工厂，约1800次核价' },
  { id: 'ultimate', name: '旗舰版', amount: 2999, credits: 6000, bonusCount: 1000, desc: '无限核价+高级分析功能' },
];

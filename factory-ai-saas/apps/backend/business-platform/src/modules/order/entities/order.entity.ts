import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

export enum OrderStatus {
  CONFIRMED = 'confirmed',
  MATERIAL_PREPARING = 'material_preparing',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  PACKAGING = 'packaging',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProductionStage {
  NOT_STARTED = 'not_started',
  CUTTING = 'cutting',
  WELDING = 'welding',
  POLISHING = 'polishing',
  ASSEMBLY = 'assembly',
  QC = 'qc',
  PACKING = 'packing',
  DONE = 'done',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ length: 50, comment: '订单号' })
  orderNo: string;

  @Column({ type: 'uuid', nullable: true, comment: '关联报价单ID' })
  quotationId?: string;

  @Column({ length: 100, comment: '产品名称' })
  productName: string;

  @Column({ type: 'text', nullable: true, comment: '产品描述/规格' })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '订单数量' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '订单单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '订单总金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '实际成本' })
  actualCost?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '实际利润率（%）' })
  actualProfitMargin?: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: OrderStatus.CONFIRMED,
    comment: '订单状态',
  })
  status: OrderStatus;

  @Column({
    type: 'varchar',
    length: 30,
    default: ProductionStage.NOT_STARTED,
    comment: '当前生产阶段',
  })
  currentStage: ProductionStage;

  @Column({ type: 'int', default: 0, comment: '生产进度百分比 0-100' })
  progressPercent: number;

  @Column({ type: 'date', nullable: true, comment: '下单日期' })
  orderDate?: Date;

  @Column({ type: 'date', nullable: true, comment: '要求交期' })
  requiredDate?: Date;

  @Column({ type: 'date', nullable: true, comment: '预计交期' })
  estimatedDeliveryDate?: Date;

  @Column({ type: 'date', nullable: true, comment: '实际交付日期' })
  actualDeliveryDate?: Date;

  @Column({ type: 'int', nullable: true, comment: '交付延迟天数' })
  delayDays?: number;

  @Column({ type: 'uuid', comment: '客户ID' })
  customerId: string;

  @Column({ length: 100, comment: '客户名称' })
  customerName: string;

  @Column({ type: 'uuid', comment: '业务跟单员ID' })
  merchandiserId: string;

  @Column({ length: 50, comment: '业务跟单员姓名' })
  merchandiserName: string;

  @Column({ type: 'uuid', nullable: true, comment: '销售员ID' })
  salespersonId?: string;

  @Column({ length: 50, nullable: true, comment: '销售员姓名' })
  salespersonName?: string;

  @Column({ type: 'text', nullable: true, comment: '订单备注' })
  remark?: string;

  @Column({ type: 'text', nullable: true, comment: '取消原因' })
  cancelReason?: string;

  @OneToMany(() => OrderProgress, (progress) => progress.order, {
    cascade: true,
  })
  progresses: OrderProgress[];
}

@Entity('order_progresses')
export class OrderProgress extends BaseEntity {
  @Column({ length: 30, comment: '生产阶段' })
  stage: ProductionStage;

  @Column({ length: 50, comment: '阶段名称' })
  stageName: string;

  @Column({ type: 'text', nullable: true, comment: '进度说明' })
  description?: string;

  @Column({ type: 'int', default: 0, comment: '完成百分比 0-100' })
  percent: number;

  @Column({ type: 'datetime', nullable: true, comment: '开始时间' })
  startedAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  completedAt?: Date;

  @Column({ length: 50, nullable: true, comment: '操作人' })
  operatorName?: string;

  @Column({ type: 'uuid', nullable: true, comment: '操作人ID' })
  operatorId?: string;

  @Column({ type: 'json', nullable: true, comment: '异常记录' })
  issues?: {
    type: string;
    description: string;
    reportedAt: Date;
    resolved?: boolean;
  }[];

  @Column({ type: 'uuid', comment: '订单ID' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.progresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}

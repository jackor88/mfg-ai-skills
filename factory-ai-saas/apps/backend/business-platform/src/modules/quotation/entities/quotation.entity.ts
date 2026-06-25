import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

export enum QuotationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  AI_CALCULATING = 'ai_calculating',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

@Entity('quotations')
export class Quotation extends BaseEntity {
  @Column({ length: 50, comment: '报价单号' })
  quoteNo: string;

  @Column({ length: 100, comment: '产品名称' })
  productName: string;

  @Column({ type: 'text', nullable: true, comment: '产品描述/规格' })
  description?: string;

  @Column({ type: 'text', nullable: true, comment: '产品图片URL' })
  images?: string;

  @Column({ type: 'json', nullable: true, comment: '物料清单 (BOM)' })
  bomItems?: {
    name: string;
    material: string;
    quantity: number;
    unit: string;
    spec?: string;
  }[];

  @Column({ type: 'json', nullable: true, comment: '工艺要求' })
  processes?: {
    name: string;
    description: string;
    estimatedMinutes?: number;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '数量' })
  quantity?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '材料费成本' })
  materialCost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '人工费成本' })
  laborCost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '制造费用' })
  overheadCost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '运输/包装费' })
  logisticsCost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '总成本' })
  totalCost?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '利润率（%）' })
  profitMargin?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '建议报价' })
  suggestedPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '最终报价' })
  finalPrice?: number;

  @Column({ type: 'int', nullable: true, comment: '预计交期（天）' })
  estimatedLeadDays?: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: QuotationStatus.DRAFT,
    comment: '报价状态',
  })
  status: QuotationStatus;

  @Column({ type: 'text', nullable: true, comment: 'AI核价分析结果' })
  aiAnalysis?: string;

  @Column({ type: 'uuid', comment: '客户ID' })
  customerId: string;

  @Column({ length: 100, comment: '客户名称' })
  customerName: string;

  @Column({ type: 'uuid', comment: '创建人ID' })
  createdById: string;

  @Column({ length: 50, comment: '创建人姓名' })
  createdByName: string;

  @Column({ type: 'uuid', nullable: true, comment: '审核人ID' })
  reviewedById?: string;

  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true, comment: '审核意见' })
  reviewComment?: string;

  @OneToMany(() => QuotationHistory, (history) => history.quotation, {
    cascade: true,
  })
  histories: QuotationHistory[];
}

@Entity('quotation_histories')
export class QuotationHistory extends BaseEntity {
  @Column({ length: 50, comment: '操作类型: create, ai_calculate, review, confirm, reject' })
  action: string;

  @Column({ length: 255, nullable: true, comment: '操作描述' })
  description?: string;

  @Column({ type: 'json', nullable: true, comment: '快照数据' })
  snapshot?: any;

  @Column({ type: 'uuid', comment: '报价ID' })
  quotationId: string;

  @ManyToOne(() => Quotation, (quotation) => quotation.histories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotationId' })
  quotation: Quotation;

  @Column({ type: 'uuid', nullable: true, comment: '操作人ID' })
  operatorId?: string;

  @Column({ length: 50, nullable: true, comment: '操作人姓名' })
  operatorName?: string;
}

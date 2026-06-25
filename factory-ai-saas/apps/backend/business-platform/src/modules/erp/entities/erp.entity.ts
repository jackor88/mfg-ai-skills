import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';

export enum ErpType {
  DINGTALK = 'dingtalk',
  YONYOU = 'yonyou',
  KINGDEE = 'kingdee',
  CUSTOM = 'custom',
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum SyncEntityType {
  CUSTOMER = 'customer',
  MATERIAL = 'material',
  PROCESS = 'process',
  ORDER = 'order',
  QUOTATION = 'quotation',
}

@Entity('erp_config')
export class ErpConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ErpType.CUSTOM,
  })
  erpType: ErpType;

  @Column({ name: 'erp_name', length: 100, default: '自定义ERP' })
  erpName: string;

  @Column({ name: 'api_url', length: 500, nullable: true })
  apiUrl: string;

  @Column({ name: 'app_key', length: 200, nullable: true })
  appKey: string;

  @Column({ name: 'app_secret', length: 500, nullable: true })
  appSecret: string;

  @Column({ name: 'access_token', length: 1000, nullable: true })
  accessToken: string;

  @Column({ name: 'token_expires_at', type: 'datetime', nullable: true })
  tokenExpiresAt: Date;

  @Column({ name: 'sync_customers', default: true })
  syncCustomers: boolean;

  @Column({ name: 'sync_materials', default: true })
  syncMaterials: boolean;

  @Column({ name: 'sync_processes', default: true })
  syncProcesses: boolean;

  @Column({ name: 'sync_orders', default: true })
  syncOrders: boolean;

  @Column({ name: 'auto_push_quotation', default: false })
  autoPushQuotation: boolean;

  @Column({ name: 'sync_interval', default: 60 })
  syncInterval: number;

  @Column({ name: 'last_sync_at', type: 'datetime', nullable: true })
  lastSyncAt: Date;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('erp_sync_log')
export class ErpSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'config_id', nullable: true })
  configId: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  entityType: SyncEntityType;

  @Column({
    type: 'varchar',
    length: 20,
    default: SyncStatus.PENDING,
  })
  status: SyncStatus;

  @Column({ name: 'sync_direction', length: 10, default: 'pull' })
  syncDirection: 'pull' | 'push';

  @Column({ name: 'total_count', default: 0 })
  totalCount: number;

  @Column({ name: 'success_count', default: 0 })
  successCount: number;

  @Column({ name: 'fail_count', default: 0 })
  failCount: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Expose()
  get duration(): number {
    if (!this.startedAt || !this.finishedAt) return 0;
    return Math.round((this.finishedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
}

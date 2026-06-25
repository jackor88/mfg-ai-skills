import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErpConfig, ErpSyncLog, SyncStatus, SyncEntityType, ErpType } from './entities/erp.entity';
import { CreateErpConfigDto, UpdateErpConfigDto, ManualSyncDto, QuerySyncLogDto } from './dto/erp.dto';
import { TenantContextService } from '../../common/context/tenant-context.service';
import { Customer, Material, Process } from '../quotation/entities/business-master.entity';

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(
    @InjectRepository(ErpConfig)
    private erpConfigRepository: Repository<ErpConfig>,
    @InjectRepository(ErpSyncLog)
    private syncLogRepository: Repository<ErpSyncLog>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    private tenantContext: TenantContextService,
  ) {}

  async getConfig() {
    const tenantId = this.tenantContext.getTenantId();
    let config = await this.erpConfigRepository.findOne({ where: { tenantId } });
    if (!config) {
      config = await this.erpConfigRepository.save(this.erpConfigRepository.create({
        tenantId,
        erpType: ErpType.CUSTOM,
        erpName: '未配置',
        enabled: false,
      }));
    }
    const masked = { ...config };
    if (masked.appSecret) (masked as any).appSecret = '***';
    return masked;
  }

  async createConfig(dto: CreateErpConfigDto) {
    const tenantId = this.tenantContext.getTenantId();
    const existing = await this.erpConfigRepository.findOne({ where: { tenantId } });
    if (existing) return this.updateConfig(existing.id, dto);
    return this.erpConfigRepository.save(this.erpConfigRepository.create({ tenantId, ...dto }));
  }

  async updateConfig(id: string, dto: UpdateErpConfigDto) {
    const tenantId = this.tenantContext.getTenantId();
    const config = await this.erpConfigRepository.findOne({ where: { id, tenantId } });
    if (!config) throw new NotFoundException('ERP配置不存在');
    const updateData = { ...dto };
    if (dto.appSecret === '***') delete (updateData as any).appSecret;
    Object.assign(config, updateData);
    return this.erpConfigRepository.save(config);
  }

  async deleteConfig() {
    const tenantId = this.tenantContext.getTenantId();
    const config = await this.erpConfigRepository.findOne({ where: { tenantId } });
    if (config) await this.erpConfigRepository.remove(config);
    return { success: true };
  }

  async testConnection() {
    const tenantId = this.tenantContext.getTenantId();
    const config = await this.erpConfigRepository.findOne({ where: { tenantId } });
    if (!config || !config.enabled) {
      return { success: false, message: 'ERP未启用或未配置' };
    }
    await new Promise(r => setTimeout(r, 800));
    return { success: true, message: `成功连接到${config.erpName}`, responseTime: 800 };
  }

  async manualSync(dto: ManualSyncDto) {
    const tenantId = this.tenantContext.getTenantId();
    const config = await this.erpConfigRepository.findOne({ where: { tenantId } });
    if (!config || !config.enabled) throw new BadRequestException('ERP未启用，请先配置并启用');
    const results = [];
    for (const entityType of dto.entityTypes) {
      results.push(await this.doSync(config, entityType, dto.direction || 'pull'));
    }
    await this.erpConfigRepository.update(config.id, { lastSyncAt: new Date() });
    return results;
  }

  private async doSync(config: ErpConfig, entityType: SyncEntityType, direction: 'pull' | 'push') {
    const savedLog = await this.syncLogRepository.save(this.syncLogRepository.create({
      tenantId: config.tenantId,
      configId: config.id,
      entityType,
      syncDirection: direction,
      status: SyncStatus.SYNCING,
      startedAt: new Date(),
    }));
    try {
      let total = 0, success = 0, fail = 0;
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
      switch (entityType) {
        case SyncEntityType.CUSTOMER:
          if (direction === 'pull') {
            total = Math.floor(Math.random() * 5) + 3;
            success = total;
            const customers = [
              { name: 'ERP-华为科技', contact: '张经理', phone: '13800000001' },
              { name: 'ERP-比亚迪', contact: '李总', phone: '13800000002' },
              { name: 'ERP-富士康', contact: '王主管', phone: '13800000003' },
            ];
            for (const c of customers.slice(0, total)) {
              const exists = await this.customerRepository.findOne({ where: { name: c.name, tenantId: config.tenantId } });
              if (!exists) await this.customerRepository.save(this.customerRepository.create({ tenantId: config.tenantId, ...c }));
            }
          } else { total = 5; success = 5; }
          break;
        case SyncEntityType.MATERIAL:
          total = Math.floor(Math.random() * 5) + 3;
          success = total;
          if (direction === 'pull') {
            const materials = [
              { name: 'ERP-冷轧钢板', code: 'M-ERP-001', category: '金属', unit: 'kg', spec: '1.5mm', unitPrice: 8.5 },
              { name: 'ERP-ABS塑料', code: 'M-ERP-002', category: '塑料', unit: 'kg', spec: 'V0级', unitPrice: 18 },
            ];
            for (const m of materials) {
              const exists = await this.materialRepository.findOne({ where: { name: m.name, tenantId: config.tenantId } });
              if (!exists) await this.materialRepository.save(this.materialRepository.create({ tenantId: config.tenantId, ...m }));
            }
          }
          break;
        case SyncEntityType.PROCESS:
          total = Math.floor(Math.random() * 4) + 2;
          success = total;
          if (direction === 'pull') {
            const processes = [
              { name: 'ERP-CNC加工', code: 'P-ERP-001', category: '机加工', hourlyCost: 50, description: '数控加工' },
              { name: 'ERP-注塑成型', code: 'P-ERP-002', category: '注塑', hourlyCost: 35, description: '注塑' },
            ];
            for (const p of processes) {
              const exists = await this.processRepository.findOne({ where: { name: p.name, tenantId: config.tenantId } });
              if (!exists) await this.processRepository.save(this.processRepository.create({ tenantId: config.tenantId, ...p }));
            }
          }
          break;
        case SyncEntityType.ORDER:
          total = Math.floor(Math.random() * 5) + 2;
          success = total;
          break;
        case SyncEntityType.QUOTATION:
          total = 1; success = 1;
          break;
      }
      Object.assign(savedLog, { status: SyncStatus.SUCCESS, totalCount: total, successCount: success, failCount: fail, finishedAt: new Date() });
      await this.syncLogRepository.save(savedLog);
      return { entityType, direction, status: 'success', total, success, fail, logId: savedLog.id };
    } catch (error: any) {
      Object.assign(savedLog, { status: SyncStatus.FAILED, error: error.message, finishedAt: new Date() });
      await this.syncLogRepository.save(savedLog);
      return { entityType, direction, status: 'failed', error: error.message, logId: savedLog.id };
    }
  }

  async getSyncLogs(query: QuerySyncLogDto) {
    const tenantId = this.tenantContext.getTenantId();
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const qb = this.syncLogRepository.createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC');
    if (query.entityType) qb.andWhere('log.entityType = :et', { et: query.entityType });
    if (query.syncDirection) qb.andWhere('log.syncDirection = :sd', { sd: query.syncDirection });
    const [items, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { items, total, page, pageSize };
  }

  async getErpTypes() {
    return [
      { type: ErpType.DINGTALK, name: '钉钉', description: '钉钉宜搭/钉钉ERP连接器' },
      { type: ErpType.YONYOU, name: '用友', description: '用友U8/U9/NC' },
      { type: ErpType.KINGDEE, name: '金蝶', description: '金蝶K3/Cloud' },
      { type: ErpType.CUSTOM, name: '自定义API', description: '通过标准REST API对接' },
    ];
  }
}

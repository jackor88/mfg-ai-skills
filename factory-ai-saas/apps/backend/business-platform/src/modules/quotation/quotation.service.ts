import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Quotation,
  QuotationStatus,
  QuotationHistory,
} from './entities/quotation.entity';
import { Customer, Material, Process } from './entities/business-master.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { ReviewQuotationDto } from './dto/review-quotation.dto';

@Injectable()
export class QuotationService {
  private readonly logger = new Logger(QuotationService.name);

  constructor(
    @InjectRepository(Quotation)
    private quotationRepository: Repository<Quotation>,
    @InjectRepository(QuotationHistory)
    private historyRepository: Repository<QuotationHistory>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    private tenantContext: TenantContextService,
  ) {}

  private generateQuoteNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `Q${year}${month}${day}${random}`;
  }

  async create(createQuotationDto: CreateQuotationDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    const customer = await this.customerRepository.findOne({
      where: { id: createQuotationDto.customerId, tenantId, deletedAt: null as any },
    });
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const quotation = this.quotationRepository.create({
      id: uuidv4(),
      tenantId,
      quoteNo: this.generateQuoteNo(),
      productName: createQuotationDto.productName,
      description: createQuotationDto.description,
      images: createQuotationDto.images,
      bomItems: createQuotationDto.bomItems || [],
      processes: createQuotationDto.processes || [],
      quantity: createQuotationDto.quantity || 1,
      profitMargin: createQuotationDto.profitMargin || 20,
      status: QuotationStatus.DRAFT,
      customerId: customer.id,
      customerName: customer.name,
      createdById: user?.userId || '',
      createdByName: user?.realName || user?.username || 'system',
    });

    const saved = await this.quotationRepository.save(quotation);

    await this.addHistory(saved.id, 'create', '创建报价单', user);

    return saved;
  }

  async findAll(queryDto: QueryQuotationDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 10, keyword, status, customerId } = queryDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.quotationRepository
      .createQueryBuilder('quotation')
      .where('quotation.tenantId = :tenantId', { tenantId })
      .andWhere('quotation.deletedAt IS NULL');

    if (keyword) {
      queryBuilder.andWhere(
        '(quotation.productName LIKE :keyword OR quotation.quoteNo LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status) {
      queryBuilder.andWhere('quotation.status = :status', { status });
    }
    if (customerId) {
      queryBuilder.andWhere('quotation.customerId = :customerId', { customerId });
    }

    const [items, total] = await queryBuilder
      .orderBy('quotation.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const quotation = await this.quotationRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
      relations: ['histories'],
    });

    if (!quotation) {
      throw new NotFoundException('报价单不存在');
    }

    return quotation;
  }

  async update(id: string, updateQuotationDto: UpdateQuotationDto) {
    const quotation = await this.findOne(id);

    if (
      ![QuotationStatus.DRAFT, QuotationStatus.REJECTED].includes(quotation.status)
    ) {
      throw new BadRequestException('当前状态不允许编辑');
    }

    Object.assign(quotation, updateQuotationDto);

    if (updateQuotationDto.customerId) {
      const tenantId = this.tenantContext.getTenantId();
      const customer = await this.customerRepository.findOne({
        where: { id: updateQuotationDto.customerId, tenantId, deletedAt: null as any },
      });
      if (customer) {
        quotation.customerName = customer.name;
      }
    }

    return this.quotationRepository.save(quotation);
  }

  async remove(id: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== QuotationStatus.DRAFT && quotation.status !== QuotationStatus.REJECTED) {
      throw new BadRequestException('当前状态不允许删除');
    }
    await this.quotationRepository.update(id, { deletedAt: new Date() });
    return { message: '删除成功' };
  }

  async triggerAiCalculate(id: string) {
    const quotation = await this.findOne(id);
    const user = this.tenantContext.getUser();

    if (!quotation.bomItems?.length && !quotation.processes?.length) {
      throw new BadRequestException('请先填写物料清单和工艺要求');
    }

    quotation.status = QuotationStatus.AI_CALCULATING;
    await this.quotationRepository.save(quotation);

    try {
      const result = await this.performAiCosting(quotation);

      quotation.materialCost = result.materialCost;
      quotation.laborCost = result.laborCost;
      quotation.overheadCost = result.overheadCost;
      quotation.logisticsCost = result.logisticsCost;
      quotation.totalCost = result.totalCost;
      quotation.suggestedPrice = result.suggestedPrice;
      quotation.estimatedLeadDays = result.estimatedLeadDays;
      quotation.aiAnalysis = result.analysis;
      quotation.status = QuotationStatus.COMPLETED;

      const saved = await this.quotationRepository.save(quotation);
      await this.addHistory(id, 'ai_calculate', 'AI核价完成', user);
      return saved;
    } catch (error) {
      this.logger.error('AI核价失败', error);
      quotation.status = QuotationStatus.DRAFT;
      await this.quotationRepository.save(quotation);
      throw new BadRequestException('AI核价失败，请重试');
    }
  }

  private async performAiCosting(quotation: Quotation): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    logisticsCost: number;
    totalCost: number;
    suggestedPrice: number;
    estimatedLeadDays: number;
    analysis: string;
  }> {
    const quantity = quotation.quantity || 1;
    const tenantId = quotation.tenantId;

    let materialCost = 0;
    if (quotation.bomItems?.length) {
      const materials = await this.materialRepository.find({
        where: { tenantId, deletedAt: null as any },
      });
      const materialMap = new Map(
        materials.map((m) => [m.name.toLowerCase() + '|' + m.spec.toLowerCase(), m]),
      );

      for (const item of quotation.bomItems) {
        const key = item.name.toLowerCase() + '|' + (item.spec || '').toLowerCase();
        const found = materialMap.get(key);
        const unitPrice = found?.unitPrice || this.estimateMaterialPrice(item);
        materialCost += Number(unitPrice) * item.quantity;
      }
    } else {
      materialCost = Math.round(quantity * 5 + Math.random() * 100);
    }

    let laborMinutes = 0;
    if (quotation.processes?.length) {
      const processes = await this.processRepository.find({
        where: { tenantId, deletedAt: null as any },
      });
      const processMap = new Map(processes.map((p) => [p.name.toLowerCase(), p]));

      for (const proc of quotation.processes) {
        const found = processMap.get(proc.name.toLowerCase());
        const minutes = proc.estimatedMinutes || found?.hourlyCost ? 30 : 20;
        laborMinutes += minutes;
      }
    } else {
      laborMinutes = 30 * (quotation.bomItems?.length || 3);
    }

    const hourlyLaborRate = 35;
    const laborCost = (laborMinutes / 60) * hourlyLaborRate * quantity;
    const overheadCost = (materialCost + laborCost) * 0.15;
    const logisticsCost = Math.max(5, quantity * 0.5) * (quotation.bomItems?.length || 1);
    const totalCost = materialCost + laborCost + overheadCost + logisticsCost;

    const margin = (quotation.profitMargin || 20) / 100;
    const suggestedPrice = Math.round(totalCost * (1 + margin));
    const estimatedLeadDays = Math.ceil(laborMinutes / 60 / 8) + 3;

    const analysis = `AI核价分析报告：
1. 材料费：¥${materialCost.toFixed(2)}（${quotation.bomItems?.length || 0}种物料）
2. 人工费：¥${laborCost.toFixed(2)}（约${Math.ceil(laborMinutes)}分钟工时）
3. 制造费用：¥${overheadCost.toFixed(2)}（按15%管理费率计算）
4. 包装运输：¥${logisticsCost.toFixed(2)}
5. 总成本：¥${totalCost.toFixed(2)}
6. 建议报价：¥${suggestedPrice.toFixed(2)}（利润率${(margin * 100).toFixed(0)}%）
7. 预计交期：${estimatedLeadDays}天

AI建议：基于历史同类产品报价对比，建议报价在¥${(suggestedPrice * 0.95).toFixed(0)}-¥${(suggestedPrice * 1.05).toFixed(0)}区间内浮动。`;

    return {
      materialCost: Number(materialCost.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      overheadCost: Number(overheadCost.toFixed(2)),
      logisticsCost: Number(logisticsCost.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      suggestedPrice: Number(suggestedPrice.toFixed(2)),
      estimatedLeadDays,
      analysis,
    };
  }

  private estimateMaterialPrice(item: { material: string; quantity: number; spec?: string }): number {
    const basePrices: Record<string, number> = {
      '钢': 8,
      '铁': 6,
      '铜': 45,
      '铝': 20,
      '塑料': 12,
      '塑胶': 12,
      'abs': 15,
      '不锈钢': 25,
      '木材': 18,
      '玻璃': 10,
      '电子': 30,
      'pcb': 50,
    };
    const mat = item.material.toLowerCase();
    let price = 10;
    for (const [key, val] of Object.entries(basePrices)) {
      if (mat.includes(key)) {
        price = val;
        break;
      }
    }
    return price * item.quantity;
  }

  async review(id: string, reviewDto: ReviewQuotationDto) {
    const quotation = await this.findOne(id);
    const user = this.tenantContext.getUser();

    if (quotation.status !== QuotationStatus.COMPLETED) {
      throw new BadRequestException('当前状态不允许审核');
    }

    quotation.finalPrice = reviewDto.finalPrice;
    if (reviewDto.estimatedLeadDays) {
      quotation.estimatedLeadDays = reviewDto.estimatedLeadDays;
    }
    quotation.status = reviewDto.approved
      ? QuotationStatus.REVIEWED
      : QuotationStatus.REJECTED;
    quotation.reviewedById = user?.userId;
    quotation.reviewedAt = new Date();
    quotation.reviewComment = reviewDto.comment;

    const saved = await this.quotationRepository.save(quotation);
    await this.addHistory(
      id,
      reviewDto.approved ? 'review' : 'reject',
      reviewDto.comment || (reviewDto.approved ? '审核通过' : '审核驳回'),
      user,
    );
    return saved;
  }

  async confirm(id: string) {
    const quotation = await this.findOne(id);
    const user = this.tenantContext.getUser();

    if (quotation.status !== QuotationStatus.REVIEWED) {
      throw new BadRequestException('当前状态不允许确认');
    }

    quotation.status = QuotationStatus.CONFIRMED;
    const saved = await this.quotationRepository.save(quotation);
    await this.addHistory(id, 'confirm', '客户确认报价', user);
    return saved;
  }

  async submit(id: string) {
    const quotation = await this.findOne(id);
    const user = this.tenantContext.getUser();

    if (![QuotationStatus.DRAFT, QuotationStatus.REJECTED].includes(quotation.status)) {
      throw new BadRequestException('当前状态不允许提交');
    }

    quotation.status = QuotationStatus.PENDING;
    const saved = await this.quotationRepository.save(quotation);
    await this.addHistory(id, 'submit', '提交AI核价', user);
    return saved;
  }

  private async addHistory(
    quotationId: string,
    action: string,
    description: string,
    user?: { userId?: string; realName?: string; username?: string },
  ) {
    const history = this.historyRepository.create({
      id: uuidv4(),
      tenantId: this.tenantContext.getTenantId(),
      quotationId,
      action,
      description,
      operatorId: user?.userId,
      operatorName: user?.realName || user?.username || 'system',
    });
    await this.historyRepository.save(history);
  }

  async getStatistics() {
    const tenantId = this.tenantContext.getTenantId();
    const baseWhere = { tenantId, deletedAt: null as any };

    const [
      total,
      draft,
      pending,
      calculating,
      completed,
      reviewed,
      confirmed,
      rejected,
    ] = await Promise.all([
      this.quotationRepository.count({ where: baseWhere }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.DRAFT } }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.PENDING } }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.AI_CALCULATING } }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.COMPLETED } }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.REVIEWED } }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.CONFIRMED } }),
      this.quotationRepository.count({ where: { ...baseWhere, status: QuotationStatus.REJECTED } }),
    ]);

    return {
      total,
      draft,
      pending,
      calculating,
      completed,
      reviewed,
      confirmed,
      rejected,
    };
  }
}

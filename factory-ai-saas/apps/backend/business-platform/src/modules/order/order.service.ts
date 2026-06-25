import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThan, IsNull, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Order,
  OrderStatus,
  OrderProgress,
  ProductionStage,
} from './entities/order.entity';
import { Quotation } from '../quotation/entities/quotation.entity';
import { Customer } from '../quotation/entities/business-master.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateProgressDto,
  QueryOrderDto,
  ShipOrderDto,
  CompleteOrderDto,
} from './dto/order.dto';

const STAGE_CONFIG: Record<string, { name: string; order: number; weight: number }> = {
  not_started: { name: '未开始', order: 0, weight: 0 },
  cutting: { name: '激光切割', order: 1, weight: 20 },
  welding: { name: '焊接', order: 2, weight: 25 },
  polishing: { name: '抛光处理', order: 3, weight: 20 },
  assembly: { name: '组装', order: 4, weight: 15 },
  qc: { name: '质检', order: 5, weight: 10 },
  packing: { name: '包装', order: 6, weight: 10 },
  done: { name: '已完成', order: 7, weight: 100 },
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderProgress)
    private progressRepository: Repository<OrderProgress>,
    @InjectRepository(Quotation)
    private quotationRepository: Repository<Quotation>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private tenantContext: TenantContextService,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PO${year}${month}${day}${random}`;
  }

  async createFromQuotation(quotationId: string) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    const quotation = await this.quotationRepository.findOne({
      where: { id: quotationId, tenantId, deletedAt: null as any },
    });

    if (!quotation) {
      throw new NotFoundException('报价单不存在');
    }

    if (quotation.status !== 'reviewed') {
      throw new BadRequestException('报价单未审核通过，不能转订单');
    }

    const existing = await this.orderRepository.findOne({
      where: { quotationId, tenantId, deletedAt: null as any },
    });
    if (existing) {
      throw new BadRequestException('该报价单已生成订单');
    }

    return this.create({
      quotationId,
      productName: quotation.productName,
      description: quotation.description,
      quantity: Number(quotation.quantity),
      unitPrice: Number(quotation.finalPrice || quotation.suggestedPrice) / Number(quotation.quantity || 1),
      totalAmount: Number(quotation.finalPrice || quotation.suggestedPrice),
      customerId: quotation.customerId,
      requiredDate: new Date(Date.now() + (quotation.estimatedLeadDays || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      salespersonId: quotation.createdById,
      remark: `从报价单 ${quotation.quoteNo} 转单生成`,
    });
  }

  async create(createOrderDto: CreateOrderDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    const customer = await this.customerRepository.findOne({
      where: { id: createOrderDto.customerId, tenantId, deletedAt: null as any },
    });
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const order = this.orderRepository.create({
      id: uuidv4(),
      tenantId,
      orderNo: this.generateOrderNo(),
      quotationId: createOrderDto.quotationId,
      productName: createOrderDto.productName,
      description: createOrderDto.description,
      quantity: createOrderDto.quantity,
      unitPrice: createOrderDto.unitPrice,
      totalAmount: createOrderDto.totalAmount,
      status: OrderStatus.CONFIRMED,
      currentStage: ProductionStage.NOT_STARTED,
      progressPercent: 0,
      orderDate: new Date(),
      requiredDate: new Date(createOrderDto.requiredDate),
      estimatedDeliveryDate: new Date(createOrderDto.requiredDate),
      customerId: customer.id,
      customerName: customer.name,
      merchandiserId: user?.userId || '',
      merchandiserName: user?.realName || user?.username || '',
      salespersonId: createOrderDto.salespersonId,
      salespersonName: createOrderDto.salespersonId ? '' : user?.realName || user?.username,
      remark: createOrderDto.remark,
    });

    const saved = await this.orderRepository.save(order);
    await this.addProgress(
      saved.id,
      ProductionStage.NOT_STARTED,
      '订单已确认，待排产',
      user,
    );
    return saved;
  }

  async findAll(queryDto: QueryOrderDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 10, keyword, status, customerId } = queryDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.deletedAt IS NULL');

    if (keyword) {
      queryBuilder.andWhere(
        '(order.productName LIKE :keyword OR order.orderNo LIKE :keyword OR order.customerName LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }
    if (customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId });
    }

    const [items, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
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
    const order = await this.orderRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
      relations: ['progresses'],
      order: { progresses: { createdAt: 'ASC' } } as any,
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    this.checkDelay(order);
    return order;
  }

  private checkDelay(order: Order) {
    if (
      order.requiredDate &&
      !order.actualDeliveryDate &&
      ![OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status)
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reqDate = new Date(order.requiredDate);
      reqDate.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - reqDate.getTime()) / (1000 * 60 * 60 * 24));
      order.delayDays = diff > 0 ? diff : 0;
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.SHIPPED].includes(order.status)) {
      throw new BadRequestException('当前状态不允许编辑');
    }

    Object.assign(order, updateOrderDto);

    if (updateOrderDto.requiredDate) {
      order.requiredDate = new Date(updateOrderDto.requiredDate);
      order.estimatedDeliveryDate = new Date(updateOrderDto.requiredDate);
    }

    return this.orderRepository.save(order);
  }

  async updateProgress(id: string, dto: UpdateProgressDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();
    const order = await this.findOne(id);

    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('订单已结束，不能更新进度');
    }

    const stageConfig = STAGE_CONFIG[dto.stage];
    if (!stageConfig) {
      throw new BadRequestException('无效的生产阶段');
    }

    const currentStageOrder = STAGE_CONFIG[order.currentStage]?.order || 0;
    if (stageConfig.order < currentStageOrder && dto.stage !== ProductionStage.NOT_STARTED) {
      throw new BadRequestException(`不能回退到 ${stageConfig.name} 阶段`);
    }

    let progress = await this.progressRepository.findOne({
      where: { orderId: id, stage: dto.stage as ProductionStage, tenantId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        id: uuidv4(),
        tenantId,
        orderId: id,
        stage: dto.stage as ProductionStage,
        stageName: stageConfig.name,
        percent: 0,
        startedAt: new Date(),
        operatorId: user?.userId,
        operatorName: user?.realName || user?.username,
      });
    }

    progress.percent = dto.percent;
    progress.description = dto.description;
    if (dto.complete || dto.percent >= 100) {
      progress.percent = 100;
      progress.completedAt = new Date();
    }
    await this.progressRepository.save(progress);

    let totalPercent = 0;
    let allCompleted = true;
    const allStages = Object.keys(STAGE_CONFIG).filter(s => s !== 'not_started' && s !== 'done');

    for (const stageKey of allStages) {
      const p = await this.progressRepository.findOne({
        where: { orderId: id, stage: stageKey as ProductionStage, tenantId },
      });
      if (p && p.percent >= 100) {
        totalPercent += STAGE_CONFIG[stageKey].weight;
      } else if (p) {
        totalPercent += (STAGE_CONFIG[stageKey].weight * p.percent) / 100;
        allCompleted = false;
      } else {
        allCompleted = false;
      }
    }

    order.currentStage = dto.stage as ProductionStage;
    order.progressPercent = Math.min(100, Math.round(totalPercent));

    if (allCompleted) {
      order.status = OrderStatus.QUALITY_CHECK;
      order.currentStage = ProductionStage.QC;
      if (dto.stage === ProductionStage.PACKING && dto.complete) {
        order.status = OrderStatus.PACKAGING;
        order.currentStage = ProductionStage.DONE;
        order.progressPercent = 100;
      }
    } else {
      order.status = this.mapStageToStatus(dto.stage as ProductionStage);
    }

    return this.orderRepository.save(order);
  }

  private mapStageToStatus(stage: ProductionStage): OrderStatus {
    switch (stage) {
      case ProductionStage.CUTTING:
      case ProductionStage.WELDING:
      case ProductionStage.POLISHING:
      case ProductionStage.ASSEMBLY:
        return OrderStatus.IN_PRODUCTION;
      case ProductionStage.QC:
        return OrderStatus.QUALITY_CHECK;
      case ProductionStage.PACKING:
        return OrderStatus.PACKAGING;
      case ProductionStage.DONE:
        return OrderStatus.PACKAGING;
      default:
        return OrderStatus.MATERIAL_PREPARING;
    }
  }

  async ship(id: string, dto: ShipOrderDto) {
    const order = await this.findOne(id);
    const user = this.tenantContext.getUser();

    if (![OrderStatus.PACKAGING, OrderStatus.QUALITY_CHECK].includes(order.status)) {
      throw new BadRequestException('订单未完成包装质检，不能发货');
    }

    order.status = OrderStatus.SHIPPED;
    order.remark = order.remark
      ? `${order.remark}\n发货: ${dto.remark || ''}`
      : dto.remark;

    await this.addProgress(id, ProductionStage.DONE, `已发货 ${dto.trackingNo || ''}`, user);
    return this.orderRepository.save(order);
  }

  async confirmDelivery(id: string) {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('订单未发货，不能确认收货');
    }

    order.status = OrderStatus.DELIVERED;
    order.actualDeliveryDate = new Date();

    if (order.requiredDate) {
      const reqDate = new Date(order.requiredDate);
      const actualDate = new Date(order.actualDeliveryDate);
      const diff = Math.floor((actualDate.getTime() - reqDate.getTime()) / (1000 * 60 * 60 * 24));
      order.delayDays = diff > 0 ? diff : 0;
    }

    return this.orderRepository.save(order);
  }

  async complete(id: string, dto: CompleteOrderDto) {
    const order = await this.findOne(id);
    if (![OrderStatus.DELIVERED, OrderStatus.SHIPPED].includes(order.status)) {
      throw new BadRequestException('订单未交付，不能完结');
    }

    order.status = OrderStatus.COMPLETED;
    order.actualCost = dto.actualCost;
    if (order.totalAmount) {
      const profit = Number(order.totalAmount) - dto.actualCost;
      order.actualProfitMargin = Number(((profit / order.totalAmount) * 100).toFixed(2));
    }
    if (!order.actualDeliveryDate) {
      order.actualDeliveryDate = new Date();
    }

    return this.orderRepository.save(order);
  }

  async cancel(id: string, reason: string) {
    const order = await this.findOne(id);
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('订单已结束，不能取消');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason;
    return this.orderRepository.save(order);
  }

  private async addProgress(
    orderId: string,
    stage: ProductionStage,
    description: string,
    user?: { userId?: string; realName?: string; username?: string },
  ) {
    const tenantId = this.tenantContext.getTenantId();
    const stageConfig = STAGE_CONFIG[stage];

    const exists = await this.progressRepository.findOne({
      where: { orderId, stage, tenantId },
    });
    if (exists) return;

    const progress = this.progressRepository.create({
      id: uuidv4(),
      tenantId,
      orderId,
      stage,
      stageName: stageConfig?.name || stage,
      description,
      percent: stage === ProductionStage.NOT_STARTED ? 0 : 100,
      startedAt: new Date(),
      completedAt: stage === ProductionStage.NOT_STARTED ? undefined : new Date(),
      operatorId: user?.userId,
      operatorName: user?.realName || user?.username || 'system',
    });
    await this.progressRepository.save(progress);
  }

  async getDashboardStatistics() {
    const tenantId = this.tenantContext.getTenantId();
    const baseWhere = { tenantId, deletedAt: null as any };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      producing,
      toShip,
      completed,
      cancelled,
      todayNew,
      overdue,
    ] = await Promise.all([
      this.orderRepository.count({ where: baseWhere }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.IN_PRODUCTION } }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.PACKAGING } }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.COMPLETED } }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.CANCELLED } }),
      this.orderRepository.count({
        where: { ...baseWhere, createdAt: MoreThan(today) },
      }),
      this.orderRepository
        .createQueryBuilder('o')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.deletedAt IS NULL')
        .andWhere('o.status NOT IN (:...doneStatuses)', {
          doneStatuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        })
        .andWhere('o.requiredDate < :today', { today })
        .getCount(),
    ]);

    const recentCompleted = await this.orderRepository.find({
      where: { ...baseWhere, status: OrderStatus.COMPLETED },
      order: { actualDeliveryDate: 'DESC' } as any,
      take: 10,
    });

    const totalRevenue = recentCompleted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalCost = recentCompleted.reduce((sum, o) => sum + Number(o.actualCost || 0), 0);
    const avgMargin = recentCompleted.length && totalRevenue
      ? Number((((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(2))
      : 0;

    return {
      counts: {
        total,
        producing,
        toShip,
        completed,
        cancelled,
        todayNew,
        overdue,
      },
      recentPerformance: {
        totalRevenue,
        totalProfit: totalRevenue - totalCost,
        avgProfitMargin: avgMargin,
        completedCount: recentCompleted.length,
      },
    };
  }
}

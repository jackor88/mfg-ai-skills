import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CostRecord, PaymentRecord, CostType } from './entities/cost.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import {
  CreateCostRecordDto,
  QueryCostDto,
  CreatePaymentDto,
  QueryPaymentDto,
} from './dto/cost.dto';

@Injectable()
export class CostService {
  constructor(
    @InjectRepository(CostRecord)
    private costRepository: Repository<CostRecord>,
    @InjectRepository(PaymentRecord)
    private paymentRepository: Repository<PaymentRecord>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private tenantContext: TenantContextService,
  ) {}

  async createCostRecord(dto: CreateCostRecordDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    let orderNo: string | undefined;
    if (dto.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: dto.orderId, tenantId, deletedAt: null as any },
      });
      if (!order) throw new NotFoundException('关联订单不存在');
      orderNo = order.orderNo;
    }

    const record = this.costRepository.create({
      id: uuidv4(),
      tenantId,
      orderId: dto.orderId,
      orderNo,
      name: dto.name,
      type: dto.type as CostType,
      amount: dto.amount,
      occurredDate: new Date(dto.occurredDate),
      supplier: dto.supplier,
      invoiceNo: dto.invoiceNo,
      remark: dto.remark,
      createdById: user?.userId,
      createdByName: user?.realName || user?.username,
    });

    return this.costRepository.save(record);
  }

  async findCostRecords(queryDto: QueryCostDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 20, type, orderId, startDate, endDate } = queryDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.costRepository
      .createQueryBuilder('cost')
      .where('cost.tenantId = :tenantId', { tenantId })
      .andWhere('cost.deletedAt IS NULL');

    if (type) queryBuilder.andWhere('cost.type = :type', { type });
    if (orderId) queryBuilder.andWhere('cost.orderId = :orderId', { orderId });
    if (startDate && endDate) {
      queryBuilder.andWhere('cost.occurredDate BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate + 'T23:59:59'),
      });
    } else if (startDate) {
      queryBuilder.andWhere('cost.occurredDate >= :start', { start: new Date(startDate) });
    } else if (endDate) {
      queryBuilder.andWhere('cost.occurredDate <= :end', { end: new Date(endDate + 'T23:59:59') });
    }

    const [items, total] = await queryBuilder
      .orderBy('cost.occurredDate', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async createPayment(dto: CreatePaymentDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, tenantId, deletedAt: null as any },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const payment = this.paymentRepository.create({
      id: uuidv4(),
      tenantId,
      orderId: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: dto.amount,
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      transactionNo: dto.transactionNo,
      remark: dto.remark,
      confirmedById: user?.userId,
      confirmedByName: user?.realName || user?.username,
    });

    return this.paymentRepository.save(payment);
  }

  async findPayments(queryDto: QueryPaymentDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 20, orderId, startDate, endDate } = queryDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.deletedAt IS NULL');

    if (orderId) queryBuilder.andWhere('payment.orderId = :orderId', { orderId });
    if (startDate && endDate) {
      queryBuilder.andWhere('payment.paymentDate BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate + 'T23:59:59'),
      });
    }

    const [items, total] = await queryBuilder
      .orderBy('payment.paymentDate', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getProfitAnalysis(months: number = 6) {
    const tenantId = this.tenantContext.getTenantId();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const completedOrders = await this.orderRepository.find({
      where: {
        tenantId,
        status: OrderStatus.COMPLETED,
        deletedAt: null as any,
      },
    });

    const costs = await this.costRepository.find({
      where: { tenantId, deletedAt: null as any },
    });

    const monthlyData: Record<string, {
      month: string;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
      orderCount: number;
    }> = {};

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        month: key,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        orderCount: 0,
      };
    }

    for (const order of completedOrders) {
      const completedDate = order.actualDeliveryDate || order.updatedAt;
      if (!completedDate || completedDate < startDate) continue;
      const key = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) continue;
      monthlyData[key].revenue += Number(order.totalAmount || 0);
      monthlyData[key].cost += Number(order.actualCost || 0);
      monthlyData[key].orderCount += 1;
    }

    for (const cost of costs) {
      if (cost.occurredDate < startDate) continue;
      const key = `${cost.occurredDate.getFullYear()}-${String(cost.occurredDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) continue;
      if (!cost.orderId) {
        monthlyData[key].cost += Number(cost.amount || 0);
      }
    }

    const trend = Object.values(monthlyData)
      .reverse()
      .map((m) => ({
        ...m,
        profit: Number((m.revenue - m.cost).toFixed(2)),
        margin: m.revenue > 0 ? Number(((m.revenue - m.cost) / m.revenue * 100).toFixed(2)) : 0,
      }));

    const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalCostFromOrders = completedOrders.reduce((s, o) => s + Number(o.actualCost || 0), 0);
    const indirectCosts = costs
      .filter(c => !c.orderId && c.occurredDate >= startDate)
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    const totalCost = totalCostFromOrders + indirectCosts;
    const totalProfit = totalRevenue - totalCost;

    const costByType: Record<string, number> = {};
    for (const c of costs) {
      if (c.occurredDate >= startDate) {
        costByType[c.type] = (costByType[c.type] || 0) + Number(c.amount || 0);
      }
    }

    const topOrders = [...completedOrders]
      .filter(o => o.actualDeliveryDate && o.actualDeliveryDate >= startDate)
      .sort((a, b) => {
        const pa = Number(a.totalAmount || 0) - Number(a.actualCost || 0);
        const pb = Number(b.totalAmount || 0) - Number(b.actualCost || 0);
        return pb - pa;
      })
      .slice(0, 5)
      .map(o => ({
        orderNo: o.orderNo,
        productName: o.productName,
        customerName: o.customerName,
        revenue: Number(o.totalAmount || 0),
        cost: Number(o.actualCost || 0),
        profit: Number(o.totalAmount || 0) - Number(o.actualCost || 0),
        margin: Number(o.totalAmount || 0) > 0
          ? Number((((Number(o.totalAmount || 0) - Number(o.actualCost || 0)) / Number(o.totalAmount || 0)) * 100).toFixed(2))
          : 0,
      }));

    return {
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        overallMargin: totalRevenue > 0 ? Number((totalProfit / totalRevenue * 100).toFixed(2)) : 0,
        completedOrders: completedOrders.length,
      },
      monthlyTrend: trend,
      costBreakdown: Object.entries(costByType).map(([type, amount]) => ({
        type,
        typeName: this.getCostTypeName(type),
        amount: Number(amount.toFixed(2)),
      })),
      topProfitableOrders: topOrders,
    };
  }

  private getCostTypeName(type: string): string {
    const map: Record<string, string> = {
      material: '材料费',
      labor: '人工费',
      overhead: '制造费用',
      logistics: '物流包装费',
      outsourcing: '外协加工费',
      other: '其他费用',
    };
    return map[type] || type;
  }

  async getOrderCostDetail(orderId: string) {
    const tenantId = this.tenantContext.getTenantId();

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId, deletedAt: null as any },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const costs = await this.costRepository.find({
      where: { orderId, tenantId, deletedAt: null as any },
      order: { occurredDate: 'ASC' } as any,
    });

    const payments = await this.paymentRepository.find({
      where: { orderId, tenantId, deletedAt: null as any },
      order: { paymentDate: 'ASC' } as any,
    });

    const costBreakdown = {
      material: 0,
      labor: 0,
      overhead: 0,
      logistics: 0,
      outsourcing: 0,
      other: 0,
    };

    for (const c of costs) {
      (costBreakdown as any)[c.type] = (costBreakdown as any)[c.type] + Number(c.amount || 0);
    }

    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalCost = costs.reduce((s, c) => s + Number(c.amount || 0), 0);
    const revenue = Number(order.totalAmount || 0);

    return {
      order: {
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productName,
        customerName: order.customerName,
        status: order.status,
        totalAmount: revenue,
        actualCost: Number(order.actualCost || totalCost),
        profit: revenue - Number(order.actualCost || totalCost),
        margin: revenue > 0
          ? Number(((revenue - Number(order.actualCost || totalCost)) / revenue * 100).toFixed(2))
          : 0,
      },
      costs: {
        items: costs,
        breakdown: Object.entries(costBreakdown).map(([type, amount]) => ({
          type,
          typeName: this.getCostTypeName(type),
          amount: Number(amount.toFixed(2)),
        })),
        total: Number(totalCost.toFixed(2)),
      },
      payments: {
        items: payments,
        total: Number(totalPaid.toFixed(2)),
        remaining: Number((revenue - totalPaid).toFixed(2)),
      },
    };
  }

  async getFinancialDashboard() {
    const tenantId = this.tenantContext.getTenantId();
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      monthRevenue,
      monthCost,
      lastMonthRevenue,
      receivables,
      unpaidCosts,
      pendingOrders,
    ] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.tenantId = :tenantId', { tenantId })
        .andWhere('p.deletedAt IS NULL')
        .andWhere('p.paymentDate >= :start', { start: monthStart })
        .getRawOne()
        .then(r => Number(r?.total || 0)),

      this.costRepository
        .createQueryBuilder('c')
        .select('COALESCE(SUM(c.amount), 0)', 'total')
        .where('c.tenantId = :tenantId', { tenantId })
        .andWhere('c.deletedAt IS NULL')
        .andWhere('c.occurredDate >= :start', { start: monthStart })
        .getRawOne()
        .then(r => Number(r?.total || 0)),

      this.paymentRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.tenantId = :tenantId', { tenantId })
        .andWhere('p.deletedAt IS NULL')
        .andWhere('p.paymentDate BETWEEN :start AND :end', { start: lastMonthStart, end: lastMonthEnd })
        .getRawOne()
        .then(r => Number(r?.total || 0)),

      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'total')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.deletedAt IS NULL')
        .andWhere('o.status IN (:...statuses)', {
          statuses: [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.SHIPPED],
        })
        .getRawOne()
        .then(async (r) => {
          const totalOrderAmount = Number(r?.total || 0);
          const paid = await this.paymentRepository
            .createQueryBuilder('p')
            .select('COALESCE(SUM(p.amount), 0)', 'total')
            .where('p.tenantId = :tenantId', { tenantId })
            .andWhere('p.deletedAt IS NULL')
            .getRawOne()
            .then(pr => Number(pr?.total || 0));
          return Math.max(0, totalOrderAmount - paid);
        }),

      this.costRepository
        .createQueryBuilder('c')
        .where('c.tenantId = :tenantId', { tenantId })
        .andWhere('c.deletedAt IS NULL')
        .getCount(),

      this.orderRepository.count({
        where: {
          tenantId,
          deletedAt: null as any,
          status: OrderStatus.IN_PRODUCTION,
        },
      }),
    ]);

    const monthProfit = monthRevenue - monthCost;
    const momGrowth = lastMonthRevenue > 0
      ? Number(((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2))
      : (monthRevenue > 0 ? 100 : 0);

    return {
      monthlyOverview: {
        revenue: Number(monthRevenue.toFixed(2)),
        cost: Number(monthCost.toFixed(2)),
        profit: Number(monthProfit.toFixed(2)),
        margin: monthRevenue > 0 ? Number((monthProfit / monthRevenue * 100).toFixed(2)) : 0,
        revenueMomGrowth: momGrowth,
      },
      receivables: Number(receivables.toFixed(2)),
      producingOrders: pendingOrders,
    };
  }
}

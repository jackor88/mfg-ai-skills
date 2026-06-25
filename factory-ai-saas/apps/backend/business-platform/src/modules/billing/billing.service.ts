import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  AiAccount,
  RechargeOrder,
  AiConsumeLog,
  RechargeOrderStatus,
  PaymentMethod,
  AI_PACKAGES,
} from './entities/billing.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import {
  CreateRechargeDto,
  QueryRechargeDto,
  ConsumeAiDto,
} from './dto/billing.dto';

const AI_COST_PER_CALL = 1;

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(AiAccount)
    private accountRepository: Repository<AiAccount>,
    @InjectRepository(RechargeOrder)
    private orderRepository: Repository<RechargeOrder>,
    @InjectRepository(AiConsumeLog)
    private logRepository: Repository<AiConsumeLog>,
    private tenantContext: TenantContextService,
  ) {}

  async getAccount() {
    const tenantId = this.tenantContext.getTenantId();
    let account = await this.accountRepository.findOne({
      where: { tenantId, deletedAt: null as any },
    });

    if (!account) {
      account = await this.accountRepository.save(
        this.accountRepository.create({
          id: uuidv4(),
          tenantId,
          balance: 100,
          totalRecharged: 0,
          totalConsumed: 0,
          quotaCount: 50,
          totalUsedCount: 0,
        }),
      );
    }

    return {
      ...account,
      balance: Number(account.balance),
      totalRecharged: Number(account.totalRecharged),
      totalConsumed: Number(account.totalConsumed),
    };
  }

  getPackages() {
    return AI_PACKAGES;
  }

  async createRechargeOrder(dto: CreateRechargeDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    const pkg = AI_PACKAGES.find((p) => p.id === dto.packageId);
    if (!pkg) {
      throw new NotFoundException('套餐不存在');
    }

    const account = await this.getAccount();

    const order = this.orderRepository.create({
      id: uuidv4(),
      tenantId,
      orderNo: this.generateOrderNo(),
      packageName: pkg.name,
      amount: pkg.amount,
      credits: pkg.credits,
      bonusCount: pkg.bonusCount,
      status: RechargeOrderStatus.PENDING,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      createdById: user?.userId || '',
      createdByName: user?.realName || user?.username || '',
    });

    const saved = await this.orderRepository.save(order);

    return {
      ...saved,
      amount: Number(saved.amount),
      payUrl: `/api/v1/payment/mock-pay/${saved.orderNo}`,
      packages: pkg,
    };
  }

  private generateOrderNo(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const r = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `RC${y}${m}${d}${r}`;
  }

  async mockPay(orderNo: string) {
    const order = await this.orderRepository.findOne({
      where: { orderNo },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status === RechargeOrderStatus.PAID) {
      return { message: '订单已支付', order };
    }
    if (order.status !== RechargeOrderStatus.PENDING) {
      throw new BadRequestException('订单状态异常');
    }

    order.status = RechargeOrderStatus.PAID;
    order.paidAt = new Date();
    order.transactionNo = `MOCK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await this.orderRepository.save(order);

    let account = await this.accountRepository.findOne({
      where: { tenantId: order.tenantId, deletedAt: null as any },
    });
    if (!account) {
      account = this.accountRepository.create({
        id: uuidv4(),
        tenantId: order.tenantId,
        balance: 0,
        totalRecharged: 0,
        totalConsumed: 0,
        quotaCount: 0,
        totalUsedCount: 0,
      });
    }

    account.balance = Number(account.balance) + Number(order.amount);
    account.totalRecharged = Number(account.totalRecharged) + Number(order.amount);
    account.quotaCount = (account.quotaCount || 0) + order.credits + (order.bonusCount || 0);

    await this.accountRepository.save(account);

    await this.logRepository.save(
      this.logRepository.create({
        id: uuidv4(),
        tenantId: order.tenantId,
        serviceType: 'recharge',
        amount: Number(order.amount),
        count: order.credits + (order.bonusCount || 0),
        description: `充值${order.packageName}，获得${order.credits}次核价，赠送${order.bonusCount || 0}次`,
        orderId: order.id,
        operatorId: order.createdById,
        operatorName: order.createdByName,
      }),
    );

    return {
      message: '支付成功',
      order: { ...order, amount: Number(order.amount) },
      account: {
        balance: Number(account.balance),
        quotaCount: account.quotaCount,
      },
    };
  }

  async consumeAiCredits(dto: ConsumeAiDto) {
    const tenantId = this.tenantContext.getTenantId();
    const user = this.tenantContext.getUser();

    const account = await this.getAccount();

    const cost = dto.amount || AI_COST_PER_CALL;

    if (account.balance < cost) {
      throw new BadRequestException('算力余额不足，请充值后使用');
    }

    if (account.quotaCount <= 0) {
      throw new BadRequestException('核价次数已用完，请充值');
    }

    const updatedAccount = await this.accountRepository.findOne({
      where: { tenantId, deletedAt: null as any },
    });

    if (updatedAccount) {
      updatedAccount.balance = Number(updatedAccount.balance) - cost;
      updatedAccount.totalConsumed = Number(updatedAccount.totalConsumed) + cost;
      updatedAccount.quotaCount = (updatedAccount.quotaCount || 0) - dto.count;
      updatedAccount.totalUsedCount = (updatedAccount.totalUsedCount || 0) + dto.count;
      updatedAccount.lastConsumedAt = new Date();
      await this.accountRepository.save(updatedAccount);
    }

    await this.logRepository.save(
      this.logRepository.create({
        id: uuidv4(),
        tenantId,
        serviceType: dto.serviceType,
        amount: cost,
        count: dto.count,
        description: dto.description,
        quotationId: dto.quotationId,
        operatorId: user?.userId,
        operatorName: user?.realName || user?.username,
      }),
    );

    return {
      success: true,
      deducted: cost,
      remainingBalance: Number(updatedAccount?.balance || 0),
      remainingQuota: updatedAccount?.quotaCount || 0,
    };
  }

  async findRechargeOrders(queryDto: QueryRechargeDto) {
    const tenantId = this.tenantContext.getTenantId();
    const { page = 1, pageSize = 10, status } = queryDto;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;

    const [items, total] = await this.orderRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items: items.map(i => ({ ...i, amount: Number(i.amount) })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getConsumeLogs(page = 1, pageSize = 20) {
    const tenantId = this.tenantContext.getTenantId();
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.logRepository.findAndCount({
      where: { tenantId, deletedAt: IsNull() as any, serviceType: 'calculate_price' as any },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async checkCanUseAi(): Promise<{ available: boolean; canUse: boolean; message?: string; reason?: string; remainingQuota: number; balance: number }> {
    const account = await this.getAccount();
    if (account.quotaCount <= 0) {
      return { available: false, canUse: false, message: '核价次数不足，请充值', reason: '核价次数不足', remainingQuota: account.quotaCount, balance: account.balance };
    }
    if (account.balance < AI_COST_PER_CALL) {
      return { available: false, canUse: false, message: '余额不足，请充值', reason: '余额不足', remainingQuota: account.quotaCount, balance: account.balance };
    }
    return { available: true, canUse: true, remainingQuota: account.quotaCount, balance: account.balance };
  }
}

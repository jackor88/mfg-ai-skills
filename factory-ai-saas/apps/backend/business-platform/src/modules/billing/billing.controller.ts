import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { CreateRechargeDto, QueryRechargeDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('算力充值')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('account')
  @ApiOperation({ summary: '获取算力账户信息' })
  @RequirePermissions('payment:view')
  getAccount() {
    return this.billingService.getAccount();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('packages')
  @ApiOperation({ summary: '获取充值套餐列表' })
  @RequirePermissions('payment:recharge')
  getPackages() {
    return this.billingService.getPackages();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('recharge')
  @ApiOperation({ summary: '创建充值订单' })
  @RequirePermissions('payment:recharge')
  createRecharge(@Body() dto: CreateRechargeDto) {
    return this.billingService.createRechargeOrder(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('orders')
  @ApiOperation({ summary: '充值订单列表' })
  @RequirePermissions('payment:view')
  getOrders(@Query() query: QueryRechargeDto) {
    return this.billingService.findRechargeOrders(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('consume-logs')
  @ApiOperation({ summary: 'AI消费记录' })
  @RequirePermissions('payment:view')
  getLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.billingService.getConsumeLogs(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('check-ai')
  @ApiOperation({ summary: '检查AI是否可用' })
  checkAi() {
    return this.billingService.checkCanUseAi();
  }
}

@ApiTags('支付模拟')
@Controller('payment')
export class PaymentController {
  constructor(private readonly billingService: BillingService) {}

  @Get('mock-pay/:orderNo')
  @ApiOperation({ summary: '模拟支付成功（演示用）' })
  @Public()
  async mockPay(
    @Param('orderNo') orderNo: string,
    @Res() res: Response,
  ) {
    const result = await this.billingService.mockPay(orderNo);
    const balance = result.account?.balance || 0;
    const quota = result.account?.quotaCount || 0;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>支付成功 - 工厂AI SaaS平台</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px 60px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
    .icon { font-size: 80px; margin-bottom: 20px; }
    h1 { color: #10b981; margin: 0 0 10px; }
    .amount { font-size: 48px; color: #1f2937; font-weight: bold; margin: 20px 0; }
    .info { color: #6b7280; margin: 8px 0; }
    .pkg { background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 20px 0; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>支付成功</h1>
    <div class="amount">¥${result.order.amount}</div>
    <div class="pkg">
      <div><strong>${result.order.packageName}</strong></div>
      <div style="color:#6b7280; margin-top:4px;">获得 ${result.order.credits} 次核价${result.order.bonusCount ? ` + 赠送 ${result.order.bonusCount} 次` : ''}</div>
    </div>
    <div class="info">交易号: ${result.order.transactionNo}</div>
    <div class="info">支付时间: ${new Date().toLocaleString('zh-CN')}</div>
    <div class="info">当前余额: ¥${balance}</div>
    <div class="info">剩余核价次数: ${quota}</div>
    <a href="/api/docs" class="btn">返回API文档</a>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}

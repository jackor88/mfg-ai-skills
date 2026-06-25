import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CostService } from './cost.service';
import {
  CreateCostRecordDto,
  QueryCostDto,
  CreatePaymentDto,
  QueryPaymentDto,
} from './dto/cost.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('成本核算')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cost')
export class CostController {
  constructor(private readonly costService: CostService) {}

  @Post('records')
  @ApiOperation({ summary: '录入成本记录' })
  @RequirePermissions('cost:manage')
  createCostRecord(@Body() dto: CreateCostRecordDto) {
    return this.costService.createCostRecord(dto);
  }

  @Get('records')
  @ApiOperation({ summary: '查询成本记录' })
  @RequirePermissions('cost:view')
  findCostRecords(@Query() queryDto: QueryCostDto) {
    return this.costService.findCostRecords(queryDto);
  }

  @Post('payments')
  @ApiOperation({ summary: '登记收款' })
  @RequirePermissions('finance:manage')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.costService.createPayment(dto);
  }

  @Get('payments')
  @ApiOperation({ summary: '查询收款记录' })
  @RequirePermissions('finance:manage', 'cost:view')
  findPayments(@Query() queryDto: QueryPaymentDto) {
    return this.costService.findPayments(queryDto);
  }

  @Get('profit-analysis')
  @ApiOperation({ summary: '利润分析报表' })
  @RequirePermissions('cost:view', 'finance:manage')
  getProfitAnalysis(@Query('months') months?: string) {
    return this.costService.getProfitAnalysis(months ? parseInt(months) : 6);
  }

  @Get('dashboard')
  @ApiOperation({ summary: '财务看板数据' })
  @RequirePermissions('cost:view', 'finance:manage')
  getFinancialDashboard() {
    return this.costService.getFinancialDashboard();
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: '订单成本明细' })
  @RequirePermissions('cost:view')
  getOrderCostDetail(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.costService.getOrderCostDetail(orderId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateProgressDto,
  QueryOrderDto,
  ShipOrderDto,
  CompleteOrderDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('订单跟踪')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  @RequirePermissions('order:manage')
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Post('from-quotation/:quotationId')
  @ApiOperation({ summary: '从报价单转订单' })
  @RequirePermissions('order:manage')
  createFromQuotation(@Param('quotationId', ParseUUIDPipe) quotationId: string) {
    return this.orderService.createFromQuotation(quotationId);
  }

  @Get()
  @ApiOperation({ summary: '查询订单列表' })
  @RequirePermissions('order:view')
  findAll(@Query() queryDto: QueryOrderDto) {
    return this.orderService.findAll(queryDto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: '订单看板统计' })
  @RequirePermissions('order:view')
  getDashboard() {
    return this.orderService.getDashboardStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @RequirePermissions('order:view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新订单信息' })
  @RequirePermissions('order:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: '更新生产进度' })
  @RequirePermissions('order:update')
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.orderService.updateProgress(id, dto);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: '订单发货' })
  @RequirePermissions('order:update')
  ship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShipOrderDto,
  ) {
    return this.orderService.ship(id, dto);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: '确认收货' })
  @RequirePermissions('order:update')
  confirmDelivery(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.confirmDelivery(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完结订单（录入实际成本）' })
  @RequirePermissions('order:update', 'cost:manage')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteOrderDto,
  ) {
    return this.orderService.complete(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消订单' })
  @RequirePermissions('order:manage')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.orderService.cancel(id, reason);
  }
}

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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ErpService } from './erp.service';
import { CreateErpConfigDto, UpdateErpConfigDto, ManualSyncDto, QuerySyncLogDto } from './dto/erp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('ERP同步')
@ApiBearerAuth()
@Controller('erp')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  @Get('types')
  @ApiOperation({ summary: '获取支持的ERP类型' })
  getErpTypes() {
    return this.erpService.getErpTypes();
  }

  @Get('config')
  @ApiOperation({ summary: '获取ERP配置' })
  getConfig() {
    return this.erpService.getConfig();
  }

  @Post('config')
  @ApiOperation({ summary: '创建/覆盖ERP配置' })
  @RequirePermissions('system:settings')
  createConfig(@Body() dto: CreateErpConfigDto) {
    return this.erpService.createConfig(dto);
  }

  @Patch('config/:id')
  @ApiOperation({ summary: '更新ERP配置' })
  @RequirePermissions('system:settings')
  updateConfig(@Param('id') id: string, @Body() dto: UpdateErpConfigDto) {
    return this.erpService.updateConfig(id, dto);
  }

  @Delete('config')
  @ApiOperation({ summary: '删除ERP配置' })
  @RequirePermissions('system:settings')
  deleteConfig() {
    return this.erpService.deleteConfig();
  }

  @Post('test-connection')
  @ApiOperation({ summary: '测试ERP连接' })
  @RequirePermissions('system:settings')
  testConnection() {
    return this.erpService.testConnection();
  }

  @Post('sync')
  @ApiOperation({ summary: '手动触发同步' })
  @RequirePermissions('system:settings')
  manualSync(@Body() dto: ManualSyncDto) {
    return this.erpService.manualSync(dto);
  }

  @Get('sync-logs')
  @ApiOperation({ summary: '同步日志列表' })
  getSyncLogs(@Query() query: QuerySyncLogDto) {
    return this.erpService.getSyncLogs(query);
  }
}

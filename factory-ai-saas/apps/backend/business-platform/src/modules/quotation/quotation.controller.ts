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
import { QuotationService } from './quotation.service';
import { MasterDataService } from './master-data.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { ReviewQuotationDto } from './dto/review-quotation.dto';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateProcessDto,
  UpdateProcessDto,
} from './dto/master-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('AI核价报价')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly masterDataService: MasterDataService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建报价单' })
  @RequirePermissions('quotation:create')
  create(@Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationService.create(createQuotationDto);
  }

  @Get()
  @ApiOperation({ summary: '查询报价单列表' })
  @RequirePermissions('quotation:view')
  findAll(@Query() queryDto: QueryQuotationDto) {
    return this.quotationService.findAll(queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取报价统计数据' })
  @RequirePermissions('quotation:view')
  getStatistics() {
    return this.quotationService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取报价单详情' })
  @RequirePermissions('quotation:view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新报价单' })
  @RequirePermissions('quotation:edit')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ) {
    return this.quotationService.update(id, updateQuotationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除报价单' })
  @RequirePermissions('quotation:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交AI核价' })
  @RequirePermissions('quotation:create')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.submit(id);
  }

  @Post(':id/ai-calculate')
  @ApiOperation({ summary: '执行AI核价' })
  @RequirePermissions('quotation:ai_calculate')
  aiCalculate(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.triggerAiCalculate(id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: '老板审核报价' })
  @RequirePermissions('quotation:review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewQuotationDto,
  ) {
    return this.quotationService.review(id, reviewDto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认报价（转订单）' })
  @RequirePermissions('quotation:confirm')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.confirm(id);
  }

  @Get('master/customers')
  @ApiOperation({ summary: '客户列表' })
  @RequirePermissions('quotation:view', 'customer:view')
  listCustomers(@Query('keyword') keyword?: string) {
    return this.masterDataService.findAllCustomers(keyword);
  }

  @Post('master/customers')
  @ApiOperation({ summary: '创建客户' })
  @RequirePermissions('customer:manage')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.masterDataService.createCustomer(dto);
  }

  @Patch('master/customers/:id')
  @ApiOperation({ summary: '更新客户' })
  @RequirePermissions('customer:manage')
  updateCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.masterDataService.updateCustomer(id, dto);
  }

  @Delete('master/customers/:id')
  @ApiOperation({ summary: '删除客户' })
  @RequirePermissions('customer:manage')
  deleteCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteCustomer(id);
  }

  @Get('master/materials')
  @ApiOperation({ summary: '物料列表' })
  @RequirePermissions('quotation:view', 'material:view')
  listMaterials(@Query('keyword') keyword?: string) {
    return this.masterDataService.findAllMaterials(keyword);
  }

  @Post('master/materials')
  @ApiOperation({ summary: '创建物料' })
  @RequirePermissions('material:manage')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.masterDataService.createMaterial(dto);
  }

  @Patch('master/materials/:id')
  @ApiOperation({ summary: '更新物料' })
  @RequirePermissions('material:manage')
  updateMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.masterDataService.updateMaterial(id, dto);
  }

  @Delete('master/materials/:id')
  @ApiOperation({ summary: '删除物料' })
  @RequirePermissions('material:manage')
  deleteMaterial(@Param('id', ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteMaterial(id);
  }

  @Get('master/processes')
  @ApiOperation({ summary: '工序列表' })
  @RequirePermissions('quotation:view', 'process:view')
  listProcesses(@Query('keyword') keyword?: string) {
    return this.masterDataService.findAllProcesses(keyword);
  }

  @Post('master/processes')
  @ApiOperation({ summary: '创建工序' })
  @RequirePermissions('process:manage')
  createProcess(@Body() dto: CreateProcessDto) {
    return this.masterDataService.createProcess(dto);
  }

  @Patch('master/processes/:id')
  @ApiOperation({ summary: '更新工序' })
  @RequirePermissions('process:manage')
  updateProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcessDto,
  ) {
    return this.masterDataService.updateProcess(id, dto);
  }

  @Delete('master/processes/:id')
  @ApiOperation({ summary: '删除工序' })
  @RequirePermissions('process:manage')
  deleteProcess(@Param('id', ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteProcess(id);
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Customer, Material, Process } from './entities/business-master.entity';
import { TenantContextService } from '../../common/context/tenant-context.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateProcessDto,
  UpdateProcessDto,
} from './dto/master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    private tenantContext: TenantContextService,
  ) {}

  async createCustomer(dto: CreateCustomerDto) {
    const tenantId = this.tenantContext.getTenantId();
    const customer = this.customerRepository.create({
      id: uuidv4(),
      tenantId,
      ...dto,
    });
    return this.customerRepository.save(customer);
  }

  async findAllCustomers(keyword?: string) {
    const tenantId = this.tenantContext.getTenantId();
    const where: any = { tenantId, deletedAt: null };
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    return this.customerRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findCustomer(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });
    if (!customer) throw new NotFoundException('客户不存在');
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findCustomer(id);
    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async deleteCustomer(id: string) {
    await this.findCustomer(id);
    await this.customerRepository.update(id, { deletedAt: new Date() });
    return { message: '删除成功' };
  }

  async createMaterial(dto: CreateMaterialDto) {
    const tenantId = this.tenantContext.getTenantId();
    const existing = await this.materialRepository.findOne({
      where: { code: dto.code, tenantId },
    });
    if (existing) throw new ConflictException('物料编码已存在');
    const material = this.materialRepository.create({
      id: uuidv4(),
      tenantId,
      ...dto,
    });
    return this.materialRepository.save(material);
  }

  async findAllMaterials(keyword?: string) {
    const tenantId = this.tenantContext.getTenantId();
    const where: any = { tenantId, deletedAt: null };
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    return this.materialRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findMaterial(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const material = await this.materialRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });
    if (!material) throw new NotFoundException('物料不存在');
    return material;
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    const material = await this.findMaterial(id);
    Object.assign(material, dto);
    return this.materialRepository.save(material);
  }

  async deleteMaterial(id: string) {
    await this.findMaterial(id);
    await this.materialRepository.update(id, { deletedAt: new Date() });
    return { message: '删除成功' };
  }

  async createProcess(dto: CreateProcessDto) {
    const tenantId = this.tenantContext.getTenantId();
    const existing = await this.processRepository.findOne({
      where: { code: dto.code, tenantId },
    });
    if (existing) throw new ConflictException('工序编码已存在');
    const process = this.processRepository.create({
      id: uuidv4(),
      tenantId,
      ...dto,
    });
    return this.processRepository.save(process);
  }

  async findAllProcesses(keyword?: string) {
    const tenantId = this.tenantContext.getTenantId();
    const where: any = { tenantId, deletedAt: null };
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    return this.processRepository.find({
      where,
      order: { workshop: 'ASC', name: 'ASC' },
    });
  }

  async findProcess(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    const process = await this.processRepository.findOne({
      where: { id, tenantId, deletedAt: null as any },
    });
    if (!process) throw new NotFoundException('工序不存在');
    return process;
  }

  async updateProcess(id: string, dto: UpdateProcessDto) {
    const process = await this.findProcess(id);
    Object.assign(process, dto);
    return this.processRepository.save(process);
  }

  async deleteProcess(id: string) {
    await this.findProcess(id);
    await this.processRepository.update(id, { deletedAt: new Date() });
    return { message: '删除成功' };
  }
}

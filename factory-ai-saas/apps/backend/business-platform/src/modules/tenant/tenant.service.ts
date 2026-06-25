import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.tenantRepository.findOne({
      where: { code: createTenantDto.code },
    });
    if (existing) {
      throw new BadRequestException('租户编码已存在');
    }

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      id: uuidv4(),
      status: TenantStatus.ACTIVE,
    });
    return this.tenantRepository.save(tenant);
  }

  async findAll(paginationDto: PaginationDto, keyword?: string) {
    const { page = 1, pageSize = 20, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    if (keyword) {
      queryBuilder.where(
        'tenant.name LIKE :keyword OR tenant.code LIKE :keyword OR tenant.contactPerson LIKE :keyword',
        { keyword: `%${keyword}%` },
      );
    }

    const order = (sortOrder || 'desc').toUpperCase() as 'ASC' | 'DESC';
    queryBuilder
      .orderBy(
        sortBy ? `tenant.${sortBy}` : 'tenant.createdAt',
        order,
      )
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }
    return tenant;
  }

  async findByCode(code: string) {
    return this.tenantRepository.findOne({ where: { code } });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);
    await this.tenantRepository.softRemove(tenant);
    return { success: true };
  }

  async updateStatus(id: string, status: TenantStatus) {
    const tenant = await this.findOne(id);
    tenant.status = status;
    return this.tenantRepository.save(tenant);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErpService } from './erp.service';
import { ErpController } from './erp.controller';
import { ErpConfig, ErpSyncLog } from './entities/erp.entity';
import { Customer, Material, Process } from '../quotation/entities/business-master.entity';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ErpConfig, ErpSyncLog, Customer, Material, Process]),
    TenantModule,
  ],
  controllers: [ErpController],
  providers: [ErpService],
  exports: [ErpService],
})
export class ErpModule {}

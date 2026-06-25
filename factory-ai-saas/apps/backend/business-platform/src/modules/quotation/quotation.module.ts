import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation, QuotationHistory } from './entities/quotation.entity';
import { Customer, Material, Process } from './entities/business-master.entity';
import { QuotationService } from './quotation.service';
import { MasterDataService } from './master-data.service';
import { QuotationController } from './quotation.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation,
      QuotationHistory,
      Customer,
      Material,
      Process,
    ]),
    forwardRef(() => BillingModule),
  ],
  controllers: [QuotationController],
  providers: [QuotationService, MasterDataService],
  exports: [QuotationService, MasterDataService, TypeOrmModule],
})
export class QuotationModule {}

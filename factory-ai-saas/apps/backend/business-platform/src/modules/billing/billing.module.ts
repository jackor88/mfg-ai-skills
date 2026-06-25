import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAccount, RechargeOrder, AiConsumeLog } from './entities/billing.entity';
import { BillingService } from './billing.service';
import { BillingController, PaymentController } from './billing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiAccount, RechargeOrder, AiConsumeLog]),
  ],
  controllers: [BillingController, PaymentController],
  providers: [BillingService],
  exports: [BillingService, TypeOrmModule],
})
export class BillingModule {}

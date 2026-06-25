import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostRecord, PaymentRecord } from './entities/cost.entity';
import { Order } from '../order/entities/order.entity';
import { CostService } from './cost.service';
import { CostController } from './cost.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CostRecord, PaymentRecord, Order]),
  ],
  controllers: [CostController],
  providers: [CostService],
  exports: [CostService, TypeOrmModule],
})
export class CostModule {}

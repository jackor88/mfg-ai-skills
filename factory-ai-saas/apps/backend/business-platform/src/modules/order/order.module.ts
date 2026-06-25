import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderProgress } from './entities/order.entity';
import { Quotation } from '../quotation/entities/quotation.entity';
import { Customer } from '../quotation/entities/business-master.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderProgress, Quotation, Customer]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}

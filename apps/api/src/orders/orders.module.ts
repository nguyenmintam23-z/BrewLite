import { User } from '../users/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { ProductOption } from '../products/product-option.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ManagerOrdersController } from './manager-orders.controller';
import { AuthModule } from '../auth/auth.module';
import { ManagerReportsController } from '../reports/manager-reports.controller';
import { StaffOrdersController } from './staff-orders.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      Product,
      ProductOption,
      User,
    ]),
  ],
  controllers: [
    OrdersController,
    ManagerOrdersController,
    ManagerReportsController,
    StaffOrdersController,
  ],
  providers: [OrdersService],
})
export class OrdersModule {}

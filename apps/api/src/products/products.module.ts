import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthModule } from '../auth/auth.module';
import { ManagerProductsController } from './manager-products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductOption]),AuthModule,],
  controllers: [ProductsController, ManagerProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { ProductsService } from './products.service';

@Controller('manager/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER)
export class ManagerProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAllForManager();
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/options')
  createOption(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateProductOptionDto,
  ) {
    return this.productsService.createOption(id, dto);
  }

  @Patch(':id/options/:optionId')
  updateOption(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('optionId', new ParseUUIDPipe()) optionId: string,
    @Body() dto: UpdateProductOptionDto,
  ) {
    return this.productsService.updateOption(id, optionId, dto);
  }
}

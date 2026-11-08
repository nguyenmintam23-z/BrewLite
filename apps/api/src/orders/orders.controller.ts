import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

type CustomerRequest = Request & {
  user: { sub: string; role: UserRole };
};

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() request: CustomerRequest) {
    return this.ordersService.create(dto, request.user.sub);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: CustomerRequest,
  ) {
    return this.ordersService.cancelForCustomer(id, request.user.sub);
  }

  @Get()
  findAll(@Req() request: CustomerRequest) {
    return this.ordersService.findByCustomer(request.user.sub);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Req() request: CustomerRequest,
  ) {
    if (customerId !== request.user.sub) {
      throw new ForbiddenException('Bạn chỉ có thể xem đơn hàng của mình');
    }
    return this.ordersService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: CustomerRequest,
  ) {
    return this.ordersService.findOneForCustomer(id, request.user.sub);
  }
}
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ListManagerOrdersDto } from './dto/list-manager-orders.dto';
import { UpdateStaffOrderStatusDto } from './dto/update-staff-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('staff/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF)
export class StaffOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: ListManagerOrdersDto) {
    return this.ordersService.findAllForStaff(query.status);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ordersService.findOneForStaff(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStaffOrderStatusDto,
  ) {
    return this.ordersService.updateStaffStatus(id, dto.status);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { OrdersService } from '../orders/orders.service';
import { ManagerSalesReportDto } from './dto/manager-sales-report.dto';

@Controller('manager/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER)
export class ManagerReportsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('sales')
  sales(@Query() query: ManagerSalesReportDto) {
    return this.ordersService.getManagerSalesReport(query.from, query.to);
  }
}

import {
  Controller,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/mock-result')
  setMockResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('success', ParseBoolPipe) success: boolean,
    @Req() request: Request & { user: { sub: string } },
  ) {
    return this.paymentsService.setMockResultForCustomer(
      id,
      request.user.sub,
      success,
    );
  }
}
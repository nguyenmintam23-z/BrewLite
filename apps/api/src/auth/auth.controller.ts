import { Body, Controller, Post } from '@nestjs/common';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { AuthService } from './auth.service';
import { VerifyCustomerOtpDto } from './dto/verify-customer-otp.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../users/user.entity';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetCustomerPasswordDto } from './dto/reset-customer-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('customers/login')
  loginCustomer(@Body() dto: CustomerLoginDto) {
   return this.authService.loginCustomer(dto.phone, dto.password);
  }
  @Get('manager-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  managerCheck(@Req() request: Request & { user: { sub: string; role: string } }) {
    return {
      message: 'Quản lý truy cập thành công',
      user: request.user,
  };
}
  @Post('customers/register/verify-otp')
  verifyCustomerOtp(@Body() dto: VerifyCustomerOtpDto) {
   return this.authService.verifyCustomerOtp(dto.phone, dto.otp);
  }
  @Post('staff/login')
  loginInternal(@Body() dto: StaffLoginDto) {
   return this.authService.loginInternal(dto.username, dto.password);
}

  @Post('customers/register/request-otp')
  requestCustomerOtp(@Body() dto: RegisterCustomerDto) {
    return this.authService.requestCustomerOtp(dto);
  }

  @Post('customers/forgot-password/request-otp')
  requestPasswordResetOtp(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordResetOtp(dto.phone);
  }

  @Post('customers/forgot-password/verify-otp')
  verifyPasswordResetOtp(@Body() dto: VerifyCustomerOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto.phone, dto.otp);
  }

  @Post('customers/forgot-password/reset')
  resetCustomerPassword(@Body() dto: ResetCustomerPasswordDto) {
    return this.authService.resetCustomerPassword(
      dto.phone,
      dto.resetToken,
      dto.password,
    );
  }
}
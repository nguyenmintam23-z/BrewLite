import { Matches } from 'class-validator';

export class VerifyCustomerOtpDto {
  @Matches(/^0[35789][0-9]{8}$/)
  phone!: string;

  @Matches(/^\d{6}$/, {
    message: 'OTP phải gồm đúng 6 chữ số',
  })
  otp!: string;
}
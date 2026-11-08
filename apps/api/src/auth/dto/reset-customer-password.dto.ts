import { Matches, MinLength } from 'class-validator';

export class ResetCustomerPasswordDto {
  @Matches(/^0[35789][0-9]{8}$/, {
    message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09',
  })
  phone!: string;

  @MinLength(32)
  resetToken!: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Mật khẩu phải ít nhất 8 ký tự và có chữ hoa, chữ thường, số, ký tự đặc biệt',
  })
  password!: string;
}
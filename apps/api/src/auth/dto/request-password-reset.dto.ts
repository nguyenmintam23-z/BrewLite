import { Matches } from 'class-validator';

export class RequestPasswordResetDto {
  @Matches(/^0[35789][0-9]{8}$/, {
    message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09',
  })
  phone!: string;
}
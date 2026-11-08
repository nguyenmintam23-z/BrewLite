import { Matches, MinLength, IsString } from 'class-validator';

export class CustomerLoginDto {
  @Matches(/^0\d{9}$/, {
    message: 'Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số',
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
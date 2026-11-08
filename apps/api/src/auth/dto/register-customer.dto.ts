import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/\S/, { message: 'Họ tên không được để trống' })
  displayName!: string;

  @Matches(/^0\d{9}$/, {
    message: 'Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số',
  })
  phone!: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Mật khẩu phải ít nhất 8 ký tự và có chữ hoa, chữ thường, số, ký tự đặc biệt',
  })
  password!: string;
}

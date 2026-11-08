import { IsIn, IsString, MinLength } from 'class-validator';

export class StaffLoginDto {
  @IsIn(['staff', 'manager'])
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
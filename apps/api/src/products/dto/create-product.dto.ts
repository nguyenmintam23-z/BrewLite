import {
  IsBoolean,
  IsInt,
  Max,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Matches(/^\d{1,8}(\.\d{1,2})?$/)
  price!: string;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  stockQuantity!: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

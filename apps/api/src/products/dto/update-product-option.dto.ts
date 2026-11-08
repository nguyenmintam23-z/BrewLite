import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ProductOptionType } from '../product-option.entity';

export class UpdateProductOptionDto {
  @IsOptional()
  @IsEnum(ProductOptionType)
  optionType?: ProductOptionType;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  @Matches(/\S/)
  name?: string;

  @IsOptional()
  @Matches(/^-?\d{1,8}(\.\d{1,2})?$/)
  priceAdjustment?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

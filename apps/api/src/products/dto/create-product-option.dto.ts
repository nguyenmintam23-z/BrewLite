import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ProductOptionType } from '../product-option.entity';

export class CreateProductOptionDto {
  @IsEnum(ProductOptionType)
  optionType!: ProductOptionType;

  @IsString()
  @Length(1, 60)
  @Matches(/\S/)
  name!: string;

  @Matches(/^-?\d{1,8}(\.\d{1,2})?$/)
  priceAdjustment!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

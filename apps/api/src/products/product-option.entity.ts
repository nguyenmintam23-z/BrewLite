import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum ProductOptionType {
  SIZE = 'SIZE',
  ICE_LEVEL = 'ICE_LEVEL',
  SUGAR_LEVEL = 'SUGAR_LEVEL',
  TOPPING = 'TOPPING',
}

@Entity({ name: 'product_options' })
export class ProductOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'option_type',
    type: 'enum',
    enum: ProductOptionType,
    enumName: 'product_option_type',
  })
  optionType!: ProductOptionType;

  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({
    name: 'price_adjustment',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  priceAdjustment!: string;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class ListManagerOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

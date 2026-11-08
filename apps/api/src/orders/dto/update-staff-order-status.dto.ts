import { IsIn } from 'class-validator';
import { OrderStatus } from '../order.entity';

const staffOrderStatusTargets = [
  OrderStatus.PREPARING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
] as const;

export class UpdateStaffOrderStatusDto {
  @IsIn(staffOrderStatusTargets, {
    message:
      'Nhân viên chỉ có thể chuyển đơn sang đang chuẩn bị, hoàn thành hoặc đã hủy',
  })
  status!: (typeof staffOrderStatusTargets)[number];
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { Order, OrderStatus } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async setMockResultForCustomer(
    paymentId: string,
    customerId: string,
    success: boolean,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: paymentId },
        relations: { order: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment) {
        throw new NotFoundException('Không tìm thấy thanh toán');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new ConflictException('Thanh toán này đã được xử lý');
      }

      const order = await manager.findOne(Order, {
        where: { id: payment.order.id, customer: { id: customerId } },
        relations: { customer: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('Không tìm thấy thanh toán');
      }

      payment.status = success
        ? PaymentStatus.SUCCEEDED
        : PaymentStatus.FAILED;

      await manager.save(payment);

      if (success) {
        if (order.status !== OrderStatus.PENDING_PAYMENT) {
          throw new ConflictException(
            'Không thể xác nhận thanh toán cho đơn ở trạng thái hiện tại',
          );
        }
        order.status = OrderStatus.CONFIRMED;
        await manager.save(order);
      }

      return {
        paymentId: payment.id,
        paymentStatus: payment.status,
        orderId: order.id,
        orderStatus: order.status,
      };
    });
  }
}
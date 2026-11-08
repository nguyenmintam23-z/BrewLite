import { randomUUID } from 'node:crypto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../payments/payment.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { ProductOption } from '../products/product-option.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductOption)
    private readonly optionRepo: Repository<ProductOption>,
  ) {}

  async cancel(id: string) {
    return this.cancelOrder(id);
  }

  async cancelForCustomer(id: string, customerId: string) {
    return this.cancelOrder(id, customerId);
  }

  private async cancelOrder(id: string, customerId?: string) {
    return this.dataSource.transaction(async (manager) => {
      if (customerId) {
        const ownedOrder = await manager.findOne(Order, {
          where: { id, customer: { id: customerId } },
        });
        if (!ownedOrder) {
          throw new NotFoundException('Không tìm thấy đơn hàng');
        }
      }

      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (
        order.status !== OrderStatus.PENDING_PAYMENT &&
        order.status !== OrderStatus.CONFIRMED
      ) {
        throw new ConflictException(
          'Chỉ có thể hủy đơn trước khi bắt đầu chuẩn bị',
        );
      }

      order.status = OrderStatus.CANCELLED;
      await manager.save(order);

      const pendingPayments = await manager.find(Payment, {
        where: {
          order: { id: order.id },
          status: PaymentStatus.PENDING,
        },
      });

      for (const payment of pendingPayments) {
        payment.status = PaymentStatus.FAILED;
        await manager.save(payment);
      }

      if (order.stockReserved) {
        const items = await manager.find(OrderItem, {
          where: { order: { id: order.id } },
          relations: { product: true },
        });
        for (const item of items) {
          const product = await manager.findOne(Product, {
            where: { id: item.product.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!product) {
            throw new NotFoundException(
              `Không tìm thấy đồ uống ${item.product.id} để hoàn tồn kho`,
            );
          }
          product.stockQuantity += item.quantity;
          await manager.save(product);
        }
        order.stockReserved = false;
        await manager.save(order);
      }

      return {
        orderId: order.id,
        orderStatus: order.status,
      };
    });
  }

  async findAllForManager(status?: OrderStatus) {
    const orders = await this.orderRepo.find({
      where: status ? { status } : {},
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });

    if (orders.length === 0) return [];

    const payments = await this.paymentRepo.find({
      where: { order: { id: In(orders.map((order) => order.id)) } },
      relations: { order: true },
      order: { createdAt: 'DESC' },
    });
    const latestPaymentStatus = new Map<string, PaymentStatus>();
    for (const payment of payments) {
      if (!latestPaymentStatus.has(payment.order.id)) {
        latestPaymentStatus.set(payment.order.id, payment.status);
      }
    }

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      paymentStatus: latestPaymentStatus.get(order.id) ?? null,
      customer: {
        id: order.customer.id,
        displayName: order.customer.displayName,
      },
    }));
  }

  async findAllForStaff(status?: OrderStatus) {
    const orders = await this.orderRepo.find({
      where: status
        ? { status }
        : {
            status: In([
              OrderStatus.PENDING_PAYMENT,
              OrderStatus.CONFIRMED,
              OrderStatus.PREPARING,
            ]),
          },
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });

    if (orders.length === 0) return [];

    const orderIds = orders.map((order) => order.id);
    const items = await this.orderItemRepo.find({
      where: { order: { id: In(orderIds) } },
      relations: { order: true, product: true },
    });
    const itemsByOrder = new Map<string, typeof items>();

    for (const item of items) {
      const currentItems = itemsByOrder.get(item.order.id) ?? [];
      currentItems.push(item);
      itemsByOrder.set(item.order.id, currentItems);
    }

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      customer: order.customer
        ? { displayName: order.customer.displayName }
        : null,
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions,
      })),
    }));
  }

  async getManagerSalesReport(from: string, to: string) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate.toISOString().slice(0, 10) !== from ||
      toDate.toISOString().slice(0, 10) !== to ||
      fromDate > toDate
    ) {
      throw new BadRequestException(
        'Khoảng thời gian không hợp lệ; ngày bắt đầu không được sau ngày kết thúc',
      );
    }

    const untilDate = new Date(toDate);
    untilDate.setUTCDate(untilDate.getUTCDate() + 1);
    const [report] = await this.dataSource.query(
      `SELECT
        COUNT(*) AS "totalOrderCount",
        COUNT(*) FILTER (WHERE latest_payment.status = $3) AS "paidOrderCount",
        COALESCE(
          SUM(order_record."totalAmount") FILTER (
            WHERE latest_payment.status = $3
          ),
          0
        ) AS revenue,
        COUNT(*) FILTER (
          WHERE latest_payment.status = $4
        ) AS "pendingPaymentOrderCount",
        COUNT(*) FILTER (
          WHERE latest_payment.status = $5
        ) AS "failedPaymentOrderCount",
        COUNT(*) FILTER (
          WHERE latest_payment.status IS NULL
        ) AS "unpaidOrderCount"
      FROM orders order_record
      LEFT JOIN LATERAL (
        SELECT payment.status
        FROM payments payment
        WHERE payment.order_id = order_record.id
        ORDER BY payment.created_at DESC
        LIMIT 1
      ) latest_payment ON TRUE
      WHERE order_record.created_at >= $1
        AND order_record.created_at < $2`,
      [
        fromDate,
        untilDate,
        PaymentStatus.SUCCEEDED,
        PaymentStatus.PENDING,
        PaymentStatus.FAILED,
      ],
    );

    return {
      from,
      to,
      revenue: String(report.revenue),
      totalOrderCount: Number(report.totalOrderCount),
      paidOrderCount: Number(report.paidOrderCount),
      pendingPaymentOrderCount: Number(report.pendingPaymentOrderCount),
      failedPaymentOrderCount: Number(report.failedPaymentOrderCount),
      unpaidOrderCount: Number(report.unpaidOrderCount),
    };
  }

  async updateStatus(id: string, status: OrderStatus) {
    if (status === OrderStatus.CANCELLED) {
      return this.cancel(id);
    }

    return this.transitionOrderStatus(id, status, false);
  }

  async updateStaffStatus(
    id: string,
    status:
      OrderStatus.PREPARING | OrderStatus.COMPLETED | OrderStatus.CANCELLED,
  ) {
    if (status === OrderStatus.CANCELLED) {
      return this.cancel(id);
    }

    return this.transitionOrderStatus(id, status, true);
  }

  private async transitionOrderStatus(
    id: string,
    status: OrderStatus,
    requireSuccessfulPayment: boolean,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      const allowedNextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
        [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
        [OrderStatus.PREPARING]: OrderStatus.COMPLETED,
      };

      if (allowedNextStatus[order.status] !== status) {
        throw new ConflictException('Trạng thái đơn hàng không hợp lệ');
      }

      if (requireSuccessfulPayment && status === OrderStatus.PREPARING) {
        const successfulPayment = await manager.findOne(Payment, {
          where: {
            order: { id: order.id },
            status: PaymentStatus.SUCCEEDED,
          },
        });
        if (!successfulPayment) {
          throw new ConflictException(
            'Chỉ có thể chuẩn bị đơn đã thanh toán thành công',
          );
        }
      }

      order.status = status;
      await manager.save(order);

      return {
        orderId: order.id,
        orderStatus: order.status,
      };
    });
  }
  async findByCustomer(customerId: string) {
    const orders = await this.orderRepo.find({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' },
    });

    if (orders.length === 0) return [];

    const orderIds = orders.map((order) => order.id);
    const [items, payments] = await Promise.all([
      this.orderItemRepo.find({
        where: { order: { id: In(orderIds) } },
        relations: { order: true, product: true },
      }),
      this.paymentRepo.find({
        where: { order: { id: In(orderIds) } },
        relations: { order: true },
        order: { createdAt: 'DESC' },
      }),
    ]);
    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items) {
      const currentItems = itemsByOrder.get(item.order.id) ?? [];
      currentItems.push(item);
      itemsByOrder.set(item.order.id, currentItems);
    }
    const latestPaymentByOrder = new Map<string, Payment>();
    for (const payment of payments) {
      if (!latestPaymentByOrder.has(payment.order.id)) {
        latestPaymentByOrder.set(payment.order.id, payment);
      }
    }

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions,
      })),
      paymentStatus: latestPaymentByOrder.get(order.id)?.status ?? null,
    }));
  }
  async findOne(id: string) {
    const order = await this.orderRepo.findOneBy({ id });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return this.findOrderDetails(order, false);
  }

  async findOneForStaff(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { customer: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return this.findOrderDetails(order, true);
  }

  async findOneForCustomer(id: string, customerId: string) {
    const order = await this.orderRepo.findOne({
      where: { id, customer: { id: customerId } },
      relations: { customer: true },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return this.findOrderDetails(order, true);
  }

  private async findOrderDetails(order: Order, includeCustomer: boolean) {
    const id = order.id;
    const items = await this.orderItemRepo.find({
      where: { order: { id } },
      relations: { product: true },
    });

    const payments = await this.paymentRepo.find({
      where: { order: { id } },
      order: { createdAt: 'DESC' },
    });

    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      ...(includeCustomer
        ? {
            customer: order.customer
              ? { displayName: order.customer.displayName }
              : null,
          }
        : {}),
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
      })),
    };
  }

  async create(dto: CreateOrderDto, customerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const customer = await manager.findOne(User, {
        where: {
          id: customerId,
          role: UserRole.CUSTOMER,
          isActive: true,
        },
      });
      if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');

      const order = manager.create(Order, {
        customer,
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount: '0',
        stockReserved: true,
      });
      await manager.save(order);

      let totalCents = 0;

      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId, isAvailable: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(
            `Không tìm thấy đồ uống ${itemDto.productId}`,
          );
        }
        if (itemDto.quantity > product.stockQuantity) {
          throw new BadRequestException(
            `Không đủ tồn kho cho đồ uống ${product.name}`,
          );
        }

        const optionIds = itemDto.optionIds ?? [];
        const options = optionIds.length
          ? await manager.find(ProductOption, {
              where: {
                id: In(optionIds),
                product: { id: product.id },
                isAvailable: true,
              },
            })
          : [];

        if (options.length !== optionIds.length) {
          throw new BadRequestException(
            'Có tùy chọn không hợp lệ hoặc không thuộc đồ uống này',
          );
        }

        const unitPriceCents =
          Math.round(Number(product.price) * 100) +
          options.reduce(
            (sum, option) =>
              sum + Math.round(Number(option.priceAdjustment) * 100),
            0,
          );
        if (unitPriceCents < 0) {
          throw new BadRequestException(
            `Giá sau tùy chọn của ${product.name} không hợp lệ`,
          );
        }

        totalCents += unitPriceCents * itemDto.quantity;
        product.stockQuantity -= itemDto.quantity;
        await manager.save(product);

        const selectedOptions: Record<string, string | string[]> = {};
        for (const option of options) {
          const current = selectedOptions[option.optionType];
          if (current === undefined) {
            selectedOptions[option.optionType] = option.name;
          } else if (Array.isArray(current)) {
            current.push(option.name);
          } else {
            selectedOptions[option.optionType] = [current, option.name];
          }
        }

        const orderItem = manager.create(OrderItem, {
          order,
          product,
          quantity: itemDto.quantity,
          unitPrice: (unitPriceCents / 100).toFixed(2),
          selectedOptions,
        });
        await manager.save(orderItem);
      }

      order.totalAmount = (totalCents / 100).toFixed(2);
      await manager.save(order);

      const payment = manager.create(Payment, {
        order,
        method: dto.paymentMethod ?? PaymentMethod.CARD,
        amount: order.totalAmount,
        status: PaymentStatus.PENDING,
        idempotencyKey: randomUUID(),
      });
      await manager.save(payment);

      return {
        orderId: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        items: dto.items,
        paymentId: payment.id,
        paymentStatus: payment.status,
      };
    });
  }
}

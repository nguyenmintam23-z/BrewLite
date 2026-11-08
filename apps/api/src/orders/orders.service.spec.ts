import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { ProductOption } from '../products/product-option.entity';
import { User } from '../users/user.entity';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrdersService } from './orders.service';

describe('OrdersService management', () => {
  let service: OrdersService;
  let transactionManager: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let orderRepository: { find: jest.Mock; findOne: jest.Mock };
  let orderItemRepository: { find: jest.Mock };
  let paymentRepository: { find: jest.Mock };
  let dataSource: { transaction: jest.Mock; query: jest.Mock };

  beforeEach(() => {
    transactionManager = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity: unknown) => Promise.resolve(entity)),
    };
    orderRepository = { find: jest.fn(), findOne: jest.fn() };
    orderItemRepository = { find: jest.fn().mockResolvedValue([]) };
    paymentRepository = { find: jest.fn().mockResolvedValue([]) };
    dataSource = {
      transaction: (
        callback: (manager: typeof transactionManager) => unknown,
      ) => callback(transactionManager),
      query: jest.fn(),
    } as unknown as { transaction: jest.Mock; query: jest.Mock };

    service = new OrdersService(
      dataSource as unknown as DataSource,
      orderRepository as unknown as Repository<Order>,
      orderItemRepository as unknown as Repository<OrderItem>,
      paymentRepository as unknown as Repository<Payment>,
      {} as Repository<Product>,
      {} as Repository<ProductOption>,
    );
  });

  it('filters manager order lists and excludes password data', async () => {
    const order = {
      id: 'order-id',
      status: OrderStatus.CONFIRMED,
      totalAmount: '12.00',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      customer: {
        id: 'customer-id',
        displayName: 'Customer',
        passwordHash: 'never return this',
      },
    };
    orderRepository.find.mockResolvedValue([order]);

    await expect(
      service.findAllForManager(OrderStatus.CONFIRMED),
    ).resolves.toEqual([
      {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        paymentStatus: null,
        customer: { id: 'customer-id', displayName: 'Customer' },
      },
    ]);
    expect(orderRepository.find).toHaveBeenCalledWith({
      where: { status: OrderStatus.CONFIRMED },
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('returns the latest payment status for each manager order', async () => {
    const order = {
      id: 'order-id',
      status: OrderStatus.CONFIRMED,
      totalAmount: '12.00',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      customer: { id: 'customer-id', displayName: 'Customer' },
    };
    orderRepository.find.mockResolvedValue([order]);
    paymentRepository.find.mockResolvedValue([
      {
        order: { id: order.id },
        status: PaymentStatus.SUCCEEDED,
      },
    ]);

    await expect(service.findAllForManager()).resolves.toEqual([
      {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        paymentStatus: PaymentStatus.SUCCEEDED,
        customer: { id: 'customer-id', displayName: 'Customer' },
      },
    ]);
  });

  it('lists staff orders with items while exposing only the customer display name', async () => {
    const order = {
      id: 'order-id',
      status: OrderStatus.CONFIRMED,
      totalAmount: '12.00',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      customer: {
        displayName: 'Customer',
        passwordHash: 'never return this',
      },
    };
    orderRepository.find.mockResolvedValue([order]);
    orderItemRepository.find.mockResolvedValue([
      {
        order: { id: order.id },
        product: { id: 'product-id', name: 'Tea', price: '12.00' },
        quantity: 2,
        unitPrice: '6.00',
        selectedOptions: { SIZE: 'Large', TOPPING: ['Pearl'] },
      },
    ]);

    await expect(service.findAllForStaff()).resolves.toEqual([
      {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        customer: { displayName: 'Customer' },
        items: [
          {
            productId: 'product-id',
            productName: 'Tea',
            quantity: 2,
            unitPrice: '6.00',
            selectedOptions: { SIZE: 'Large', TOPPING: ['Pearl'] },
          },
        ],
      },
    ]);
    expect(orderRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { customer: true },
        order: { createdAt: 'DESC' },
      }),
    );
    expect(orderItemRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { order: true, product: true },
      }),
    );
  });

  it('includes payment attempts and only safe customer data in staff order details', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: 'order-id',
      status: OrderStatus.CONFIRMED,
      totalAmount: '12.00',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      customer: {
        displayName: 'Customer',
        passwordHash: 'never return this',
      },
    });
    orderItemRepository.find.mockResolvedValue([]);
    paymentRepository.find.mockResolvedValue([
      {
        id: 'payment-id',
        method: 'CARD',
        status: PaymentStatus.SUCCEEDED,
        amount: '12.00',
        createdAt: new Date('2026-01-01T00:01:00.000Z'),
        idempotencyKey: 'sensitive-payment-key',
      },
    ]);

    const result = await service.findOneForStaff('order-id');
    expect(result).toMatchObject({
      id: 'order-id',
      customer: { displayName: 'Customer' },
      items: [],
      payments: [
        {
          id: 'payment-id',
          status: PaymentStatus.SUCCEEDED,
          amount: '12.00',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('idempotencyKey');
    expect(orderRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      relations: { customer: true },
    });
  });

  it('counts orders using successful payment records and excludes unpaid values from revenue', async () => {
    dataSource.query.mockResolvedValue([
      {
        revenue: '125.00',
        totalOrderCount: '4',
        paidOrderCount: '1',
        pendingPaymentOrderCount: '1',
        failedPaymentOrderCount: '1',
        unpaidOrderCount: '1',
      },
    ]);

    await expect(
      service.getManagerSalesReport('2026-05-01', '2026-05-31'),
    ).resolves.toEqual({
      from: '2026-05-01',
      to: '2026-05-31',
      revenue: '125.00',
      totalOrderCount: 4,
      paidOrderCount: 1,
      pendingPaymentOrderCount: 1,
      failedPaymentOrderCount: 1,
      unpaidOrderCount: 1,
    });
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('latest_payment.status = $3'),
      [
        new Date('2026-05-01T00:00:00.000Z'),
        new Date('2026-06-01T00:00:00.000Z'),
        PaymentStatus.SUCCEEDED,
        PaymentStatus.PENDING,
        PaymentStatus.FAILED,
      ],
    );
  });

  it('rejects invalid sales report date ranges', async () => {
    await expect(
      service.getManagerSalesReport('2026-05-02', '2026-05-01'),
    ).rejects.toThrow('Khoảng thời gian không hợp lệ');
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it.each([
    [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
    [OrderStatus.PREPARING, OrderStatus.COMPLETED],
  ])('moves %s to %s', async (currentStatus, nextStatus) => {
    const order = { id: 'order-id', status: currentStatus } as Order;
    transactionManager.findOne.mockResolvedValue(order);

    await expect(service.updateStatus(order.id, nextStatus)).resolves.toEqual({
      orderId: order.id,
      orderStatus: nextStatus,
    });
    expect(order.status).toBe(nextStatus);
  });

  it('requires a successful payment before staff starts preparing an order', async () => {
    const order = { id: 'order-id', status: OrderStatus.CONFIRMED } as Order;
    transactionManager.findOne
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(null);

    await expect(
      service.updateStaffStatus(order.id, OrderStatus.PREPARING),
    ).rejects.toThrow('Chỉ có thể chuẩn bị đơn đã thanh toán thành công');
    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('allows staff to prepare a confirmed order with a successful payment', async () => {
    const order = { id: 'order-id', status: OrderStatus.CONFIRMED } as Order;
    transactionManager.findOne
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ status: PaymentStatus.SUCCEEDED });

    await expect(
      service.updateStaffStatus(order.id, OrderStatus.PREPARING),
    ).resolves.toEqual({
      orderId: order.id,
      orderStatus: OrderStatus.PREPARING,
    });
    expect(order.status).toBe(OrderStatus.PREPARING);
  });

  it('does not allow staff to update a cancelled order', async () => {
    const order = { id: 'order-id', status: OrderStatus.CANCELLED } as Order;
    transactionManager.findOne.mockResolvedValue(order);

    await expect(
      service.updateStaffStatus(order.id, OrderStatus.COMPLETED),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(order.status).toBe(OrderStatus.CANCELLED);
  });

  it('returns a not-found error when staff updates an unknown order', async () => {
    transactionManager.findOne.mockResolvedValue(null);

    await expect(
      service.updateStaffStatus('missing-order-id', OrderStatus.PREPARING),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects transitions outside the order workflow', async () => {
    const order = {
      id: 'order-id',
      status: OrderStatus.PENDING_PAYMENT,
    } as Order;
    transactionManager.findOne.mockResolvedValue(order);

    await expect(
      service.updateStatus(order.id, OrderStatus.PREPARING),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
  });

  it('cancels a confirmed order without changing a successful payment', async () => {
    const order = { id: 'order-id', status: OrderStatus.CONFIRMED } as Order;
    transactionManager.findOne.mockResolvedValue(order);

    await expect(
      service.updateStatus(order.id, OrderStatus.CANCELLED),
    ).resolves.toEqual({
      orderId: order.id,
      orderStatus: OrderStatus.CANCELLED,
    });
    expect(transactionManager.find).toHaveBeenCalledWith(Payment, {
      where: {
        order: { id: order.id },
        status: PaymentStatus.PENDING,
      },
    });
  });
});

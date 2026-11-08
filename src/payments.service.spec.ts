import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  PaymentAttempt,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment-attempt.entity.js';
import { PaymentMockGateway } from './payment-mock-gateway.service.js';
import { CreatePaymentRequest, PaymentsService } from './payments.service.js';
import { ServiceUnavailableException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let gateway: Pick<PaymentMockGateway, 'process'>;
  const records = new Map<string, PaymentAttempt>();
  const repository = {
    create: (input: Partial<PaymentAttempt>) =>
      Object.assign(new PaymentAttempt(), input),
    findOne: async ({
      where,
    }: {
      where: Partial<PaymentAttempt>;
    }): Promise<PaymentAttempt | null> => {
      return records.get(where.idempotencyKey ?? '') ?? null;
    },
    save: async (payment: PaymentAttempt): Promise<PaymentAttempt> => {
      payment.id ??= `payment-${records.size + 1}`;
      records.set(payment.idempotencyKey, payment);
      return payment;
    },
  };

  const request: CreatePaymentRequest = {
    orderId: 'order-123',
    amount: 12500,
    method: PaymentMethod.WALLET,
    idempotencyKey: 'checkout-123',
  };

  beforeEach(() => {
    records.clear();
    gateway = {
      process: vi.fn().mockResolvedValue({
        status: PaymentStatus.SUCCEEDED,
        transactionRef: 'mock-transaction',
      }),
    };
    service = new PaymentsService(
      repository as Repository<PaymentAttempt>,
      gateway as PaymentMockGateway,
    );
  });

  it('replays the saved result for the same key and request', async () => {
    const first = await service.createPayment(request);
    const replay = await service.createPayment(request);

    expect(replay).toEqual(first);
    expect(records.size).toBe(1);
    expect(gateway.process).toHaveBeenCalledTimes(1);
  });

  it('rejects reusing a key with different payment details', async () => {
    await service.createPayment(request);

    await expect(
      service.createPayment({ ...request, amount: 15000 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(gateway.process).toHaveBeenCalledTimes(1);
  });

  it('stores a new attempt when retrying with a new key', async () => {
    gateway.process = vi
      .fn()
      .mockResolvedValueOnce({
        status: PaymentStatus.FAILED,
        transactionRef: null,
      })
      .mockResolvedValueOnce({
        status: PaymentStatus.SUCCEEDED,
        transactionRef: 'mock-retry',
      });

    const failed = await service.createPayment(request);
    const succeeded = await service.createPayment({
      ...request,
      idempotencyKey: 'checkout-124',
    });

    expect(failed.status).toBe(PaymentStatus.FAILED);
    expect(succeeded.status).toBe(PaymentStatus.SUCCEEDED);
    expect(records.size).toBe(2);
  });

  it('keeps a pending attempt when the gateway is unavailable for retry', async () => {
    gateway.process = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary gateway failure'))
      .mockResolvedValueOnce({
        status: PaymentStatus.SUCCEEDED,
        transactionRef: 'mock-retry',
      });

    await expect(service.createPayment(request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(records.size).toBe(1);
    expect(records.get(request.idempotencyKey)?.status).toBe(
      PaymentStatus.PENDING,
    );

    const retried = await service.createPayment(request);
    expect(retried.status).toBe(PaymentStatus.SUCCEEDED);
    expect(records.size).toBe(1);
  });
});

import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaymentAttempt,
  PaymentStatus,
} from './entities/payment-attempt.entity.js';
import {
  MockPaymentRequest,
  PaymentMockGateway,
} from './payment-mock-gateway.service.js';

export interface CreatePaymentRequest extends MockPaymentRequest {}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentAttempt)
    private readonly paymentRepository: Repository<PaymentAttempt>,
    private readonly paymentGateway: PaymentMockGateway,
  ) {}

  async createPayment(request: CreatePaymentRequest): Promise<PaymentAttempt> {
    const requestFingerprint = this.fingerprint(request);
    let payment = await this.paymentRepository.findOne({
      where: { idempotencyKey: request.idempotencyKey },
    });

    if (payment) {
      this.ensureSameRequest(payment, requestFingerprint);
      if (payment.status !== PaymentStatus.PENDING) {
        return payment;
      }
    } else {
      payment = this.paymentRepository.create({
        ...request,
        requestFingerprint,
        status: PaymentStatus.PENDING,
        transactionRef: null,
      });

      try {
        payment = await this.paymentRepository.save(payment);
      } catch (error: unknown) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }

        const existing = await this.paymentRepository.findOne({
          where: { idempotencyKey: request.idempotencyKey },
        });
        if (!existing) {
          throw error;
        }
        this.ensureSameRequest(existing, requestFingerprint);
        if (existing.status !== PaymentStatus.PENDING) {
          return existing;
        }
        payment = existing;
      }
    }

    let result;
    try {
      result = await this.paymentGateway.process(request);
    } catch (error: unknown) {
      throw new ServiceUnavailableException(
        'Payment result is not available; retry with the same idempotency key',
        { cause: error },
      );
    }

    payment.status = result.status;
    payment.transactionRef = result.transactionRef;
    return this.paymentRepository.save(payment);
  }

  private fingerprint(request: CreatePaymentRequest): string {
    return createHash('sha256')
      .update(
        JSON.stringify([
          request.orderId,
          request.amount,
          request.method,
        ]),
      )
      .digest('hex');
  }

  private ensureSameRequest(
    payment: PaymentAttempt,
    requestFingerprint: string,
  ): void {
    if (payment.requestFingerprint !== requestFingerprint) {
      throw new ConflictException(
        'Idempotency key was already used with different payment details',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;
    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === '23505'
    );
  }
}

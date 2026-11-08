import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PaymentMethod, PaymentStatus } from './entities/payment-attempt.entity.js';

export interface MockPaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  idempotencyKey: string;
}

export interface MockPaymentResult {
  status: PaymentStatus.SUCCEEDED | PaymentStatus.FAILED;
  transactionRef: string | null;
}

@Injectable()
export class PaymentMockGateway {
  async process(request: MockPaymentRequest): Promise<MockPaymentResult> {
    const outcome = process.env.PAYMENT_MOCK_RESULT ?? 'SUCCEEDED';

    if (outcome === 'FAILED') {
      return { status: PaymentStatus.FAILED, transactionRef: null };
    }

    if (outcome !== 'SUCCEEDED') {
      throw new InternalServerErrorException(
        'PAYMENT_MOCK_RESULT must be SUCCEEDED or FAILED',
      );
    }

    return {
      status: PaymentStatus.SUCCEEDED,
      transactionRef: `mock_${createHash('sha256')
        .update(request.idempotencyKey)
        .digest('hex')
        .slice(0, 32)}`,
    };
  }
}

import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PaymentMethod } from './entities/payment-attempt.entity.js';
import { CreatePaymentRequest, PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  createPayment(@Body() body: unknown) {
    return this.paymentsService.createPayment(this.validateRequest(body));
  }

  private validateRequest(body: unknown): CreatePaymentRequest {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestException('Request body must be an object');
    }

    const input = body as Record<string, unknown>;
    if (
      typeof input.orderId !== 'string' ||
      input.orderId.trim().length === 0 ||
      input.orderId.length > 64
    ) {
      throw new BadRequestException('orderId must be a non-empty string');
    }
    if (
      typeof input.amount !== 'number' ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new BadRequestException('amount must be a positive number');
    }
    if (
      input.method !== PaymentMethod.WALLET &&
      input.method !== PaymentMethod.CARD
    ) {
      throw new BadRequestException('method must be WALLET or CARD');
    }
    if (
      typeof input.idempotencyKey !== 'string' ||
      input.idempotencyKey.trim().length === 0 ||
      input.idempotencyKey.length > 128
    ) {
      throw new BadRequestException(
        'idempotencyKey must be a non-empty string of at most 128 characters',
      );
    }

    return {
      orderId: input.orderId,
      amount: input.amount,
      method: input.method,
      idempotencyKey: input.idempotencyKey,
    };
  }
}

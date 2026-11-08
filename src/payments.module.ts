import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAttempt } from './entities/payment-attempt.entity.js';
import { PaymentMockGateway } from './payment-mock-gateway.service.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentAttempt])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentMockGateway],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { PaymentService } from './paymant.service';
import { PaymentController } from './paymant.controller';
import { PaymentWebhookController } from './payment.webhook';

@Module({
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

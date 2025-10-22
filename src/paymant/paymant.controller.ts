import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './paymant.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { userId: { type: 'string' }, amount: { type: 'number' } },
    },
  })
  createPayment(@Body() body: { userId: string; amount: number }) {
    return this.paymentService.createPayment(body.userId, body.amount);
  }

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        paymentStatus: { type: 'string' },
      },
    },
  })
  confirmPayment(@Body() body: { userId: string; paymentStatus: string }) {
    return this.paymentService.confirmPayment(body.userId, body.paymentStatus);
  }
}

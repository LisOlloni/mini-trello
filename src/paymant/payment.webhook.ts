// src/paymant/payment.webhook.ts
import { Controller, Post, Req, Res } from '@nestjs/common';
import { PaymentService } from './paymant.service';
import type { Request, Response } from 'express';

@Controller('payments')
export class PaymentWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const body = req.body as {
        orderid?: string;
        status?: string;
      };

      if (!body.orderid || !body.status) {
        return res.status(400).send('Invalid payload');
      }

      await this.paymentService.confirmPayment(body.orderid, body.status);
      return res.status(200).send('OK');
    } catch (err) {
      console.error('❌ Webhook error:', err);
      return res.status(500).send('Internal server error');
    }
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(userId: string, amount: number) {
    const projectId = process.env.PAYSERA_PROJECT_ID!;
    const password = process.env.PAYSERA_PASSWORD!;
    const currency = 'EUR';
    const orderId = crypto.randomUUID();

    const data = new URLSearchParams({
      projectId: projectId,
      orderId: orderId,
      amount: (amount * 100).toString(),
      currency,
      accepturl: `${process.env.API_URL}/payments/success`,
      cancelurl: `${process.env.API_URL}/payments/cancel`,
      callbackurl: `${process.env.API_URL}/payments/webhook`,
      test: '1',
    });

    const sign = crypto
      .createHash('md5')
      .update(data.toString() + password)
      .digest('hex');

    await this.prisma.subscription.create({
      data: {
        userId,
        amount,
        currency,
        providerId: orderId,
        status: 'PENDING',
      },
    });

    const payseraUrl = `https://www.paysera.com/pay?${data.toString()}&sign=${sign}`;

    return { url: payseraUrl };
  }

  async confirmPayment(providerId: string, status: string) {
    const transaction = await this.prisma.subscription.findUnique({
      where: { providerId },
    });

    if (!transaction) {
      throw new ForbiddenException('Transaction not found');
    }

    if (status !== 'SUCCESS') {
      await this.prisma.subscription.update({
        where: { providerId },
        data: { status: 'FAILED' },
      });
      throw new ForbiddenException('Payment failed');
    }

    await this.prisma.subscription.update({
      where: { providerId },
      data: { status: 'SUCCESS' },
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.prisma.paymentTransaction.upsert({
      where: { userId: transaction.id },
      update: { plan: 'PREMIUM', expiresAt },
      create: { userId: transaction.id, plan: 'PREMIUM', expiresAt },
    });
    return { success: true };
  }

  async checkLimits(userId: string) {
    const sub = await this.prisma.paymentTransaction.findUnique({
      where: { id: userId },
    });

    return sub?.plan === 'PREMIUM';
  }
}

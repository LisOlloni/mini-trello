import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    taskId: string,
    type: string,
    message: string,
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data: { userId, taskId, type, message },
    });
  }
}

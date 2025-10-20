import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notification } from '@prisma/client';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationGateway,
  ) {}

  async notify(
    userId: string,
    taskId: string | null,
    type: string,
    message: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: { userId, taskId: taskId ?? undefined, type, message },
    });
    this.gateway.notifyUser(userId, {
      id: notification.id,
      type,
      message,
      taskId: taskId ?? undefined,
      createdAt: notification.createdAt,
      read: notification.read,
    });
    return notification;
  }
}

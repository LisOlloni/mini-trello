import { Controller, Get, Patch, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('notifications')
export class NotificationController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listNotifications(
    @Query('userId') userId: string,
    @Query('after') after?: string,
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Patch('read')
  async markRead(@Query('userId') userId: string, @Query('ids') ids: string) {
    const idList = ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await this.prisma.notification.updateMany({
      where: { userId, id: { in: idList } },
      data: { read: true },
    });
    return { updated: idList.length };
  }
}

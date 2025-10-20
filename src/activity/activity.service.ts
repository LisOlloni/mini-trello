import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async logActivity(projectId: string, userId: string, action: string) {
    await this.prisma.activityLong.create({
      data: {
        projectId,
        userId,
        action,
      },
    });
  }

  async getActivitiesByProject(projectId: string) {
    await this.prisma.activityLong.findMany({
      where: { projectId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

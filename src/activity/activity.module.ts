import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityController } from './activity.controller';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, PrismaService],
  exports: [ActivityService],
})
export class ActivityModule {}

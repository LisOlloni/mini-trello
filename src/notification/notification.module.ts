import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { NotificationModule } from 'src/notification/notification.module';
import { StorageModule } from 'src/attachments/storage.module';
import { PaymentService } from 'src/paymant/paymant.service';

@Module({
  imports: [
    NotificationModule,
    StorageModule,
    JwtModule.register({
      secret: process.env.AT_SECRET || 'defaultATSecret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [TaskController],
  providers: [TaskService, PrismaService, JwtAuthGuard, PaymentService],
  exports: [TaskService],
})
export class TaskModule {}

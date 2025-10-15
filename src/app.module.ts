import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TaskModule } from './task/task.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ProjectsModule,
    TaskModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

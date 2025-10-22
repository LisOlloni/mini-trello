import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PaymentService } from 'src/paymant/paymant.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectController],
  providers: [ProjectService, PaymentService],
})
export class ProjectsModule {}

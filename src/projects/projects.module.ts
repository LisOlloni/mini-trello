import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectsModule {}

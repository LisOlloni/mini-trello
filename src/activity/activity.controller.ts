import { ActivityService } from './activity.service';
import { Controller, Get, Param } from '@nestjs/common';

@Controller()
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get(':projectId')
  async getActivities(@Param('projectId') projectId: string) {
    return await this.activityService.getActivitiesByProject(projectId);
  }
}

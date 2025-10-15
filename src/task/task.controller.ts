import {
  Controller,
  Body,
  Param,
  Req,
  UseGuards,
  Post,
  Delete,
  Get,
  Put,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskDto } from './dto/task.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

interface AuthRequest {
  user: { id: string };
}

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: TaskDto,
    @Req() req: AuthRequest,
  ) {
    const assigneeID = req.user.id;
    return this.taskService.createTask(assigneeID, projectId, dto);
  }

  @Put(':taskId')
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: TaskDto,
    @Req() req: AuthRequest,
  ) {
    const assigneeID = req.user.id;
    return this.taskService.updateTask(assigneeID, projectId, taskId, dto);
  }

  @Delete(':taskId')
  async deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.id;
    return this.taskService.deleteTask(userId, projectId, taskId);
  }

  @Get()
  async getAllTasks(
    @Param('projectId') projectId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.id;
    return this.taskService.getAllTasks(projectId, userId);
  }
}

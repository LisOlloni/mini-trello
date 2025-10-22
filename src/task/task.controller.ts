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
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskDto } from './dto/task.dto';
import { CreateTaskDto } from './dto/createTask.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import type { JwtRequest } from 'src/auth/strategies/jwt.request';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TaskFilter } from './dto/task-filter.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: JwtRequest,
  ) {
    const userId = req.user.sub;
    return this.taskService.createTask(userId, projectId, dto);
  }

  @Put(':taskId')
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: TaskDto,
    @Req() req: JwtRequest,
  ) {
    const userId = req.user.sub;
    return this.taskService.updateTask(userId, taskId, dto);
  }

  @Delete(':taskId')
  async deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Req() req: JwtRequest,
  ) {
    const userId = req.user.sub;
    return this.taskService.deleteTask(userId, taskId);
  }

  @Get()
  async getAllTasks(
    @Param('projectId') projectId: string,
    @Req() req: JwtRequest,
  ) {
    const userId = req.user.sub;
    return this.taskService.getAllTasks(projectId, userId);
  }
  @Post(':taskId/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload file to a task' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadTaskFile(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,

    @Req() req: JwtRequest,
  ) {
    const userId = req.user.sub;
    return await this.taskService.uploadTasks(userId, projectId, taskId, file);
  }

  @Get('filter')
  @ApiQuery({ name: 'assigneeID', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'dueDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  filterTasks(@Query() filter: TaskFilter, @Req() req: JwtRequest) {
    const userId = req.user.sub;
    return this.taskService.filterTask(userId, filter);
  }
}

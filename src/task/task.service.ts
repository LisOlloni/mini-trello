import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskDto } from './dto/task.dto';
import { NotificationService } from 'src/notification/notification.service';

interface Membership {
  userId: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
}

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createTask(assigneeID: string, projectId: string, dto: TaskDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new ForbiddenException('Project not available');
    if (project.ownerId !== assigneeID)
      throw new ForbiddenException('Not allowed');

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        assignee: { connect: { id: assigneeID } },
        project: { connect: { id: projectId } },
      },
    });

    return task;
  }

  async updateTask(
    assigneeID: string,
    projectId: string,
    taskId: string,
    dto: TaskDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },

      include: { project: { include: { members: true } } },
    });
    if (!task) throw new ForbiddenException('Task not found');

    const membership: Membership | undefined = task?.project?.members?.find(
      (m: Membership) => m.userId === assigneeID,
    );

    if (
      !membership ||
      (membership.role !== 'ADMIN' && membership.role !== 'MANAGER')
    ) {
      throw new ForbiddenException('No permission to update this task');
    }

    const oldData = { title: task.title, description: task.description };

    // const project = await this.prisma.project.findUnique({
    //   where: { id: projectId },
    // });
    // if (!project) throw new ForbiddenException('Project not found');

    // if ((dto.title || dto.description) && assigneeID !== project.ownerId) {
    //   return this.notificationService.createNotification(
    //     project.ownerId,
    //     task.id,
    //     'TASK_UPDATE',
    //     `Task "${task.title}" u përditësua nga një anëtar i projektit.`,
    //   );
    // }

    const updateTask = this.prisma.task.update({
      where: { id: taskId },
      data: { title: dto.title, description: dto.description },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: taskId,
        oldData,

        userId: assigneeID,
      },
    });

    return updateTask;
  }

  async deleteTask(userId: string, projectId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    });
    if (!task) {
      throw new ForbiddenException('Task not found in this project');
    }

    const membership = task.project.members.find((m) => m.userId === userId);
    if (!membership || membership.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete tasks');
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'TASK',
        entityId: taskId,
        oldData: {
          title: task.title,
          description: task.description,
          status: task.status,
        },
        userId,
      },
    });
    return this.prisma.task.delete({ where: { id: task.id } });
  }

  async getAllTasks(projectID: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectID },
    });
    if (!project) throw new ForbiddenException('Project not available');
    if (project.ownerId !== userId) throw new ForbiddenException('Not allowed');

    return this.prisma.task.findMany({ where: { projectId: projectID } });
  }

  async uploadTasks(
    userId: string,
    projectId: string,
    taskId: string,
    fileName: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new ForbiddenException('Project not available');

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== project.id)
      throw new ForbiddenException('Task not part of this project');
    if (task.assigneeID !== userId && project.ownerId !== userId)
      throw new ForbiddenException('Not allowed');

    return this.prisma.task.update({
      where: { id: taskId },
      data: { attachment: `uploads/tasks/${fileName}` },
    });
  }
}

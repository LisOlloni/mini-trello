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

    // Notify project owner only if title or description changed
    const titleChanged = dto.title !== task.title;
    const descChanged = dto.description !== task.description;
    if ((titleChanged || descChanged) && task.project?.ownerId) {
      const changeParts: string[] = [];
      if (titleChanged) changeParts.push('title');
      if (descChanged) changeParts.push('description');
      const changed = changeParts.join(' & ');
      await this.notificationService.notify(
        task.project.ownerId,
        taskId,
        'TASK_UPDATE',
        `Task "${dto.title}" ${changed} updated by ${assigneeID}.`,
      );
    }

    return updateTask;
  }

  async deleteTask(userId: string, taskId: string) {
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
    await this.prisma.task.delete({ where: { id: task.id } });

    // Notify the assignee if someone worked on that task
    if (task.assigneeID) {
      await this.notificationService.notify(
        task.assigneeID,
        taskId,
        'TASK_DELETE',
        `Task "${task.title}" was deleted by ${userId}.`,
      );
    }
    return { message: 'Task deleted and notifications sent' };
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

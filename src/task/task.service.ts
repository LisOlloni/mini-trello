import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskDto } from './dto/task.dto';
import { CreateTaskDto } from './dto/createTask.dto';
import { NotificationService } from 'src/notification/notification.service';
import { StorageService } from 'src/attachments/storage.service';

// interface Membership {
//   userId: string;
//   role: 'ADMIN' | 'USER' | 'MANAGER';
// }

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private storageService: StorageService,
  ) {}

  async createTask(userId: string, projectId: string, dto: CreateTaskDto) {
    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!creator) {
      throw new ForbiddenException(`User with id ${userId} not found`);
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new ForbiddenException('Project not available');

    const membership = project.members.find((m) => m.userId === userId);
    if (
      project.ownerId !== userId &&
      (!membership ||
        (membership.role !== 'ADMIN' && membership.role !== 'MANAGER'))
    ) {
      throw new ForbiddenException('Not allowed');
    }

    let assigneeID = userId;

    if (dto.assigneeId) {
      let assignee = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
      });

      if (!assignee) {
        assignee = await this.prisma.user.create({
          data: {
            id: dto.assigneeId,
            email: `user-${dto.assigneeId}@example.com`, // default email
            name: `User ${dto.assigneeId}`, // default name
            password: 'changeme123!', // default password
          },
        });
      }

      assigneeID = assignee.id;
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        assigneeID,
        projectId,
      },
    });

    // 6️⃣ Krijo audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'TASK',
        entityId: task.id,
        newData: {
          title: task.title,
          description: task.description,
          status: task.status,
        },
        userId,
      },
    });

    // 7️⃣ Krijo activity log
    await this.prisma.activityLong.create({
      data: {
        projectId,
        userId,
        action: `Created task "${task.title}" (${task.id}) assigned to "${assigneeID}"`,
      },
    });

    return task;
  }

  async updateTask(userId: string, taskId: string, dto: TaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    });
    if (!task) throw new ForbiddenException('Task not found');

    const project = task.project;
    const membership = task.project.members.find((m) => m.userId === userId);
    if (
      task.project.ownerId !== userId &&
      (!membership ||
        (membership.role !== 'ADMIN' && membership.role !== 'MANAGER'))
    ) {
      throw new ForbiddenException('No permission to update this task');
    }

    const oldData = { title: task.title, description: task.description };

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { title: dto.title, description: dto.description },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: taskId,
        oldData,
        userId,
      },
    });

    await this.prisma.activityLong.create({
      data: {
        projectId: project.id,
        userId,
        action: `Updated task "${updatedTask.title}" (${taskId})`,
      },
    });

    const titleChanged = dto.title !== task.title;
    const descChanged = dto.description !== task.description;
    if ((titleChanged || descChanged) && task.project.ownerId) {
      const changedFields = [];
      if (titleChanged) changedFields.push('title');
      if (descChanged) changedFields.push('description');
      await this.notificationService.notify(
        task.project.ownerId,
        taskId,
        'TASK_UPDATE',
        `Task "${dto.title}" ${changedFields.join(' & ')} updated by ${userId}.`,
      );
    }

    return updatedTask;
  }

  // Delete task
  async deleteTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    });
    if (!task) throw new ForbiddenException('Task not found');

    const project = task.project;

    const membership = task.project.members.find((m) => m.userId === userId);
    if (
      task.project.ownerId !== userId &&
      (!membership || membership.role !== 'ADMIN')
    ) {
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

    await this.prisma.task.delete({ where: { id: taskId } });

    if (task.assigneeID) {
      await this.notificationService.notify(
        task.assigneeID,
        taskId,
        'TASK_DELETE',
        `Task "${task.title}" was deleted by ${userId}.`,
      );
    }

    await this.prisma.activityLong.create({
      data: {
        projectId: project.id,
        userId,
        action: `Deleted task "${task.title}" (${taskId})`,
      },
    });

    return { message: 'Task deleted and notifications sent' };
  }

  // Get all tasks
  async getAllTasks(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new ForbiddenException('Project not available');

    const membership = project.members.find((m) => m.userId === userId);
    if (project.ownerId !== userId && !membership) {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.task.findMany({ where: { projectId } });
  }

  // Upload file to task
  async uploadTasks(
    userId: string,
    projectId: string,
    taskId: string,
    file: Express.Multer.File,
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

    const storedFile = await this.storageService.saveLocal(
      file.buffer,
      file.originalname,
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        mime: file.mimetype,
        size: file.size,
        taskId: task.id,
        projectId: project.id,
        createdById: userId,
      },
    });

    await this.prisma.activityLong.create({
      data: {
        projectId: project.id,
        userId,
        action: `Uploaded file "${file.originalname}" to task "${task.title}" (${taskId})`,
      },
    });

    return { attachment, storedFile: storedFile.storageKey };
  }
}

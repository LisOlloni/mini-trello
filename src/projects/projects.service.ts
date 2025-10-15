import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectDto } from './dto/projects.dto';
import { UserRole } from 'generated/prisma';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async createProject(
    userId: string,
    dto: ProjectDto,
    members?: { userId: string; role: UserRole }[],
  ) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,

        owner: {
          connect: {
            id: userId,
          },
        },
        members: {
          create: [
            { userId, role: UserRole.ADMIN },
            ...(members || []).map((m) => ({
              userId: m.userId,
              role: m.role,
            })),
          ],
        },
      },
      include: {
        members: true,
      },
    });

    return project;
  }

  async getAllProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId },
    });

    return projects;
  }

  async updateProject(projectId: string, dto: ProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new ForbiddenException('Project not available');

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
      },
    });
  }

  async deleteProjects(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new ForbiddenException('project not exist');
    if (project.ownerId !== userId) throw new ForbiddenException('Not allowed');
    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }
}

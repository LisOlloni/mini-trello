import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectDto } from './dto/projects.dto';
import { UserRole } from 'generated/prisma';
import { InviteUserDto } from './dto/invite-user.dto';
import { PaymentService } from 'src/paymant/paymant.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  async createProject(
    userId: string,
    dto: ProjectDto,
    members?: { userId: string; role: UserRole }[],
  ) {
    const userProjectsCount = await this.prisma.project.count({
      where: { ownerId: userId },
    });

    const itsPremium = await this.paymentService.checkLimits(userId);

    if (userProjectsCount >= 5 && !itsPremium) {
      throw new ForbiddenException('Not allowed');
    }

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

  async inviteUserToProject(
    projectId: string,
    inviterId: string,
    dto: InviteUserDto,
  ) {
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
    });

    if (!inviter) {
      throw new ForbiddenException('Inviter not found');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    const existingMember = await this.prisma.projectMembership.findFirst({
      where: { projectId, user: { email: dto.email } },
    });
    if (existingMember) {
      throw new ForbiddenException('User already a member');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      await this.prisma.projectMembership.create({
        data: {
          projectId,
          userId: existingUser.id,
          role: 'MANAGER',
        },
      });
    } else {
      await this.prisma.projectInvitation.create({
        data: {
          projectId,
          email: dto.email,
          invitedById: inviterId,
        },
      });
    }

    await this.prisma.activityLong.create({
      data: {
        projectId,
        userId: inviterId,
        activityLong: `Invited ${dto.email} to project`,
      },
    });

    return { message: `Invitation sent to ${dto.email}` };
  }

  async getProjectActivity(projectId: string) {
    return await this.prisma.activityLong.findMany({
      where: { projectId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
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

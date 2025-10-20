import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { sub: string };
  params: { projectId: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.sub;
    const projectId = request.params.projectId;

    if (!userId || !projectId) throw new ForbiddenException('Invalid request');

    const membership = await this.prisma.projectMembership.findFirst({
      where: { userId, projectId },
    });

    const userRole = membership?.role as UserRole | undefined;
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface JwtRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<JwtRequest>();
    const authHeader = req.headers['authorization'];

    if (!authHeader) throw new UnauthorizedException('No token provided');

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid token');

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.AT_SECRET || 'defaultATSecret',
      });

      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session) throw new UnauthorizedException('Session invalid');

      req.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}

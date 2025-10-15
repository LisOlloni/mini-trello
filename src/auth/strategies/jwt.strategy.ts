import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from './jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService, // injekto PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('AT_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}

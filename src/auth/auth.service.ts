import { Injectable, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    console.log('PrismaService:', PrismaService); // debug
    console.log('JwtService:', JwtService);
  }

  async signup(dto: SignupDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    sessionId: string;
  }> {
    const { name, email, password } = dto;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) throw new ForbiddenException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roles: UserRole.USER,
      },
    });

    const session = await this.prismaService.session.create({
      data: {
        userId: user.id,
        token: hashedPassword,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      sessionId: session.id,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('AT_SECRET') || 'defaultATSecret',
      expiresIn: '1500m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('RT_SECRET') || 'defaultRTSecret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      sessionId: session.id,
    };
  }

  async signin(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    sessionId: string;
  }> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) throw new ForbiddenException('User not found');

    // Check if user has any valid session tokens
    const userSessions = await this.prismaService.session.findMany({
      where: { userId: user.id },
    });

    let isPasswordValid = false;
    for (const session of userSessions) {
      try {
        isPasswordValid = await bcrypt.compare(password, session.token);
        if (isPasswordValid) break;
      } catch {
        // Continue checking other sessions
      }
    }

    if (!isPasswordValid) throw new ForbiddenException('Password incorrect');

    const session = await this.prismaService.session.create({
      data: {
        userId: user.id,
        token: await bcrypt.hash(password, 12),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      sessionId: session.id,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('AT_SECRET') || 'defaultATSecret',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('RT_SECRET') || 'defaultRTSecret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      sessionId: session.id,
    };
  }

  async logout(sessionId: string): Promise<{ message: string }> {
    await this.prismaService.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Logged out successfully' };
  }

  async ChangePassword(userId: string, dto: ChangePasswordDto) {
    const getUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!getUser) throw new ForbiddenException('User not found !');

    const sessions = await this.prismaService.session.findMany({
      where: { userId: getUser.id },
    });

    for (const session of sessions) {
      const match = await bcrypt.compare(dto.oldPassword, session.token);

      if (!match) throw new ForbiddenException('Password is incorrect!');
    }

    const hashNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prismaService.user.update({
      where: { id: getUser.id },

      data: { password: hashNewPassword },
    });
    await this.prismaService.session.deleteMany({
      where: { userId: getUser.id },
    });

    return { message: 'Password changed successfully. All sessions revoked.' };
  }
}

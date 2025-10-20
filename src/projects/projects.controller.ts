import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ProjectDto } from './dto/projects.dto';
import { ProjectService } from './projects.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import type { JwtRequest } from 'src/auth/strategies/jwt.request';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private prisma: PrismaService,
  ) {}
  @Post()
  @Roles(UserRole.ADMIN)
  async createProject(@Req() req: JwtRequest, @Body() dto: ProjectDto) {
    const userId = req.user.sub;

    return await this.projectService.createProject(userId, dto);
  }

  @Get(':projectId/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getActivity(@Param('projectId') projectId: string) {
    return this.projectService.getProjectActivity(projectId);
  }

  @Post(':projectId/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async inviteUser(
    @Param('projectId') projectId: string,
    @Req() req: JwtRequest,
    @Body() dto: InviteUserDto,
  ) {
    const inviterId = req.user.sub;

    return this.projectService.inviteUserToProject(projectId, inviterId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  async getAllProjects(@Req() req: JwtRequest) {
    const userId = req.user.sub;

    return await this.projectService.getAllProjects(userId);
  }
  @Put(':projectId')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() dto: ProjectDto,
  ) {
    return await this.projectService.updateProject(projectId, dto);
  }

  @Delete(':projectId')
  async deleteProjects(
    @Param('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return await this.projectService.deleteProjects(userId, projectId);
  }
}

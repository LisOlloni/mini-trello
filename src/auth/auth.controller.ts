import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Req, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { LoginDto } from './dto/login.dto';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}
@ApiTags('auth')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return await this.authService.signup(dto);
  }
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.signin(dto.email, dto.password);
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Req() req: { user: { sessionId: string } }) {
    return this.authService.logout(req.user.sessionId);
  }
  @Patch()
  async ChangePassword(
    @Req() req: AuthRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user.id;

    return await this.authService.ChangePassword(userId, dto);
  }
}

import { Controller, Post, Body, Get, UseGuards, Request, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleProfile } from './google.strategy';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: { user: User }) {
    const { passwordHash, ...safe } = req.user as User & { passwordHash?: string };
    return { ...safe, hasPassword: !!passwordHash };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport handles the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Request() req: { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const { accessToken } = await this.authService.loginWithGoogle(req.user);
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    res.redirect(`${webUrl}/auth/callback?token=${accessToken}`);
  }
}

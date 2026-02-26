import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      passwordHash,
    });

    return { accessToken: this.signToken(user), user: this.sanitize(user) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return { accessToken: this.signToken(user), user: this.sanitize(user) };
  }

  async loginWithGoogle(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ accessToken: string; user: Partial<User> }> {
    let user = await this.usersService.findByGoogleId(profile.googleId);

    if (!user) {
      // Link to existing account by email if one exists
      user = await this.usersService.findByEmail(profile.email);
      if (user) {
        await this.usersService.update(user.id, { googleId: profile.googleId });
        user = (await this.usersService.findById(user.id))!;
      } else {
        user = await this.usersService.create({
          googleId: profile.googleId,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
        });
      }
    }

    return { accessToken: this.signToken(user), user: this.sanitize(user) };
  }

  private signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}

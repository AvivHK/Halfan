import { Controller, Patch, Body, UseGuards, Request, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Request() req: { user: User },
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new UnauthorizedException();

    const updates: Partial<User> = {};

    if (dto.phone !== undefined) {
      updates.phone = dto.phone;
    }

    if (dto.newPassword) {
      if (!user.passwordHash) {
        throw new BadRequestException('חשבון זה משתמש בהתחברות עם Google ואינו תומך בסיסמה');
      }
      if (!dto.currentPassword) {
        throw new BadRequestException('יש לספק את הסיסמה הנוכחית');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) {
        throw new BadRequestException('הסיסמה הנוכחית שגויה');
      }
      updates.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('לא נשלחו שדות לעדכון');
    }

    await this.usersService.update(user.id, updates);
    const updated = await this.usersService.findById(user.id);
    const { passwordHash: _, ...safe } = updated!;
    return safe;
  }
}

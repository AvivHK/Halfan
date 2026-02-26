import { IsOptional, IsString, MinLength, IsMobilePhone } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsMobilePhone('he-IL', {}, { message: 'מספר טלפון לא תקין' })
  phone?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'סיסמה חייבת להכיל לפחות 8 תווים' })
  newPassword?: string;
}

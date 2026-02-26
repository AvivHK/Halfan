import { IsOptional, IsString, IsNumber, IsPositive, Min, Max } from 'class-validator';

export class UpdateOfferDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  meetingZone?: string;

  @IsOptional()
  @IsString()
  availabilityNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  expiresInHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

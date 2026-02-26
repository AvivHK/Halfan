import { IsEnum, IsString, IsNumber, IsPositive, IsOptional, Min, Max, IsIn } from 'class-validator';
import { OfferType } from '../offer.entity';
import { SUPPORTED_CURRENCIES } from '../../rates/rates.service';

export class CreateOfferDto {
  @IsEnum(OfferType)
  type: OfferType;

  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  currency: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  meetingZone: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsString()
  availabilityNote?: string;

  // Offer expires in 48 hours by default; client can override up to 7 days
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  expiresInHours?: number;
}

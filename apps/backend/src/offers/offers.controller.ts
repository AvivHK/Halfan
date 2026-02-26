import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { FindOffersDto } from './dto/find-offers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { User } from '../users/user.entity';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: FindOffersDto, @Request() req: { user?: User }) {
    return this.offersService.findAll(query, !!req.user);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: { user: User }) {
    return this.offersService.findMyOffers(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: { user: User }, @Body() dto: CreateOfferDto) {
    return this.offersService.create(req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @Request() req: { user: User }) {
    return this.offersService.cancel(id, req.user.id);
  }

  @Patch(':id/pause')
  @UseGuards(JwtAuthGuard)
  pause(@Param('id') id: string, @Request() req: { user: User }) {
    return this.offersService.pause(id, req.user.id);
  }

  @Patch(':id/resume')
  @UseGuards(JwtAuthGuard)
  resume(@Param('id') id: string, @Request() req: { user: User }) {
    return this.offersService.resume(id, req.user.id);
  }
}

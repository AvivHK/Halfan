import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { FindOffersDto } from './dto/find-offers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findAll(@Query() query: FindOffersDto) {
    return this.offersService.findAll(query);
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
}

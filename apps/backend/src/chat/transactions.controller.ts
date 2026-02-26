import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  initiate(@Request() req: { user: User }, @Body('offerId') offerId: string) {
    return this.transactionsService.initiate(offerId, req.user.id);
  }

  @Get(':id')
  getDetails(@Param('id') id: string, @Request() req: { user: User }) {
    return this.transactionsService.getWithMessages(id, req.user.id);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Request() req: { user: User }) {
    const result = await this.transactionsService.confirm(id, req.user.id);
    // Notify both participants via socket
    this.chatGateway.notifyRoom(id, 'transaction:updated', {
      initiatorConfirmed: result.transaction.initiatorConfirmed,
      ownerConfirmed: result.transaction.ownerConfirmed,
      status: result.transaction.status,
      completed: result.completed,
    });
    return result;
  }
}

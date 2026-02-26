import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';
import { Message } from './message.entity';
import { Offer, OfferStatus } from '../offers/offer.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    @InjectRepository(Message)
    private msgRepo: Repository<Message>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
  ) {}

  async initiate(offerId: string, initiatorId: string): Promise<Transaction> {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId === initiatorId)
      throw new BadRequestException('Cannot contact your own offer');
    if (offer.status !== OfferStatus.ACTIVE)
      throw new BadRequestException('Offer is not active');

    // Return existing transaction if already initiated
    const existing = await this.txRepo.findOne({ where: { offerId, initiatorId } });
    if (existing) return existing;

    const tx = this.txRepo.create({
      offerId,
      initiatorId,
      ownerId: offer.userId,
      status: TransactionStatus.PENDING,
    });
    await this.txRepo.save(tx);
    await this.offerRepo.update(offerId, { status: OfferStatus.MATCHED });

    return this.txRepo.findOneOrFail({
      where: { id: tx.id },
      relations: ['initiator', 'owner', 'offer'],
    });
  }

  async getWithMessages(
    txId: string,
    userId: string,
  ): Promise<{ transaction: Transaction; messages: Message[] }> {
    const tx = await this.txRepo.findOne({
      where: { id: txId },
      relations: ['initiator', 'owner', 'offer'],
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.initiatorId !== userId && tx.ownerId !== userId) throw new ForbiddenException();

    const messages = await this.msgRepo.find({
      where: { transactionId: txId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    return { transaction: tx, messages };
  }

  async saveMessage(transactionId: string, senderId: string, content: string): Promise<Message> {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException();
    if (tx.initiatorId !== senderId && tx.ownerId !== senderId) throw new ForbiddenException();

    const msg = this.msgRepo.create({ transactionId, senderId, content });
    const saved = await this.msgRepo.save(msg);
    return this.msgRepo.findOneOrFail({ where: { id: saved.id }, relations: ['sender'] });
  }

  async confirm(
    txId: string,
    userId: string,
  ): Promise<{ transaction: Transaction; completed: boolean }> {
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.initiatorId !== userId && tx.ownerId !== userId) throw new ForbiddenException();
    if (tx.status === TransactionStatus.COMPLETED) {
      const final = await this.txRepo.findOneOrFail({
        where: { id: txId },
        relations: ['initiator', 'owner', 'offer'],
      });
      return { transaction: final, completed: true };
    }

    if (tx.initiatorId === userId) {
      await this.txRepo.update(txId, { initiatorConfirmed: true });
    } else {
      await this.txRepo.update(txId, { ownerConfirmed: true });
    }

    const updated = await this.txRepo.findOneOrFail({ where: { id: txId } });
    if (updated.initiatorConfirmed && updated.ownerConfirmed) {
      await this.txRepo.update(txId, { status: TransactionStatus.COMPLETED });
      await this.offerRepo.update(tx.offerId, { status: OfferStatus.COMPLETED });
      const final = await this.txRepo.findOneOrFail({
        where: { id: txId },
        relations: ['initiator', 'owner', 'offer'],
      });
      return { transaction: final, completed: true };
    }

    const final = await this.txRepo.findOneOrFail({
      where: { id: txId },
      relations: ['initiator', 'owner', 'offer'],
    });
    return { transaction: final, completed: false };
  }
}

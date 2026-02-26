import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Offer, OfferStatus } from './offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { FindOffersDto } from './dto/find-offers.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateOfferDto): Promise<Offer> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (dto.expiresInHours ?? 48));

    const offer = this.offerRepo.create({
      userId,
      type: dto.type,
      currency: dto.currency,
      amount: dto.amount,
      meetingZone: dto.meetingZone,
      lat: dto.lat,
      lng: dto.lng,
      availabilityNote: dto.availabilityNote,
      expiresAt,
    });

    const saved = await this.offerRepo.save(offer);

    // Update PostGIS geography column
    await this.dataSource.query(
      `UPDATE offers SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
      [dto.lng, dto.lat, saved.id],
    );

    return this.offerRepo.findOneOrFail({ where: { id: saved.id }, relations: ['user'] });
  }

  async findAll(dto: FindOffersDto, isAuthenticated = false): Promise<object[]> {
    let query = `
      SELECT
        o.id,
        o.type,
        o.currency,
        o.amount,
        o.meeting_zone AS "meetingZone",
        o.lat,
        o.lng,
        o.availability_note AS "availabilityNote",
        o.status,
        o.expires_at AS "expiresAt",
        o.created_at AS "createdAt",
        u.first_name AS "userFirstName",
        LEFT(u.last_name, 1) AS "userLastInitial",
        ${isAuthenticated ? 'u.phone AS "userPhone",' : ''}
        u.rating_avg AS "userRatingAvg",
        u.rating_count AS "userRatingCount",
        u.is_verified AS "userIsVerified",
        u.is_agency AS "userIsAgency"
    `;

    const params: (number | string)[] = [];
    let paramIdx = 1;

    if (dto.lat !== undefined && dto.lng !== undefined) {
      query += `,
        ROUND(CAST(ST_Distance(o.location, ST_SetSRID(ST_MakePoint($${paramIdx}, $${paramIdx + 1}), 4326)::geography) / 1000.0 AS numeric), 1) AS "distanceKm"`;
      params.push(dto.lng, dto.lat);
      paramIdx += 2;
    }

    query += `
      FROM offers o
      JOIN users u ON u.id = o.user_id
      WHERE o.status = 'ACTIVE'
        AND o.expires_at > NOW()
    `;

    if (dto.lat !== undefined && dto.lng !== undefined) {
      const radiusMeters = (dto.radiusKm ?? 20) * 1000;
      query += ` AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint($${paramIdx}, $${paramIdx + 1}), 4326)::geography, $${paramIdx + 2})`;
      params.push(dto.lng, dto.lat, radiusMeters);
      paramIdx += 3;
    }

    if (dto.currency) {
      query += ` AND o.currency = $${paramIdx}`;
      params.push(dto.currency);
      paramIdx++;
    }

    if (dto.type) {
      query += ` AND o.type = $${paramIdx}`;
      params.push(dto.type);
      paramIdx++;
    }

    if (dto.lat !== undefined && dto.lng !== undefined) {
      query += ` ORDER BY "distanceKm" ASC`;
    } else {
      query += ` ORDER BY o.created_at DESC`;
    }

    query += ` LIMIT 100`;

    return this.dataSource.query(query, params);
  }

  async findMyOffers(userId: string): Promise<Offer[]> {
    return this.offerRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(offerId: string, userId: string): Promise<void> {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenException();
    await this.offerRepo.update(offerId, { status: OfferStatus.CANCELLED });
  }

  async pause(offerId: string, userId: string): Promise<void> {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenException();
    if (offer.status !== OfferStatus.ACTIVE) throw new BadRequestException('ניתן להקפיא רק הצעות פעילות');
    await this.offerRepo.update(offerId, { status: OfferStatus.PAUSED });
  }

  async resume(offerId: string, userId: string): Promise<void> {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenException();
    if (offer.status !== OfferStatus.PAUSED) throw new BadRequestException('ניתן להפעיל מחדש רק הצעות מוקפאות');
    await this.offerRepo.update(offerId, { status: OfferStatus.ACTIVE });
  }

  async update(offerId: string, userId: string, dto: UpdateOfferDto): Promise<void> {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenException();
    if (offer.status === OfferStatus.CANCELLED || offer.status === OfferStatus.COMPLETED) {
      throw new BadRequestException('לא ניתן לערוך הצעה שהושלמה או בוטלה');
    }

    const updates: Partial<Offer> = {};
    if (dto.amount !== undefined) updates.amount = dto.amount;
    if (dto.meetingZone !== undefined) updates.meetingZone = dto.meetingZone;
    if (dto.availabilityNote !== undefined) updates.availabilityNote = dto.availabilityNote;
    if (dto.expiresInHours !== undefined) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + dto.expiresInHours);
      updates.expiresAt = expiresAt;
    }

    if (Object.keys(updates).length > 0) {
      await this.offerRepo.update(offerId, updates);
    }

    if (dto.lat !== undefined && dto.lng !== undefined) {
      await this.dataSource.query(
        `UPDATE offers SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
        [dto.lng, dto.lat, offerId],
      );
    }
  }
}

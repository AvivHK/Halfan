import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD',
  'DKK', 'NOK', 'SEK', 'HKD', 'SGD', 'NZD',
  'ZAR', 'MXN', 'TRY', 'CNY', 'INR', 'BRL',
  'PLN', 'HUF', 'CZK', 'RON', 'BGN', 'THB',
  'JOD', 'EGP', 'RUB',
];

const CACHE_KEY = 'forex:exchange_rates';
const CACHE_TTL_SECONDS = 3600; // 1 hour — BOI updates once per day

interface BoiRate {
  key: string;
  currentExchangeRate: number;
  lastUpdate: string;
  unit: number;
}

export interface ExchangeRate {
  currency: string;
  rate: number;
  unit: number;
  lastUpdate: string;
}

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);
  private readonly redis: Redis;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6381),
    });
  }

  async getRates(currencies?: string[]): Promise<ExchangeRate[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      const all: ExchangeRate[] = JSON.parse(cached);
      return currencies ? all.filter((r) => currencies.includes(r.currency)) : all;
    }

    const fresh = await this.fetchFromBoi();
    await this.redis.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(fresh));
    return currencies ? fresh.filter((r) => currencies.includes(r.currency)) : fresh;
  }

  private async fetchFromBoi(): Promise<ExchangeRate[]> {
    const keys = SUPPORTED_CURRENCIES.join(',');
    const url = `https://boi.org.il/PublicApi/GetExchangeRates?key=${keys}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ exchangeRates: BoiRate[] }>(url, {
          headers: { Accept: 'application/json' },
          timeout: 8000,
        }),
      );

      return data.exchangeRates.map((r) => ({
        currency: r.key,
        rate: r.currentExchangeRate,
        unit: r.unit,
        lastUpdate: r.lastUpdate,
      }));
    } catch (err) {
      this.logger.error('Failed to fetch BOI rates', err);
      return [];
    }
  }
}

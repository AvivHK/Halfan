import { Controller, Get, Query } from '@nestjs/common';
import { RatesService, SUPPORTED_CURRENCIES } from './rates.service';

@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  async getRates(@Query('currencies') currenciesParam?: string) {
    const currencies = currenciesParam
      ? currenciesParam.split(',').map((c) => c.toUpperCase().trim())
      : undefined;
    return this.ratesService.getRates(currencies);
  }

  @Get('supported')
  getSupportedCurrencies() {
    return { currencies: SUPPORTED_CURRENCIES };
  }
}

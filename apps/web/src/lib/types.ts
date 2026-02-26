export interface ExchangeRate {
  currency: string;
  rate: number;
  unit: number;
  lastUpdate: string;
}

export interface Offer {
  id: string;
  type: 'BUY' | 'SELL';
  currency: string;
  amount: string;
  meetingZone: string;
  lat: string;
  lng: string;
  availabilityNote?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  userFirstName: string;
  userLastInitial: string;
  userRatingAvg: string;
  userRatingCount: number;
  userIsVerified: boolean;
  userIsAgency: boolean;
  distanceKm?: string;
}

export const CURRENCY_LABELS: Record<string, string> = {
  // נפוצים
  USD: 'דולר אמריקאי',
  EUR: 'יורו',
  GBP: 'ליש"ט',
  JPY: 'יֶן יפני',
  CHF: 'פרנק שוויצרי',
  CAD: 'דולר קנדי',
  AUD: 'דולר אוסטרלי',
  // אירופה
  DKK: 'כתר דני',
  NOK: 'כתר נורווגי',
  SEK: 'כתר שוודי',
  PLN: 'זלוטי פולני',
  HUF: 'פורינט הונגרי',
  CZK: 'קורונה צ\'כית',
  RON: 'לאו רומני',
  BGN: 'לב בולגרי',
  RUB: 'רובל רוסי',
  // אסיה-פסיפיק
  HKD: 'דולר הונג קונג',
  SGD: 'דולר סינגפורי',
  NZD: 'דולר ניו זילנד',
  CNY: 'יואן סיני',
  INR: 'רופי הודי',
  THB: 'באט תאילנדי',
  // אמריקה לטינית
  MXN: 'פסו מקסיקני',
  BRL: 'ריאל ברזילאי',
  // אפריקה ומזה"ת
  ZAR: 'רנד דרום-אפריקאי',
  TRY: 'לירה טורקית',
  JOD: 'דינר ירדני',
  EGP: 'פאונד מצרי',
};

export const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  DKK: '🇩🇰',
  NOK: '🇳🇴',
  SEK: '🇸🇪',
  PLN: '🇵🇱',
  HUF: '🇭🇺',
  CZK: '🇨🇿',
  RON: '🇷🇴',
  BGN: '🇧🇬',
  RUB: '🇷🇺',
  HKD: '🇭🇰',
  SGD: '🇸🇬',
  NZD: '🇳🇿',
  CNY: '🇨🇳',
  INR: '🇮🇳',
  THB: '🇹🇭',
  MXN: '🇲🇽',
  BRL: '🇧🇷',
  ZAR: '🇿🇦',
  TRY: '🇹🇷',
  JOD: '🇯🇴',
  EGP: '🇪🇬',
};

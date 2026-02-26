'use client';
import { CURRENCY_FLAGS, CURRENCY_LABELS } from '@/lib/types';

const CURRENCIES = Object.keys(CURRENCY_LABELS);

interface Props {
  currency: string;
  type: string;
  onCurrencyChange: (v: string) => void;
  onTypeChange: (v: string) => void;
}

export function OffersFilters({ currency, type, onCurrencyChange, onTypeChange }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        {(['', 'BUY', 'SELL'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              type === t
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === '' ? 'הכל' : t === 'BUY' ? 'קונים' : 'מוכרים'}
          </button>
        ))}
      </div>

      <select
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">כל המטבעות</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {CURRENCY_FLAGS[c]} {c} — {CURRENCY_LABELS[c]}
          </option>
        ))}
      </select>
    </div>
  );
}

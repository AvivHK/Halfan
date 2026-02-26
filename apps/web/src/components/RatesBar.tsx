import { ExchangeRate, CURRENCY_FLAGS } from '@/lib/types';

interface Props {
  rates: ExchangeRate[];
}

export function RatesBar({ rates }: Props) {
  const mainCurrencies = ['USD', 'EUR', 'GBP'];
  const displayed = rates.filter((r) => mainCurrencies.includes(r.currency));

  if (!displayed.length) return null;

  const lastUpdate = displayed[0]?.lastUpdate
    ? new Date(displayed[0].lastUpdate).toLocaleDateString('he-IL')
    : '';

  return (
    <div className="bg-blue-900 text-white py-2 px-4">
      <div className="max-w-5xl mx-auto flex items-center gap-6 flex-wrap">
        <span className="text-blue-300 text-sm font-medium">שער יציג</span>
        {displayed.map((rate) => (
          <div key={rate.currency} className="flex items-center gap-1.5">
            <span>{CURRENCY_FLAGS[rate.currency] ?? ''}</span>
            <span className="font-bold">{rate.currency}</span>
            <span className="text-blue-200">=</span>
            <span className="font-mono font-bold text-yellow-300">
              ₪{rate.rate.toFixed(4)}
            </span>
          </div>
        ))}
        {lastUpdate && (
          <span className="text-blue-400 text-xs me-auto">עודכן: {lastUpdate}</span>
        )}
      </div>
    </div>
  );
}

'use client';
import { Offer, CURRENCY_FLAGS, CURRENCY_LABELS } from '@/lib/types';
import { RatingBadge } from './RatingBadge';

interface Props {
  offer: Offer;
  onContact?: () => void;
  contacting?: boolean;
}

export function OfferCard({ offer, onContact, contacting }: Props) {
  const isBuy = offer.type === 'BUY';
  const displayName = `${offer.userFirstName} ${offer.userLastInitial}.`;
  const amount = parseFloat(offer.amount).toLocaleString('he-IL');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              isBuy ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}
          >
            {isBuy ? '↑' : '↓'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isBuy ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}
              >
                {isBuy ? 'קונה' : 'מוכר'}
              </span>
              <span className="font-semibold text-gray-900">
                {CURRENCY_FLAGS[offer.currency] ?? ''} {offer.currency}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {CURRENCY_LABELS[offer.currency] ?? offer.currency}
            </div>
          </div>
        </div>

        <div className="text-left">
          <div className="text-xl font-bold text-gray-900">
            {amount} {offer.currency}
          </div>
          <div className="text-xs text-gray-400 text-left">בשער יציג</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-medium text-gray-800">{displayName}</div>
          <RatingBadge
            avg={parseFloat(offer.userRatingAvg)}
            count={offer.userRatingCount}
            isVerified={offer.userIsVerified}
            isAgency={offer.userIsAgency}
          />
        </div>

        <div className="text-left">
          <div className="text-sm text-gray-600">📍 {offer.meetingZone}</div>
          {offer.distanceKm !== undefined && (
            <div className="text-xs text-gray-400">~{offer.distanceKm} ק"מ ממך</div>
          )}
        </div>
      </div>

      {offer.availabilityNote && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          🕐 {offer.availabilityNote}
        </div>
      )}

      <button
        onClick={onContact}
        disabled={contacting}
        className="mt-auto pt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {contacting ? 'פותח שיחה...' : 'צור קשר'}
      </button>
    </div>
  );
}

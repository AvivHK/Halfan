'use client';
import { useState, useEffect } from 'react';
import { Offer, CURRENCY_FLAGS, CURRENCY_LABELS } from '@/lib/types';
import { RatingBadge } from './RatingBadge';

interface Props {
  offer: Offer;
  ilsAmount?: number;
  onContact?: () => void;
  contacting?: boolean;
}

function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Israeli numbers: replace leading 0 with 972
  return digits.startsWith('0') ? '972' + digits.slice(1) : digits;
}

export function OfferCard({ offer, ilsAmount }: Props) {
  const isBuy = offer.type === 'BUY';
  const displayName = `${offer.userFirstName} ${offer.userLastInitial}.`;
  const amount = parseFloat(offer.amount).toLocaleString('he-IL');
  const [isMobile, setIsMobile] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const phone = offer.userPhone;
  const waNumber = phone ? toWhatsAppNumber(phone) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow flex flex-col">
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
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {CURRENCY_FLAGS[offer.currency] ?? ''} {offer.currency}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {CURRENCY_LABELS[offer.currency] ?? offer.currency}
            </div>
          </div>
        </div>

        <div className="text-left">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {amount} {offer.currency}
          </div>
          {ilsAmount !== undefined && (
            <div className="text-xs text-gray-400 text-left">≈ {ilsAmount.toLocaleString('he-IL')} ₪</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{displayName}</div>
          <RatingBadge
            avg={parseFloat(offer.userRatingAvg)}
            count={offer.userRatingCount}
            isVerified={offer.userIsVerified}
            isAgency={offer.userIsAgency}
          />
        </div>

        <div className="text-left">
          <div className="text-sm text-gray-600 dark:text-gray-400">📍 {offer.meetingZone}</div>
          {offer.distanceKm !== undefined && (
            <div className="text-xs text-gray-400">~{offer.distanceKm} ק"מ ממך</div>
          )}
        </div>
      </div>

      {offer.availabilityNote && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          🕐 {offer.availabilityNote}
        </div>
      )}

      {phone && (
        <div className="mt-auto pt-4 flex gap-2">
          {isMobile ? (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              📞 התקשר
            </a>
          ) : (
            <button
              onClick={() => setShowPhone((v) => !v)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {showPhone ? phone : '📞 הצג מספר'}
            </button>
          )}

          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

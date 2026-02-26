'use client';
import { useState, useEffect, useCallback } from 'react';
import { Offer, ExchangeRate } from '@/lib/types';
import { fetchOffers, fetchRates } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { OfferCard } from './OfferCard';
import { OffersFilters } from './OffersFilters';

interface UserLocation {
  lat: number;
  lng: number;
}

export function OffersList() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('');
  const [type, setType] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [ratesMap, setRatesMap] = useState<Record<string, ExchangeRate>>({});

  const loadOffers = useCallback(async () => {
    setLoading(true);
    const [data, rates] = await Promise.all([
      fetchOffers({
        ...(userLocation ?? {}),
        radiusKm: 20,
        currency: currency || undefined,
        type: type || undefined,
        token: token ?? undefined,
      }),
      fetchRates(),
    ]);
    setOffers(data);
    setRatesMap(Object.fromEntries((rates as ExchangeRate[]).map((r) => [r.currency, r])));
    setLoading(false);
  }, [currency, type, userLocation, token]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocationDenied(true),
      );
    } else {
      setLocationDenied(true);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <OffersFilters
          currency={currency}
          type={type}
          onCurrencyChange={setCurrency}
          onTypeChange={setType}
        />
        {locationDenied && (
          <p className="text-xs text-gray-400">
            📍 אפשר גישה למיקום כדי לראות הצעות קרובות אליך
          </p>
        )}
        {userLocation && !locationDenied && (
          <p className="text-xs text-green-600">📍 מציג הצעות עד 20 ק"מ ממך</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-48 animate-pulse border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💱</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">אין הצעות כרגע</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">נסה להרחיב את הסינון או לבדוק שוב מאוחר יותר</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const rate = ratesMap[offer.currency];
            const ilsAmount = rate
              ? Math.round(parseFloat(offer.amount) * (rate.rate / rate.unit))
              : undefined;
            return (
              <OfferCard
                key={offer.id}
                offer={offer}
                ilsAmount={ilsAmount}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

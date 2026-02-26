'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Offer } from '@/lib/types';
import { fetchOffers } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { OfferCard } from './OfferCard';
import { OffersFilters } from './OffersFilters';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface UserLocation {
  lat: number;
  lng: number;
}

export function OffersList() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('');
  const [type, setType] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    const data = await fetchOffers({
      ...(userLocation ?? {}),
      radiusKm: 20,
      currency: currency || undefined,
      type: type || undefined,
    });
    setOffers(data);
    setLoading(false);
  }, [currency, type, userLocation]);

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

  const handleContact = async (offerId: string) => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    setContacting(offerId);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        alert(err.message ?? 'שגיאה ביצירת שיחה');
        return;
      }
      const tx = await res.json() as { id: string };
      router.push(`/chat/${tx.id}`);
    } catch {
      alert('שגיאה בחיבור לשרת');
    } finally {
      setContacting(null);
    }
  };

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
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💱</div>
          <p className="text-gray-500 text-lg">אין הצעות כרגע</p>
          <p className="text-gray-400 text-sm mt-1">נסה להרחיב את הסינון או לבדוק שוב מאוחר יותר</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onContact={() => handleContact(offer.id)}
              contacting={contacting === offer.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

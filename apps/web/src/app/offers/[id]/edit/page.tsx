'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENCY_FLAGS } from '@/lib/types';
import { fetchRates } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface MyOffer {
  id: string;
  type: 'BUY' | 'SELL';
  currency: string;
  amount: string;
  meetingZone: string;
  availabilityNote?: string;
  lat: number;
  lng: number;
  status: string;
  expiresAt: string;
}

interface Rate {
  currency: string;
  rate: number;
}

export default function EditOfferPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;

  const [offer, setOffer] = useState<MyOffer | null>(null);
  const [form, setForm] = useState({
    amount: '',
    meetingZone: '',
    availabilityNote: '',
    expiresInHours: 48,
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationUpdated, setLocationUpdated] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchRates().then(setRates);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/offers/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((offers: MyOffer[]) => {
        const found = offers.find((o) => o.id === offerId);
        if (!found) { router.push('/profile'); return; }
        setOffer(found);
        setForm({
          amount: parseFloat(found.amount).toString(),
          meetingZone: found.meetingZone,
          availabilityNote: found.availabilityNote ?? '',
          expiresInHours: 48,
        });
        setLat(found.lat);
        setLng(found.lng);
        setLoading(false);
      });
  }, [token, offerId, router]);

  const currentRate = rates.find((r) => r.currency === offer?.currency);

  const updateLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationUpdated(true);
      },
      () => setError('לא ניתן לאתר מיקום — נא לאפשר גישה'),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        amount: parseFloat(form.amount),
        meetingZone: form.meetingZone,
        availabilityNote: form.availabilityNote || undefined,
        expiresInHours: form.expiresInHours,
      };
      if (locationUpdated && lat && lng) {
        body.lat = lat;
        body.lng = lng;
      }
      const res = await fetch(`${API}/offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'שגיאה בעדכון ההצעה');
      }
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-blue-900 dark:text-blue-400">💱 חלפן</Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-600 dark:text-gray-400 font-medium">עריכת הצעה</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          {/* Offer type badge (readonly) */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                offer?.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}
            >
              {offer?.type === 'BUY' ? '↑ קונה' : '↓ מוכר'}{' '}
              {CURRENCY_FLAGS[offer?.currency ?? ''] ?? ''} {offer?.currency}
            </div>
            {currentRate && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                שער יציג: <strong>₪{currentRate.rate.toFixed(4)}</strong>
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                סכום ({offer?.currency})
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                אזור מפגש
              </label>
              <input
                type="text"
                required
                value={form.meetingZone}
                onChange={(e) => setForm((f) => ({ ...f, meetingZone: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div
                className={`text-sm rounded-xl px-4 py-3 mb-2 ${
                  locationUpdated
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {locationUpdated
                  ? `📍 מיקום עודכן (${lat?.toFixed(4)}, ${lng?.toFixed(4)})`
                  : '📍 מיקום נשמר מהפרסום המקורי'}
              </div>
              <button
                type="button"
                onClick={updateLocation}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                עדכן מיקום לפי מיקום נוכחי
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                הערת זמינות <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <input
                type="text"
                value={form.availabilityNote}
                onChange={(e) => setForm((f) => ({ ...f, availabilityNote: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: זמין בצהריים ובערב"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                הארכת תוקף
              </label>
              <select
                value={form.expiresInHours}
                onChange={(e) => setForm((f) => ({ ...f, expiresInHours: Number(e.target.value) }))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={24}>24 שעות מעכשיו</option>
                <option value={48}>48 שעות מעכשיו</option>
                <option value={72}>3 ימים מעכשיו</option>
                <option value={168}>שבוע מעכשיו</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {submitting ? 'שומר...' : 'שמור שינויים'}
              </button>
              <Link
                href="/profile"
                className="px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                ביטול
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

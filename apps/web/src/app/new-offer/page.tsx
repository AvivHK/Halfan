'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENCY_LABELS, CURRENCY_FLAGS } from '@/lib/types';
import { fetchRates } from '@/lib/api';

const CURRENCIES = Object.keys(CURRENCY_LABELS);
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface Rate {
  currency: string;
  rate: number;
}

export default function NewOfferPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    type: 'SELL',
    currency: 'USD',
    amount: '',
    meetingZone: '',
    availabilityNote: '',
    expiresInHours: 48,
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState('');
  const [rates, setRates] = useState<Rate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchRates().then(setRates);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setLocationError('לא ניתן לאתר מיקום — נא לאפשר גישה'),
    );
  }, []);

  const currentRate = rates.find((r) => r.currency === form.currency);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) {
      setError('יש לאפשר גישה למיקום');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: form.type,
          currency: form.currency,
          amount: parseFloat(form.amount),
          meetingZone: form.meetingZone,
          lat,
          lng,
          availabilityNote: form.availabilityNote || undefined,
          expiresInHours: form.expiresInHours,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'שגיאה ביצירת הצעה');
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-blue-900">💱 חלפן</Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-medium">פרסם הצעה חדשה</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {currentRate && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
              <span className="text-blue-600">📊</span>
              <span className="text-sm text-blue-700">
                שער יציג {CURRENCY_FLAGS[form.currency]} {form.currency} היום:{' '}
                <strong>₪{currentRate.rate.toFixed(4)}</strong>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אני רוצה</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['SELL', 'BUY'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      form.type === t
                        ? t === 'SELL'
                          ? 'bg-orange-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'SELL' ? '↓ למכור מט"ח' : '↑ לקנות מט"ח'}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency + Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">מטבע</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {CURRENCY_FLAGS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  סכום ({form.currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="500"
                />
              </div>
            </div>

            {/* Meeting Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">אזור מפגש</label>
              <input
                type="text"
                required
                value={form.meetingZone}
                onChange={(e) => setForm((f) => ({ ...f, meetingZone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: תל אביב — דיזנגוף"
              />
              <p className="text-xs text-gray-400 mt-1">שכונה או אזור כללי (לא כתובת מדויקת)</p>
            </div>

            {/* Location status */}
            <div className={`text-sm rounded-xl px-4 py-3 ${lat ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {lat ? `📍 מיקום אותר בהצלחה (${lat.toFixed(4)}, ${lng!.toFixed(4)})` : locationError || '⏳ ממתין לאישור מיקום...'}
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                הערת זמינות <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <input
                type="text"
                value={form.availabilityNote}
                onChange={(e) => setForm((f) => ({ ...f, availabilityNote: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: זמין בצהריים ובערב"
              />
            </div>

            {/* Expires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תוקף ההצעה</label>
              <select
                value={form.expiresInHours}
                onChange={(e) => setForm((f) => ({ ...f, expiresInHours: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={24}>24 שעות</option>
                <option value={48}>48 שעות (ברירת מחדל)</option>
                <option value={72}>3 ימים</option>
                <option value={168}>שבוע</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !lat}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {submitting ? 'מפרסם...' : 'פרסם הצעה'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
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

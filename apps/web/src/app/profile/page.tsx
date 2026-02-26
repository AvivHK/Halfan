'use client';
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { RatingBadge } from '@/components/RatingBadge';
import { CURRENCY_FLAGS } from '@/lib/types';

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
  createdAt: string;
}

type Tab = 'offers' | 'settings';

export default function ProfilePage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('offers');

  // Offers state
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // Settings state
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) setPhone(user.phone ?? '');
  }, [user]);

  const loadOffers = useCallback(async () => {
    if (!token) return;
    setLoadingOffers(true);
    try {
      const res = await fetch(`${API}/offers/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOffers(await res.json());
    } finally {
      setLoadingOffers(false);
    }
  }, [token]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const doAction = async (id: string, method: string, path: string) => {
    setActing(id);
    await fetch(`${API}/offers/${id}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token!}` },
    });
    setActing(null);
    loadOffers();
  };

  const markSold = (id: string) => {
    if (!confirm('לסמן את ההצעה כנמכרה?')) return;
    doAction(id, 'DELETE', '');
  };
  const pauseOffer = (id: string) => doAction(id, 'PATCH', '/pause');
  const resumeOffer = (id: string) => doAction(id, 'PATCH', '/resume');

  const activeOffers = offers.filter((o) => o.status === 'ACTIVE' || o.status === 'PAUSED');
  const pastOffers = offers.filter((o) => o.status !== 'ACTIVE' && o.status !== 'PAUSED');

  const handleSettingsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const body: Record<string, string> = {};
    if (phone !== (user?.phone ?? '')) body.phone = phone;
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    if (Object.keys(body).length === 0) {
      setError('לא בוצע שינוי');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'שגיאה בעדכון');
      } else {
        await refreshUser();
        setSuccess('הפרטים עודכנו בהצלחה');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-gray-500 dark:text-gray-400 dir-ltr">{user.phone}</p>
              )}
              <div className="mt-1">
                <RatingBadge
                  avg={parseFloat(user.ratingAvg)}
                  count={user.ratingCount}
                  isVerified={user.isVerified}
                  isAgency={user.isAgency}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('offers')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'offers'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            המודעות שלי ({activeOffers.length})
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'settings'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            עדכון פרטים
          </button>
        </div>

        {tab === 'offers' ? (
          <div>
            {/* Active/Paused offers */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  הצעות פעילות ({activeOffers.length})
                </h2>
                <Link
                  href="/new-offer"
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  + פרסם הצעה
                </Link>
              </div>

              {loadingOffers ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-20 animate-pulse border border-gray-100 dark:border-gray-700" />
                  ))}
                </div>
              ) : activeOffers.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <p>אין לך הצעות פעילות</p>
                  <Link
                    href="/new-offer"
                    className="inline-block mt-3 text-blue-600 font-medium hover:underline text-sm"
                  >
                    פרסם הצעה ראשונה →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOffers.map((offer) => (
                    <OfferRow
                      key={offer.id}
                      offer={offer}
                      onSold={markSold}
                      onPause={pauseOffer}
                      onResume={resumeOffer}
                      acting={acting === offer.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Past offers */}
            {pastOffers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">הצעות קודמות</h2>
                <div className="space-y-3">
                  {pastOffers.map((offer) => (
                    <OfferRow key={offer.id} offer={offer} acting={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 max-w-md">
            <form onSubmit={handleSettingsSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  מספר טלפון
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="050-1234567"
                  dir="ltr"
                />
              </div>

              {!user.isGoogleOnly && (
                <>
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">שינוי סיסמה (אופציונלי)</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      סיסמה נוכחית
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      סיסמה חדשה
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="לפחות 8 תווים"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function OfferRow({
  offer,
  onSold,
  onPause,
  onResume,
  acting,
}: {
  offer: MyOffer;
  onSold?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  acting: boolean;
}) {
  const isBuy = offer.type === 'BUY';
  const amount = parseFloat(offer.amount).toLocaleString('he-IL');
  const expiresAt = new Date(offer.expiresAt).toLocaleDateString('he-IL');

  const statusLabel: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'פעיל', color: 'bg-green-100 text-green-700' },
    PAUSED: { label: 'מוקפא', color: 'bg-yellow-100 text-yellow-700' },
    MATCHED: { label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'הושלם', color: 'bg-gray-100 text-gray-600' },
    CANCELLED: { label: 'נמכר', color: 'bg-red-100 text-red-600' },
  };
  const s = statusLabel[offer.status] ?? { label: offer.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center gap-4">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          isBuy ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}
      >
        {isBuy ? '↑' : '↓'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {CURRENCY_FLAGS[offer.currency] ?? ''} {amount} {offer.currency}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
            {s.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          📍 {offer.meetingZone} • תוקף: {expiresAt}
        </p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {(offer.status === 'ACTIVE' || offer.status === 'PAUSED') && (
          <Link
            href={`/offers/${offer.id}/edit`}
            className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            ✏️ ערוך
          </Link>
        )}
        {offer.status === 'ACTIVE' && onPause && (
          <button
            onClick={() => onPause(offer.id)}
            disabled={acting}
            className="text-xs text-yellow-600 hover:text-yellow-800 px-3 py-1.5 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
          >
            {acting ? '...' : '❄️ הקפא'}
          </button>
        )}
        {offer.status === 'PAUSED' && onResume && (
          <button
            onClick={() => onResume(offer.id)}
            disabled={acting}
            className="text-xs text-green-600 hover:text-green-800 px-3 py-1.5 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {acting ? '...' : '▶️ הפעל'}
          </button>
        )}
        {(offer.status === 'ACTIVE' || offer.status === 'PAUSED') && onSold && (
          <button
            onClick={() => onSold(offer.id)}
            disabled={acting}
            className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {acting ? '...' : '✓ נמכר'}
          </button>
        )}
      </div>
    </div>
  );
}

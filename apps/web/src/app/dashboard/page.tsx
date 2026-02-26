'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RatingBadge } from '@/components/RatingBadge';
import { CURRENCY_FLAGS } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface MyOffer {
  id: string;
  type: 'BUY' | 'SELL';
  currency: string;
  amount: string;
  meetingZone: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

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

  const cancelOffer = async (id: string) => {
    if (!confirm('לבטל את ההצעה?')) return;
    setCancelling(id);
    await fetch(`${API}/offers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token!}` },
    });
    setCancelling(null);
    loadOffers();
  };

  const activeOffers = offers.filter((o) => o.status === 'ACTIVE');
  const pastOffers = offers.filter((o) => o.status !== 'ACTIVE');

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-900">💱 חלפן</Link>
          <div className="flex gap-3 items-center">
            <Link
              href="/new-offer"
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              + פרסם הצעה
            </Link>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
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

        {/* Active offers */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            הצעות פעילות ({activeOffers.length})
          </h2>
          {loadingOffers ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : activeOffers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
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
                  onCancel={cancelOffer}
                  cancelling={cancelling === offer.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past offers */}
        {pastOffers.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">הצעות קודמות</h2>
            <div className="space-y-3">
              {pastOffers.map((offer) => (
                <OfferRow key={offer.id} offer={offer} cancelling={false} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function OfferRow({
  offer,
  onCancel,
  cancelling,
}: {
  offer: MyOffer;
  onCancel?: (id: string) => void;
  cancelling: boolean;
}) {
  const isBuy = offer.type === 'BUY';
  const amount = parseFloat(offer.amount).toLocaleString('he-IL');
  const expiresAt = new Date(offer.expiresAt).toLocaleDateString('he-IL');

  const statusLabel: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'פעיל', color: 'bg-green-100 text-green-700' },
    MATCHED: { label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'הושלם', color: 'bg-gray-100 text-gray-600' },
    CANCELLED: { label: 'בוטל', color: 'bg-red-100 text-red-600' },
  };
  const s = statusLabel[offer.status] ?? { label: offer.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
          isBuy ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}
      >
        {isBuy ? '↑' : '↓'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {CURRENCY_FLAGS[offer.currency] ?? ''} {amount} {offer.currency}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
            {s.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          📍 {offer.meetingZone} • תוקף: {expiresAt}
        </p>
      </div>

      {onCancel && offer.status === 'ACTIVE' && (
        <button
          onClick={() => onCancel(offer.id)}
          disabled={cancelling}
          className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {cancelling ? '...' : 'בטל'}
        </button>
      )}
    </div>
  );
}

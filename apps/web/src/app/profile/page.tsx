'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function ProfilePage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

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

  if (authLoading || !user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const body: Record<string, string> = {};
    if (phone !== (user.phone ?? '')) body.phone = phone;
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-900">💱 חלפן</Link>
          <p className="text-gray-500 mt-2">עדכון פרטים</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6 text-sm text-gray-600">
            <span className="font-medium">{user.firstName} {user.lastName}</span>
            <span className="text-gray-400 mr-2">{user.email}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                מספר טלפון
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>

            {!user.isGoogleOnly && (
              <>
                <hr className="border-gray-100" />
                <p className="text-xs text-gray-400">שינוי סיסמה (אופציונלי)</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    סיסמה נוכחית
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="לפחות 8 תווים"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
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
      </div>
    </div>
  );
}

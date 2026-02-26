'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('forex_token', token);
      // Trigger a full reload so AuthContext re-reads the token
      window.location.href = '/dashboard';
    } else {
      router.replace('/login');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-3">💱</div>
        <p className="text-gray-500">מתחבר...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">טוען...</p>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}

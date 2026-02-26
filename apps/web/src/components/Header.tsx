'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-2xl font-bold text-blue-900">💱 חלפן</span>
          <span className="text-xs text-gray-500">החלפת מט"מ בין אנשים — בשער יציג</span>
        </Link>

        {!loading && (
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <Link
                  href="/new-offer"
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  + פרסם הצעה
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {user.firstName} {user.lastName.charAt(0)}.
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  יציאה
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  התחבר
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  הצטרף
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

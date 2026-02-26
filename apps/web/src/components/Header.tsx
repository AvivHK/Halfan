'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function Header() {
  const { user, logout, loading } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-2xl font-bold text-blue-900 dark:text-blue-400">💱 חלפן</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">החלפת מט"מ בין אנשים — בשער יציג</span>
        </Link>

        <div className="flex gap-3 items-center">
          <button
            onClick={toggle}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="החלף מצב תצוגה"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {!loading && (
            <>
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {user.firstName} {user.lastName.charAt(0)}.
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    יציאה
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}

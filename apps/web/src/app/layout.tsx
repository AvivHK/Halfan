import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'חלפן — החלפת מט"ח בין אנשים',
  description: 'פלטפורמה P2P להחלפת מטבע חוץ במזומן לפי שער יציג',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { fetchRates } from '@/lib/api';
import { RatesBar } from '@/components/RatesBar';
import { Header } from '@/components/Header';
import { OffersList } from '@/components/OffersList';

export default async function HomePage() {
  const rates = await fetchRates(['USD', 'EUR', 'GBP', 'JPY', 'CHF']);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RatesBar rates={rates} />
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">הצעות פעילות</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            כל המחירים לפי שער יציג רשמי של בנק ישראל • ללא עמלה לפלטפורמה
          </p>
        </div>

        <OffersList />
      </main>

      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          <p>חלפן — פלטפורמה P2P להחלפת מטבע חוץ</p>
          <p className="mt-1">כל ההחלפות הן בין אנשים פרטיים • הפלטפורמה אינה צד לעסקה</p>
        </div>
      </footer>
    </div>
  );
}

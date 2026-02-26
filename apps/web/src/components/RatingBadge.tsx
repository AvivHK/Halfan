interface Props {
  avg: number;
  count: number;
  isVerified?: boolean;
  isAgency?: boolean;
}

function getBadgeColor(avg: number, count: number) {
  if (count < 3) return 'bg-gray-100 text-gray-500';
  if (avg >= 4.2) return 'bg-green-100 text-green-700';
  if (avg >= 3.0) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function getStars(avg: number) {
  const full = Math.floor(avg);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export function RatingBadge({ avg, count, isVerified, isAgency }: Props) {
  const color = getBadgeColor(avg, count);
  const numericAvg = Number(avg);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isAgency && (
        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          סוכנות
        </span>
      )}
      {isVerified && (
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          ✓ מאומת
        </span>
      )}
      {count >= 3 ? (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
          {getStars(numericAvg)} ({count})
        </span>
      ) : (
        <span className="text-xs text-gray-400">חדש</span>
      )}
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchRates(currencies?: string[]) {
  const qs = currencies ? `?currencies=${currencies.join(',')}` : '';
  const res = await fetch(`${API}/rates${qs}`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchOffers(params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  currency?: string;
  type?: string;
  token?: string;
}) {
  const qs = new URLSearchParams();
  if (params.lat !== undefined) qs.set('lat', String(params.lat));
  if (params.lng !== undefined) qs.set('lng', String(params.lng));
  if (params.radiusKm !== undefined) qs.set('radiusKm', String(params.radiusKm));
  if (params.currency) qs.set('currency', params.currency);
  if (params.type) qs.set('type', params.type);

  const headers: HeadersInit = {};
  if (params.token) headers['Authorization'] = `Bearer ${params.token}`;

  const res = await fetch(`${API}/offers?${qs}`, { cache: 'no-store', headers });
  if (!res.ok) return [];
  return res.json();
}

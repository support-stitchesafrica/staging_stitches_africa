/**
 * Currency Conversion API Route
 * Fetches live exchange rates from ExchangeRate-API with 1-hour in-memory cache.
 * Falls back to hardcoded rates if the API is unavailable or key is not set.
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Fallback rates (used when live API is unavailable) ───────────────────────
const FALLBACK_RATES: Record<string, number> = {
  'USD-NGN': 1600,
  'USD-GHS': 15.5,
  'USD-KES': 129,
  'USD-ZAR': 18.5,
  'USD-EGP': 49,
  'USD-EUR': 0.85,
  'USD-GBP': 0.73,
  'USD-CAD': 1.35,
  'USD-AUD': 1.55,
  'USD-JPY': 150,
  'USD-CNY': 7.3,
  'USD-INR': 83,
  'USD-BRL': 5.2,
  'USD-MXN': 17.5,
  'USD-CHF': 0.88,
  'USD-SEK': 10.5,
  'USD-NOK': 10.8,
  'USD-DKK': 6.8,
  'USD-PLN': 4.1,
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;

async function getLiveRates(): Promise<{ rates: Record<string, number>; source: 'live' | 'fallback' }> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  // Return cached rates if still fresh
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return { rates: cachedRates, source: 'live' };
  }

  if (!apiKey) {
    console.warn('[currency] EXCHANGE_RATE_API_KEY not set — using fallback rates');
    return { rates: FALLBACK_RATES, source: 'fallback' };
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/5911a93789727af0b42446a9/latest/USD`,
      { next: { revalidate: 0 } } // disable Next.js fetch cache; we manage our own
    );

    if (!res.ok) {
      throw new Error(`ExchangeRate-API responded with ${res.status}`);
    }

    const data = await res.json();

    if (data.result !== 'success') {
      throw new Error(`ExchangeRate-API error: ${data['error-type']}`);
    }

    // Build our key format (USD-XXX) from the response
    const rates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(data.conversion_rates as Record<string, number>)) {
      rates[`USD-${currency}`] = rate;
    }

    cachedRates = rates;
    cacheTimestamp = Date.now();

    return { rates, source: 'live' };
  } catch (err) {
    console.error('[currency] Failed to fetch live rates, using fallback:', err);
    return { rates: FALLBACK_RATES, source: 'fallback' };
  }
}

// ─── GET /api/currency/convert?from=USD&to=NGN&amount=100 ─────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = (searchParams.get('from') || 'USD').toUpperCase();
    const to = (searchParams.get('to') || 'NGN').toUpperCase();
    const amount = parseFloat(searchParams.get('amount') || '1');

    const { rates, source } = await getLiveRates();
    const rateKey = `${from}-${to}`;
    const rate = rates[rateKey];

    if (!rate) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${from} to ${to}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      from,
      to,
      rate,
      originalAmount: amount,
      convertedAmount: amount * rate,
      source,
      lastUpdated: new Date(cacheTimestamp || Date.now()).toISOString(),
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json({ error: 'Failed to convert currency' }, { status: 500 });
  }
}

// ─── POST /api/currency/convert  { prices: number[], fromCurrency, toCurrency } ─
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prices, fromCurrency = 'USD', toCurrency = 'NGN' } = body;

    if (!Array.isArray(prices)) {
      return NextResponse.json({ error: 'Prices must be an array' }, { status: 400 });
    }

    const { rates, source } = await getLiveRates();
    const rateKey = `${String(fromCurrency).toUpperCase()}-${String(toCurrency).toUpperCase()}`;
    const rate = rates[rateKey];

    if (!rate) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${fromCurrency} to ${toCurrency}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fromCurrency,
      toCurrency,
      rate,
      prices: prices.map((price: number) => ({
        original: price,
        converted: price * rate,
        currency: toCurrency,
      })),
      source,
      lastUpdated: new Date(cacheTimestamp || Date.now()).toISOString(),
    });
  } catch (error) {
    console.error('Bulk currency conversion error:', error);
    return NextResponse.json({ error: 'Failed to convert currencies' }, { status: 500 });
  }
}

/**
 * Currency Conversion API Route
 * Provides exchange rates for currency conversion
 */

import { NextRequest, NextResponse } from 'next/server';

// Hardcoded exchange rates (in production, these would come from a real API)
const exchangeRates: { [key: string]: number } = {
  'USD-NGN': 1350,  // 1 USD = 1350 NGN
  'USD-GHS': 15.5,  // 1 USD = 15.5 GHS
  'USD-KES': 129,   // 1 USD = 129 KES
  'USD-ZAR': 18.5,  // 1 USD = 18.5 ZAR
  'USD-EGP': 49,    // 1 USD = 49 EGP
  'USD-EUR': 0.85,  // 1 USD = 0.85 EUR
  'USD-GBP': 0.73,  // 1 USD = 0.73 GBP
  'USD-CAD': 1.35,  // 1 USD = 1.35 CAD
  'USD-AUD': 1.55,  // 1 USD = 1.55 AUD
  'USD-JPY': 150,   // 1 USD = 150 JPY
  'USD-CNY': 7.3,   // 1 USD = 7.3 CNY
  'USD-INR': 83,    // 1 USD = 83 INR
  'USD-BRL': 5.2,   // 1 USD = 5.2 BRL
  'USD-MXN': 17.5,  // 1 USD = 17.5 MXN
  'USD-CHF': 0.88,  // 1 USD = 0.88 CHF
  'USD-SEK': 10.5,  // 1 USD = 10.5 SEK
  'USD-NOK': 10.8,  // 1 USD = 10.8 NOK
  'USD-DKK': 6.8,   // 1 USD = 6.8 DKK
  'USD-PLN': 4.1,   // 1 USD = 4.1 PLN
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'NGN';
    const amount = parseFloat(searchParams.get('amount') || '1');

    const rateKey = `${from}-${to}`;
    const rate = exchangeRates[rateKey];

    if (!rate) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${from} to ${to}` },
        { status: 404 }
      );
    }

    const convertedAmount = amount * rate;

    return NextResponse.json({
      success: true,
      from,
      to,
      rate,
      originalAmount: amount,
      convertedAmount,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prices, fromCurrency = 'USD', toCurrency = 'NGN' } = body;

    if (!Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'Prices must be an array' },
        { status: 400 }
      );
    }

    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = exchangeRates[rateKey];

    if (!rate) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${fromCurrency} to ${toCurrency}` },
        { status: 404 }
      );
    }

    const convertedPrices = prices.map((price: number) => ({
      original: price,
      converted: price * rate,
      currency: toCurrency
    }));

    return NextResponse.json({
      success: true,
      fromCurrency,
      toCurrency,
      rate,
      prices: convertedPrices,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bulk currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currencies' },
      { status: 500 }
    );
  }
}
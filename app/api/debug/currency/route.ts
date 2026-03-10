/**
 * Debug Currency API
 * Test currency conversion functionality
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const price = parseFloat(searchParams.get('price') || '29.99');
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'NGN';

    // Test our currency conversion API
    const conversionResponse = await fetch(
      `${request.nextUrl.origin}/api/currency/convert?from=${from}&to=${to}&amount=${price}`
    );
    
    const conversionData = await conversionResponse.json();

    return NextResponse.json({
      success: true,
      input: { price, from, to },
      conversion: conversionData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug currency error:', error);
    return NextResponse.json(
      { error: 'Failed to test currency conversion' },
      { status: 500 }
    );
  }
}
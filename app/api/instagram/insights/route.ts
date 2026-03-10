import { NextResponse } from 'next/server';
import { getInstagramInsights } from '@/lib/instagram/instagram-insights';

export async function GET() {
  try {
    const insights = await getInstagramInsights();
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error in Instagram insights API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram insights' },
      { status: 500 }
    );
  }
}

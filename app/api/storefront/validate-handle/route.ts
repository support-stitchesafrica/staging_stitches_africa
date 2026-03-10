/**
 * Handle Validation API
 * Validates storefront handle availability and format
 * 
 * Validates: Requirements 1.1, 1.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateHandle } from '@/lib/storefront/url-service';

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json();

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Handle is required and must be a string' 
        },
        { status: 400 }
      );
    }

    const result = await validateHandle(handle);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error validating handle:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json(
      { error: 'Handle parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await validateHandle(handle);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating handle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
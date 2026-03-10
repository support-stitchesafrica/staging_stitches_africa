import { NextRequest, NextResponse } from 'next/server';
import { createStorefront, CreateStorefrontRequest } from '@/lib/storefront/storefront-creation-service';

export async function POST(request: NextRequest) {
  try {
    const body: CreateStorefrontRequest = await request.json();
    
    const { vendorId, handle } = body;
    
    if (!vendorId || !handle) {
      return NextResponse.json({
        success: false,
        error: 'vendorId and handle are required'
      }, { status: 400 });
    }

    const result = await createStorefront(body);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        storefrontId: result.storefrontId,
        message: 'Storefront created successfully',
        url: `/store/${handle}`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in storefront creation API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create storefront'
    }, { status: 500 });
  }
}
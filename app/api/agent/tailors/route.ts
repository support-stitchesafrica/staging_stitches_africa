import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Get all tailors using Admin SDK with optimized query
    let query = adminDb.collection("staging_tailors").select(
      'email', 'brand_name', 'brandName', 'first_name', 'last_name', 
      'phone_number', 'phoneNumber', 'city', 'state', 'country', 
      'wallet', 'ratings', 'is_disabled', 'identity-verification', 
      'company-verification', 'company-address-verification', 
      'updatedAt', 'featured_works', 'type', 'brand_logo'
    );

    const snapshot = await query.get();
    
    let tailors = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: doc.id,
        email: data.email || '',
        brand_name: data.brand_name || data.brandName || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || data.phoneNumber || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        wallet: data.wallet || 0,
        ratings: data.ratings || 0,
        is_disabled: data.is_disabled || false,
        status: data.is_disabled === true ? 'disabled' : 'active',
        verification_status: data['identity-verification']?.status || 'pending',
        company_verification: data['company-verification']?.status || 'pending',
        address_verification: data['company-address-verification']?.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
        featured_works: data.featured_works || [],
        type: data.type || [],
        brand_logo: data.brand_logo || ''
      };
    }).filter((tailor: any) => {
      return tailor.is_disabled !== true;
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tailors = tailors.filter((tailor: any) => 
        tailor.brand_name?.toLowerCase().includes(searchLower) ||
        tailor.first_name?.toLowerCase().includes(searchLower) ||
        tailor.last_name?.toLowerCase().includes(searchLower) ||
        tailor.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status) {
      tailors = tailors.filter((tailor: any) => tailor.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTailors = tailors.slice(startIndex, endIndex);

    const response = NextResponse.json({
      success: true,
      data: paginatedTailors,
      pagination: {
        page,
        pageSize,
        total: tailors.length,
        totalPages: Math.ceil(tailors.length / pageSize),
        hasNext: page * pageSize < tailors.length,
        hasPrev: page > 1
      }
    });
    
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    response.headers.set('CDN-Cache-Control', 'max-age=30');
    
    return response;
  } catch (error) {
    console.error('Error fetching tailors:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tailors' },
      { status: 500 }
    );
  }
}
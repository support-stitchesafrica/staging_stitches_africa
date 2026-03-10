import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple storefront debug...');

    // Check tailor_works collection first
    const tailorWorksSnapshot = await adminDb
      .collection("staging_tailor_works")
      .limit(10)
      .get();

    console.log(`Found ${tailorWorksSnapshot.size} tailor_works documents`);

    const tailorWorksData = tailorWorksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        tailor_id: data.tailor_id,
        userId: data.userId,
        isActive: data.isActive,
        name: data.name || data.title,
        // Only include key fields
      };
    });

    // Get unique vendor IDs
    const vendorIds = new Set();
    tailorWorksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.tailor_id) vendorIds.add(data.tailor_id);
      if (data.userId) vendorIds.add(data.userId);
    });

    // Check shop_activities
    const activitiesSnapshot = await adminDb
      .collection("staging_shop_activities")
      .limit(10)
      .get();

    console.log(`Found ${activitiesSnapshot.size} shop_activities documents`);

    const activitiesData = activitiesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        activity_type: data.activity_type || data.activityType,
        tailor_id: data.tailor_id,
        userId: data.userId || data.user_id,
        timestamp: data.timestamp,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        tailorWorksCount: tailorWorksSnapshot.size,
        activitiesCount: activitiesSnapshot.size,
        uniqueVendorIds: Array.from(vendorIds),
        vendorCount: vendorIds.size
      },
      samples: {
        tailorWorks: tailorWorksData,
        activities: activitiesData
      }
    });

  } catch (error) {
    console.error('❌ Error in simple debug:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
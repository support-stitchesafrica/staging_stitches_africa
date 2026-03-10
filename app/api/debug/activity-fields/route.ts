import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking activity fields...');

    // Get a few activities to see their structure
    const activitiesSnapshot = await adminDb
      .collection("staging_shop_activities")
      .limit(5)
      .get();

    console.log(`Found ${activitiesSnapshot.size} activities`);

    const activitiesData = activitiesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        allFields: Object.keys(data),
        sampleData: data
      };
    });

    return NextResponse.json({
      success: true,
      count: activitiesSnapshot.size,
      activities: activitiesData
    });

  } catch (error) {
    console.error('❌ Error checking activity fields:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check activity fields',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
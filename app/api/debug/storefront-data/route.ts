import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting storefront data debug...');

    // Check tailor_works collection
    console.log('📊 Checking tailor_works collection...');
    const tailorWorksSnapshot = await adminDb
      .collection("staging_tailor_works")
      .limit(5)
      .get();

    const tailorWorksData = tailorWorksSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    console.log(`Found ${tailorWorksSnapshot.size} tailor_works documents`);

    // Check users collection
    console.log('👥 Checking users collection...');
    const usersSnapshot = await adminDb
      .collection("staging_users")
      .limit(5)
      .get();

    const usersData = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      data: {
        displayName: doc.data().displayName,
        businessName: doc.data().businessName,
        name: doc.data().name,
        role: doc.data().role,
        // Only include relevant fields for debugging
      }
    }));

    console.log(`Found ${usersSnapshot.size} users documents`);

    // Check shop_activities collection
    console.log('🛍️ Checking shop_activities collection...');
    const activitiesSnapshot = await adminDb
      .collection("staging_shop_activities")
      .limit(5)
      .get();

    const activitiesData = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    console.log(`Found ${activitiesSnapshot.size} shop_activities documents`);

    // Check for storefronts collection
    console.log('🏪 Checking storefronts collection...');
    let storefrontsData = [];
    try {
      const storefrontsSnapshot = await adminDb
        .collection("staging_storefronts")
        .limit(5)
        .get();

      storefrontsData = storefrontsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      console.log(`Found ${storefrontsSnapshot.size} storefronts documents`);
    } catch (error) {
      console.log('No storefronts collection found');
    }

    // Get unique tailor_ids from tailor_works
    const uniqueTailorIds = new Set();
    tailorWorksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.tailor_id) uniqueTailorIds.add(data.tailor_id);
      if (data.userId) uniqueTailorIds.add(data.userId);
    });

    console.log(`Found ${uniqueTailorIds.size} unique vendor/tailor IDs`);

    return NextResponse.json({
      summary: {
        tailorWorksCount: tailorWorksSnapshot.size,
        usersCount: usersSnapshot.size,
        activitiesCount: activitiesSnapshot.size,
        storefrontsCount: storefrontsData.length,
        uniqueVendorIds: uniqueTailorIds.size,
        vendorIds: Array.from(uniqueTailorIds)
      },
      samples: {
        tailorWorks: tailorWorksData,
        users: usersData,
        activities: activitiesData,
        storefronts: storefrontsData
      }
    });

  } catch (error) {
    console.error('❌ Error debugging storefront data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug storefront data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
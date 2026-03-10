import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  console.log('=== DEBUG COLLECTIONS API CALLED ===');
  
  try {
    // List all collections in the database
    const collections = await adminDb.listCollections();
    console.log('Available collections:', collections.map(c => c.id));
    
    // Check specific collections we're interested in
    const collectionChecks = [
      'tailors',
      'tailor', 
      'tailor_works',
      'tailorWorks',
      'works',
      'products',
      'vendors'
    ];
    
    const results: any = {};
    
    for (const collectionName of collectionChecks) {
      try {
        const collection = adminDb.collection(collectionName);
        const snapshot = await collection.limit(5).get();
        console.log(`${collectionName}: ${snapshot.size} documents`);
        
        results[collectionName] = {
          count: snapshot.size,
          sampleDocuments: snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }))
        };
        
        // Log first document structure if exists
        if (snapshot.size > 0) {
          console.log(`Sample ${collectionName} document:`, snapshot.docs[0].data());
        }
      } catch (error: any) {
        console.log(`Error accessing ${collectionName}:`, error);
        results[collectionName] = {
          error: error.message,
          count: 0
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Collection debug information',
      availableCollections: collections.map(c => c.id),
      collectionDetails: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
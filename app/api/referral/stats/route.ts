/**
 * Referral Stats API Route
 * Provides referral program statistics for the landing page
 */

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Referral Stats API Route Called ===');
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers));
    
    // Log Firebase Admin initialization
    console.log('Firebase Admin DB initialized:', !!adminDb);
    
    if (!adminDb) {
      throw new Error('Firebase Admin DB not initialized');
    }
    
    console.log('Fetching referral stats from Firestore...');
    
    // Fetch real-time stats from Firestore
    console.log('Querying referralUsers collection...');
    const referrersSnapshot = await adminDb.collection("staging_referralUsers").get();
    console.log('Query completed successfully');
    
    const totalReferrers = referrersSnapshot.size;
    console.log(`Found ${totalReferrers} referrers`);

    let totalRewards = 0;
    let totalReferrals = 0;

    console.log('Processing documents...');
    referrersSnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        console.log(`Processing document ${doc.id}:`, data);
        totalRewards += data.totalEarnings || 0;
        totalReferrals += data.totalReferrals || 0;
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
      }
    });

    const successRate = totalReferrers > 0 ? Math.round((totalReferrals / totalReferrers) * 100) : 0;
    
    const stats = {
      totalReferrers,
      totalRewards,
      successRate,
    };
    
    console.log('Referral stats:', stats);

    const response = {
      success: true,
      stats,
    };
    
    console.log('Sending response:', response);
    
    return Response.json(response);
  } catch (error) {
    console.error('=== ERROR in Referral Stats API Route ===');
    console.error('Error fetching referral stats:', error);
    
    // Try to get more detailed error information
    let errorMessage = 'Unknown error';
    let errorStack = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
      
      // Log additional Firebase-specific error information
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
      if ('details' in error) {
        console.error('Error details:', (error as any).details);
      }
    }
    
    const errorResponse = {
      success: false,
      error: 'Failed to fetch referral stats',
      message: errorMessage,
      stack: errorStack,
    };
    
    console.error('Error response:', errorResponse);
    
    return Response.json(errorResponse, { status: 500 });
  }
}
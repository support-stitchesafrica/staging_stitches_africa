/**
 * Storefront Theme API
 * Handles theme configuration storage and retrieval for merchant storefronts
 * 
 * **Feature: merchant-storefront-upgrade, Property 2: Template Customization Consistency**
 * Validates: Requirements 2.2, 2.4, 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { ThemeConfiguration } from '@/types/storefront';

interface SaveThemeRequest {
  vendorId: string;
  templateId: string;
  theme: ThemeConfiguration;
  heroContent?: {
    title?: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  businessInfo?: {
    businessName?: string;
    description?: string;
    handle?: string;
    slogan?: string;
  };
}

export async function PUT(request: NextRequest) {
  try {
    // For now, skip authentication to avoid issues
    // TODO: Add proper authentication later
    console.log('Theme API: Received PUT request');

    const body: SaveThemeRequest = await request.json();
    console.log('Theme API: Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const { vendorId, templateId, theme, heroContent, businessInfo } = body;
    
    if (!vendorId || !templateId || !theme) {
      console.error('Theme API: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, templateId, theme' },
        { status: 400 }
      );
    }

    // TODO: Add vendor verification when authentication is implemented

    // Validate theme structure
    if (!theme.colors || !theme.typography || !theme.layout) {
      return NextResponse.json(
        { error: 'Invalid theme structure. Must include colors, typography, and layout' },
        { status: 400 }
      );
    }

    // Create theme document
    const themeDoc = {
      vendorId,
      templateId,
      theme,
      heroContent: heroContent || {},
      businessInfo: businessInfo || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Theme API: Saving theme document to Firestore');
    
    // Save to Firestore using vendorId as document ID for easy retrieval
    try {
      await adminDb.collection("staging_storefront_themes").doc(vendorId).set(themeDoc, { merge: true });
      console.log('Theme API: Successfully saved to storefront_themes collection');
    } catch (firestoreError) {
      console.error('Theme API: Error saving to Firestore:', firestoreError);
      throw firestoreError;
    }

    // Also update the theme in the main storefront document for consistency
    try {
      console.log('Theme API: Syncing to storefront document');
      const storefrontQuery = await adminDb
        .collection("staging_storefronts")
        .where('vendorId', '==', vendorId)
        .limit(1)
        .get();

      if (!storefrontQuery.empty) {
        const storefrontDoc = storefrontQuery.docs[0];
        await storefrontDoc.ref.update({
          theme,
          templateId,
          heroContent: heroContent || {},
          businessInfo: businessInfo || {},
          updatedAt: new Date(),
        });
        console.log('Theme API: Successfully synced to storefront document');
      } else {
        console.log('Theme API: No storefront document found for vendor:', vendorId);
      }
    } catch (syncError) {
      console.warn('Theme API: Failed to sync theme to storefront document:', syncError);
      // Don't fail the request if sync fails
    }

    console.log('Theme API: Theme configuration saved successfully');
    return NextResponse.json({
      success: true,
      message: 'Theme configuration saved successfully',
    });
    
  } catch (error) {
    console.error('Error saving theme configuration:', error);
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure you are logged in as a vendor.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('not-found')) {
        return NextResponse.json(
          { error: 'Vendor not found.' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to save theme configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // For now, skip authentication to avoid issues
    // TODO: Add proper authentication later
    console.log('Theme API: Received GET request');

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    
    if (!vendorId) {
      console.error('Theme API: Missing vendorId parameter');
      return NextResponse.json(
        { error: 'Missing required parameter: vendorId' },
        { status: 400 }
      );
    }

    console.log('Theme API: Fetching theme for vendorId:', vendorId);
    // TODO: Add vendor verification when authentication is implemented

    // Get theme configuration from Firestore
    try {
      const themeDoc = await adminDb.collection("staging_storefront_themes").doc(vendorId).get();
      console.log('Theme API: Theme document exists:', themeDoc.exists);
      
      if (!themeDoc.exists) {
        console.log('Theme API: Theme configuration not found for vendor:', vendorId);
        return NextResponse.json(
          { error: 'Theme configuration not found' },
          { status: 404 }
        );
      }

      const themeData = themeDoc.data();
      console.log('Theme API: Retrieved theme data:', themeData ? 'exists' : 'null');
      
      if (!themeData) {
        console.error('Theme API: Theme data is corrupted');
        return NextResponse.json(
          { error: 'Theme data is corrupted' },
          { status: 500 }
        );
      }
      
      console.log('Theme API: Successfully retrieved theme configuration');
      return NextResponse.json({
        success: true,
        data: {
          templateId: themeData.templateId,
          theme: themeData.theme,
          heroContent: themeData.heroContent || {},
          businessInfo: themeData.businessInfo || {},
        },
      });
    } catch (firestoreError) {
      console.error('Theme API: Error fetching from Firestore:', firestoreError);
      throw firestoreError;
    }
    
  } catch (error) {
    console.error('Error fetching theme configuration:', error);
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure you are logged in.' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch theme configuration' },
      { status: 500 }
    );
  }
}
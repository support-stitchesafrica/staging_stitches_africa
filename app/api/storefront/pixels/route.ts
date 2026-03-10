import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SocialPixelConfig } from '@/types/storefront';
import { pixelService } from '@/lib/storefront/pixel-service';

export async function POST(request: NextRequest) {
  try {
    const { vendorId, config } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Validate pixel configurations
    const validationErrors: string[] = [];

    if (config.facebook?.enabled && config.facebook.pixelId) {
      const validation = pixelService.validatePixelId(config.facebook.pixelId, 'facebook');
      if (!validation.isValid) {
        validationErrors.push(`Facebook: ${validation.errors.join(', ')}`);
      }
    }

    if (config.tiktok?.enabled && config.tiktok.pixelId) {
      const validation = pixelService.validatePixelId(config.tiktok.pixelId, 'tiktok');
      if (!validation.isValid) {
        validationErrors.push(`TikTok: ${validation.errors.join(', ')}`);
      }
    }

    if (config.snapchat?.enabled && config.snapchat.pixelId) {
      const validation = pixelService.validatePixelId(config.snapchat.pixelId, 'snapchat');
      if (!validation.isValid) {
        validationErrors.push(`Snapchat: ${validation.errors.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid pixel configuration', details: validationErrors },
        { status: 400 }
      );
    }

    // Get existing storefront configuration
    const storefrontRef = adminDb.collection("staging_storefronts").doc(vendorId);
    const storefrontDoc = await storefrontRef.get();

    if (!storefrontDoc.exists) {
      // Create new storefront configuration with pixels
      await storefrontRef.set({
        vendorId,
        socialPixels: config,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update existing storefront configuration
      await storefrontRef.update({
        socialPixels: config,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pixel configuration saved successfully'
    });

  } catch (error) {
    console.error('Error saving pixel configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Get storefront configuration
    const storefrontRef = adminDb.collection("staging_storefronts").doc(vendorId);
    const storefrontDoc = await storefrontRef.get();

    if (!storefrontDoc.exists) {
      return NextResponse.json({
        socialPixels: {}
      });
    }

    const data = storefrontDoc.data();
    return NextResponse.json({
      socialPixels: data?.socialPixels || {}
    });

  } catch (error) {
    console.error('Error fetching pixel configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
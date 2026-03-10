import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface StorefrontUpdate {
  vendorId: string;
  templateId?: string;
  theme?: any;
  heroContent?: {
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaLink: string;
  };
  businessInfo?: {
    businessName: string;
    description: string;
    handle: string;
    slogan: string;
  };
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const update: StorefrontUpdate = await request.json();
    
    if (!update.vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Use Firebase Admin DB
    const db = adminDb;

    // Get existing storefront configuration
    const storefrontRef = db.collection("staging_storefronts").doc(update.vendorId);
    const storefrontDoc = await storefrontRef.get();
    
    let storefrontData = storefrontDoc.exists ? storefrontDoc.data() : {};
    
    // Ensure storefrontData is not undefined
    if (!storefrontData) {
      storefrontData = {};
    }

    // Merge the updates
    const updatedData: any = {
      ...storefrontData,
      vendorId: update.vendorId,
      updatedAt: new Date(),
      lastSyncAt: new Date(update.timestamp)
    };

    if (update.templateId) {
      updatedData.templateId = update.templateId;
    }

    if (update.theme) {
      updatedData.theme = {
        ...(storefrontData.theme || {}),
        ...update.theme
      };
    }

    if (update.heroContent) {
      updatedData.heroContent = {
        ...(storefrontData.heroContent || {}),
        ...update.heroContent
      };
    }

    if (update.businessInfo) {
      updatedData.businessInfo = {
        ...(storefrontData.businessInfo || {}),
        ...update.businessInfo
      };
      
      // Also update the vendor's profile if handle changed
      if (update.businessInfo.handle) {
        const vendorRef = db.collection('vendors').doc(update.vendorId);
        await vendorRef.update({
          handle: update.businessInfo.handle,
          businessName: update.businessInfo.businessName,
          updatedAt: new Date()
        });
      }
    }

    // Save to Firestore
    await storefrontRef.set(updatedData, { merge: true });

    // Also save to storefront configurations collection for faster access
    const configRef = db.collection('storefrontConfigurations').doc(update.vendorId);
    await configRef.set({
      vendorId: update.vendorId,
      templateId: updatedData.templateId,
      theme: updatedData.theme,
      heroContent: updatedData.heroContent,
      businessInfo: updatedData.businessInfo,
      isPublic: updatedData.isPublic || true,
      updatedAt: new Date(),
      syncedAt: new Date()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Storefront synced successfully',
      timestamp: update.timestamp
    });

  } catch (error) {
    console.error('Error syncing storefront:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync storefront',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Use Firebase Admin DB
    const db = adminDb;

    // Get current storefront configuration
    const storefrontRef = db.collection("staging_storefronts").doc(vendorId);
    const storefrontDoc = await storefrontRef.get();

    if (!storefrontDoc.exists) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No storefront configuration found'
      });
    }

    const data = storefrontDoc.data();
    
    return NextResponse.json({
      success: true,
      data: {
        vendorId: data?.vendorId,
        templateId: data?.templateId,
        theme: data?.theme,
        heroContent: data?.heroContent,
        businessInfo: data?.businessInfo,
        lastSyncAt: data?.lastSyncAt?.toDate?.() || null,
        updatedAt: data?.updatedAt?.toDate?.() || null
      }
    });

  } catch (error) {
    console.error('Error fetching storefront sync data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch storefront data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json();

    if (!handle) {
      return NextResponse.json({
        success: false,
        error: 'Handle is required'
      }, { status: 400 });
    }

    console.log('Fixing storefront:', handle);

    // Find the storefront
    const storefrontQuery = await adminDb
      .collection("staging_storefronts")
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (storefrontQuery.empty) {
      return NextResponse.json({
        success: false,
        error: 'Storefront not found'
      }, { status: 404 });
    }

    const storefrontDoc = storefrontQuery.docs[0];
    const storefrontData = storefrontDoc.data();

    // Fix the storefront data
    const updates: any = {};
    let needsUpdate = false;

    // Ensure isPublic is true
    if (storefrontData.isPublic !== true) {
      updates.isPublic = true;
      needsUpdate = true;
    }

    // Ensure updatedAt exists
    if (!storefrontData.updatedAt) {
      updates.updatedAt = new Date();
      needsUpdate = true;
    }

    // Ensure createdAt exists
    if (!storefrontData.createdAt) {
      updates.createdAt = new Date();
      needsUpdate = true;
    }

    if (needsUpdate) {
      await storefrontDoc.ref.update(updates);
      console.log('Updated storefront with:', updates);
    }

    // Check if theme exists
    let themeFixed = false;
    const themeDoc = await adminDb
      .collection("staging_storefront_themes")
      .doc(storefrontData.vendorId)
      .get();

    if (!themeDoc.exists) {
      // Create default theme
      const defaultTheme = {
        colors: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
          surface: '#F9FAFB',
          border: '#E5E7EB'
        },
        typography: {
          headingFont: 'Montserrat',
          bodyFont: 'Inter',
          sizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem'
          }
        },
        layout: {
          headerStyle: 'modern-clean',
          productCardStyle: 'elegant',
          borderRadius: 'medium',
          shadows: 'subtle',
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem'
          }
        },
        variants: {
          buttonStyle: 'filled',
          cardStyle: 'elevated',
          animationLevel: 'moderate'
        },
        media: {}
      };

      await adminDb.collection("staging_storefront_themes").doc(storefrontData.vendorId).set({
        vendorId: storefrontData.vendorId,
        templateId: storefrontData.templateId || 'default',
        theme: defaultTheme,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      themeFixed = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Storefront fixed successfully',
      fixes: {
        storefrontUpdated: needsUpdate,
        updatesApplied: updates,
        themeCreated: themeFixed
      }
    });

  } catch (error) {
    console.error('Error fixing storefront:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
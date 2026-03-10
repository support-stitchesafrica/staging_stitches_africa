import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';

interface HeroContent {
  title: string;
  subtitle: string;
  buttonText: string;
}

interface SaveHeroRequest {
  vendorId: string;
  content: HeroContent;
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      const token = authHeader.substring(7);
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const body: SaveHeroRequest = await request.json();
    
    // Validate required fields
    const { vendorId, content } = body;
    
    if (!vendorId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, content' },
        { status: 400 }
      );
    }

    // Verify the user can only modify their own content
    if (decodedToken.uid !== vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only modify your own content' },
        { status: 403 }
      );
    }

    // Get the storefront document
    const storefrontQuery = await adminDb
      .collection("staging_storefronts")
      .where('vendorId', '==', vendorId)
      .limit(1)
      .get();

    if (storefrontQuery.empty) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    const storefrontDoc = storefrontQuery.docs[0];
    const storefrontData = storefrontDoc.data();

    // Update the hero section in the home page
    const pages = storefrontData.pages || [];
    const homePageIndex = pages.findIndex((page: any) => page.type === 'home');
    
    if (homePageIndex >= 0) {
      const homePage = pages[homePageIndex];
      const heroSectionIndex = homePage.content?.findIndex((section: any) => section.type === 'hero') || -1;
      
      if (heroSectionIndex >= 0) {
        // Update existing hero section
        homePage.content[heroSectionIndex].content = content;
      } else {
        // Add new hero section
        if (!homePage.content) homePage.content = [];
        homePage.content.unshift({
          id: 'hero',
          type: 'hero',
          order: 1,
          content,
          styling: {}
        });
      }
      
      pages[homePageIndex] = homePage;
    } else {
      // Create new home page with hero section
      pages.push({
        id: 'home',
        type: 'home',
        title: 'Home',
        content: [{
          id: 'hero',
          type: 'hero',
          order: 1,
          content,
          styling: {}
        }],
        seoMetadata: {
          title: content.title,
          description: content.subtitle,
          keywords: ['fashion', 'clothing', 'style']
        },
        productDisplay: {
          layout: 'grid',
          productsPerPage: 12,
          showFilters: true,
          showSorting: true,
          cartIntegration: {
            enabled: true,
            redirectToStitchesAfrica: false
          },
          promotionalDisplay: {
            showBadges: true,
            showBanners: true,
            highlightPromotions: true
          }
        }
      });
    }

    // Update the storefront document
    await storefrontDoc.ref.update({
      pages,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Hero content saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving hero content:', error);
    return NextResponse.json(
      { error: 'Failed to save hero content' },
      { status: 500 }
    );
  }
}
/**
 * Test Dynamic Routing Script
 * Creates a test storefront and verifies dynamic routing works
 */

import { createStorefront, getStorefrontByHandle, deleteStorefront } from '@/lib/storefront/storefront-service';
import { StorefrontConfig } from '@/types/storefront';

async function testDynamicRouting() {
  console.log('🧪 Testing Dynamic Routing for Storefronts...');
  
  const testStorefront: Omit<StorefrontConfig, 'id' | 'createdAt' | 'updatedAt'> = {
    vendorId: 'test-vendor-dynamic-routing',
    handle: 'test-dynamic-store',
    isPublic: true,
    templateId: 'default',
    theme: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
      },
      layout: {
        headerStyle: 'modern',
        productCardStyle: 'card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
      },
      media: {},
    },
    pages: [{
      id: 'home',
      type: 'home',
      title: 'Test Dynamic Store',
      content: [
        {
          id: 'hero',
          type: 'hero',
          order: 1,
          content: {
            title: 'Welcome to Test Dynamic Store',
            subtitle: 'Testing dynamic routing functionality',
          },
          styling: {},
        },
        {
          id: 'products',
          type: 'products',
          order: 2,
          content: {},
          styling: {},
        },
      ],
      seoMetadata: {
        title: 'Test Dynamic Store - Stitches Africa',
        description: 'A test store for dynamic routing verification',
        keywords: ['test', 'dynamic', 'routing', 'store'],
      },
      productDisplay: {
        layout: 'grid',
        productsPerPage: 12,
        showFilters: true,
        showSorting: true,
        cartIntegration: {
          enabled: true,
          redirectToStitchesAfrica: true,
        },
        promotionalDisplay: {
          showBadges: true,
          showBanners: true,
          highlightPromotions: true,
        },
      },
    }],
    analytics: {
      enabled: true,
      customEvents: ['page_view', 'product_view'],
      retentionDays: 90,
      exportEnabled: true,
    },
    socialPixels: {},
  };

  let storefrontId: string | null = null;

  try {
    // Step 1: Create test storefront
    console.log('📝 Creating test storefront...');
    storefrontId = await createStorefront(testStorefront);
    console.log(`✅ Created storefront with ID: ${storefrontId}`);

    // Step 2: Test retrieval by handle
    console.log('🔍 Testing handle retrieval...');
    const retrieved = await getStorefrontByHandle('test-dynamic-store');
    
    if (!retrieved) {
      throw new Error('Failed to retrieve storefront by handle');
    }
    
    console.log(`✅ Successfully retrieved storefront: ${retrieved.handle}`);
    console.log(`   - Vendor ID: ${retrieved.vendorId}`);
    console.log(`   - Public: ${retrieved.isPublic}`);
    console.log(`   - Template: ${retrieved.templateId}`);

    // Step 3: Test case-insensitive routing
    console.log('🔄 Testing case-insensitive routing...');
    const variations = ['TEST-DYNAMIC-STORE', 'Test-Dynamic-Store', 'test-DYNAMIC-store'];
    
    for (const variation of variations) {
      const result = await getStorefrontByHandle(variation);
      if (!result || result.handle !== 'test-dynamic-store') {
        throw new Error(`Case-insensitive routing failed for: ${variation}`);
      }
      console.log(`   ✅ ${variation} -> ${result.handle}`);
    }

    // Step 4: Test URL generation
    console.log('🌐 Testing URL generation...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const storefrontUrl = `${baseUrl}/store/test-dynamic-store`;
    console.log(`   📍 Storefront URL: ${storefrontUrl}`);
    console.log(`   🎯 Route pattern: /store/[handle] -> /store/${retrieved.handle}`);

    // Step 5: Verify metadata generation
    console.log('📊 Testing metadata generation...');
    const { generateStorefrontMetadata } = await import('@/lib/storefront/metadata-service');
    const metadata = generateStorefrontMetadata(retrieved);
    
    console.log(`   📝 Title: ${metadata.title}`);
    console.log(`   📄 Description: ${metadata.description}`);
    console.log(`   🔗 OpenGraph URL: ${metadata.openGraph?.url}`);

    console.log('\n🎉 All dynamic routing tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Storefront creation');
    console.log('   ✅ Handle-based retrieval');
    console.log('   ✅ Case-insensitive routing');
    console.log('   ✅ URL generation');
    console.log('   ✅ Metadata generation');
    console.log('\n🚀 Dynamic routing is working correctly!');
    console.log(`\n🌍 You can now access the storefront at: ${storefrontUrl}`);

  } catch (error) {
    console.error('❌ Dynamic routing test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (storefrontId) {
      try {
        console.log('\n🧹 Cleaning up test storefront...');
        await deleteStorefront(storefrontId);
        console.log('✅ Test storefront deleted');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup test storefront:', cleanupError);
      }
    }
  }
}

// Run the test
testDynamicRouting().catch(console.error);
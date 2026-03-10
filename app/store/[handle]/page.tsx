/**
 * Dynamic Storefront Page
 * Renders individual vendor storefronts at /store/[handle]
 * 
 * Validates: Requirements 1.2, 1.4, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontByHandle } from '@/lib/storefront/storefront-service';
import { generateStorefrontMetadata, generateStorefrontStructuredData } from '@/lib/storefront/metadata-service';
import StorefrontRenderer from '@/components/storefront/StorefrontRenderer';
import { StorefrontClientWrapper } from '@/components/storefront/StorefrontClientWrapper';

interface StorefrontPageProps {
  params: Promise<{
    handle: string;
  }>;
}

// Generate comprehensive metadata for SEO and social sharing
export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { handle } = await params;
  
  let storefront: any = null;
  
  try {
    storefront = await getStorefrontByHandle(handle);
  } catch (error) {
    console.error('Error fetching storefront for metadata:', error);
    return {
      title: 'Store Error - Stitches Africa',
      description: 'There was an error loading the requested store.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  if (!storefront) {
    return {
      title: 'Store Not Found - Stitches Africa',
      description: 'The requested store could not be found on Stitches Africa.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Use the comprehensive metadata service for proper OpenGraph generation
  return generateStorefrontMetadata(storefront);
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { handle } = await params;
  
  let storefront: any = null;
  
  try {
    storefront = await getStorefrontByHandle(handle);
  } catch (error) {
    console.error('Error fetching storefront:', error);
    notFound();
    return;
  }

  // Handle not found storefronts
  if (!storefront) {
    notFound();
    return;
  }

  // Check if storefront is public
  if (!storefront.isPublic) {
    notFound();
    return;
  }

  // Generate structured data for SEO
  const structuredData = generateStorefrontStructuredData(storefront);

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <StorefrontClientWrapper storefront={storefront} />
    </>
  );
}
/**
 * Storefront Metadata Service
 * Generates SEO metadata for storefronts
 * 
 * Validates: Requirements 1.4
 */

import { Metadata } from 'next';
import { StorefrontConfig } from '@/types/storefront';
import { generateStorefrontUrl } from './url-service';

/**
 * Generates comprehensive metadata for a storefront
 */
export function generateStorefrontMetadata(storefront: StorefrontConfig): Metadata {
  const homePage = storefront.pages.find(page => page.type === 'home') || storefront.pages[0];
  const seoMetadata = homePage?.seoMetadata;
  
  // Generate URLs
  const storefrontUrl = generateStorefrontUrl(storefront.handle);
  const canonicalUrl = seoMetadata?.canonicalUrl || storefrontUrl;
  
  // Default values
  const title = seoMetadata?.title || `${storefront.handle} - Stitches Africa Store`;
  const description = seoMetadata?.description || `Shop the latest collection from ${storefront.handle} on Stitches Africa. Discover unique fashion and style.`;
  const keywords = seoMetadata?.keywords || ['fashion', 'clothing', 'style', 'stitches africa', storefront.handle];
  
  // OpenGraph metadata
  const ogTitle = seoMetadata?.ogTitle || title;
  const ogDescription = seoMetadata?.ogDescription || description;
  const ogImage = seoMetadata?.ogImage || storefront.theme.media.logoUrl || '/placeholder-logo.png';
  
  // Twitter card type
  const twitterCard = seoMetadata?.twitterCard || 'summary_large_image';

  return {
    title,
    description,
    keywords: keywords.join(', '),
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // OpenGraph metadata for social sharing
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: storefrontUrl,
      siteName: 'Stitches Africa',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${storefront.handle} store logo`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    
    // Twitter metadata
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
      creator: '@StitchesAfrica',
      site: '@StitchesAfrica',
    },
    
    // Additional metadata
    robots: {
      index: storefront.isPublic,
      follow: storefront.isPublic,
      googleBot: {
        index: storefront.isPublic,
        follow: storefront.isPublic,
      },
    },
    
    // Verification and analytics
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    
    // App-specific metadata
    other: {
      'storefront-id': storefront.id,
      'vendor-id': storefront.vendorId,
      'storefront-handle': storefront.handle,
    },
  };
}

/**
 * Generates JSON-LD structured data for a storefront
 */
export function generateStorefrontStructuredData(storefront: StorefrontConfig) {
  const storefrontUrl = generateStorefrontUrl(storefront.handle);
  const homePage = storefront.pages.find(page => page.type === 'home') || storefront.pages[0];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: homePage?.seoMetadata?.title || `${storefront.handle} Store`,
    description: homePage?.seoMetadata?.description || `Shop from ${storefront.handle} on Stitches Africa`,
    url: storefrontUrl,
    logo: storefront.theme.media.logoUrl,
    image: storefront.theme.media.bannerUrl || storefront.theme.media.logoUrl,
    sameAs: [
      // Social media links could be added here if available in storefront config
    ],
    parentOrganization: {
      '@type': 'Organization',
      name: 'Stitches Africa',
      url: 'https://https://staging-stitches-africa.vercel.app',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${storefrontUrl}?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates product-specific metadata for storefront product pages
 */
export function generateStorefrontProductMetadata(
  storefront: StorefrontConfig,
  product: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    images?: string[];
  }
): Metadata {
  const storefrontUrl = generateStorefrontUrl(storefront.handle);
  const productUrl = `${storefrontUrl}/products/${product.id}`;
  
  const title = `${product.name} - ${storefront.handle} | Stitches Africa`;
  const description = product.description || `Shop ${product.name} from ${storefront.handle} on Stitches Africa`;
  const image = product.images?.[0] || storefront.theme.media.logoUrl || '/placeholder-product.png';
  
  return {
    title,
    description,
    
    alternates: {
      canonical: productUrl,
    },
    
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'Stitches Africa',
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    
    other: {
      'product-id': product.id,
      'storefront-id': storefront.id,
      'vendor-id': storefront.vendorId,
    },
  };
}
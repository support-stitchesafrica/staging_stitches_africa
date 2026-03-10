/**
 * Storefront Product Detail Page
 * Shows detailed product information with add to cart functionality
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontByHandle } from '@/lib/storefront/storefront-service';
import ProductDetailView from '@/components/storefront/ProductDetailView';

interface ProductDetailPageProps {
  params: Promise<{
    handle: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { handle, id } = await params;
  const storefront = await getStorefrontByHandle(handle);

  if (!storefront) {
    return {
      title: 'Product Not Found - Stitches Africa',
      description: 'The requested product could not be found.',
    };
  }

  return {
    title: `Product Details - ${storefront.handle}`,
    description: `View product details in ${storefront.handle} store on Stitches Africa`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { handle, id } = await params;
  
  const storefront = await getStorefrontByHandle(handle);
  
  if (!storefront || !storefront.isPublic) {
    notFound();
    return;
  }

  return (
    <ProductDetailView 
      storefront={storefront}
      productId={id}
    />
  );
}
/**
 * Storefront Cart Page
 * Shows cart items with checkout functionality
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontByHandle } from '@/lib/storefront/storefront-service';
import StorefrontCart from '@/components/storefront/StorefrontCart';

interface CartPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { handle } = await params;
  const storefront = await getStorefrontByHandle(handle);

  if (!storefront) {
    return {
      title: 'Cart - Store Not Found',
      description: 'The requested store could not be found.',
    };
  }

  return {
    title: `Shopping Cart - ${storefront.handle}`,
    description: `Review your items and checkout from ${storefront.handle} store`,
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { handle } = await params;
  
  const storefront = await getStorefrontByHandle(handle);
  
  if (!storefront || !storefront.isPublic) {
    notFound();
    return;
  }

  return (
    <StorefrontCart storefront={storefront} />
  );
}
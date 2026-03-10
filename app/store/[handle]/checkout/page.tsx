/**
 * Storefront Checkout Page
 * Handles checkout process for individual storefronts
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontByHandle } from '@/lib/storefront/storefront-service';
import StorefrontCheckout from '@/components/storefront/StorefrontCheckout';

interface CheckoutPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { handle } = await params;
  const storefront = await getStorefrontByHandle(handle);

  if (!storefront) {
    return {
      title: 'Checkout - Store Not Found',
      description: 'The requested store could not be found.',
    };
  }

  return {
    title: `Checkout - ${storefront.handle}`,
    description: `Complete your purchase from ${storefront.handle} store`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { handle } = await params;
  
  const storefront = await getStorefrontByHandle(handle);
  
  if (!storefront || !storefront.isPublic) {
    notFound();
    return;
  }

  return (
    <StorefrontCheckout storefront={storefront} />
  );
}
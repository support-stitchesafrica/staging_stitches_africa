/**
 * Storefront Checkout Success Page
 * Shows order confirmation after successful checkout
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontByHandle } from '@/lib/storefront/storefront-service';
import StorefrontOrderSuccess from '@/components/storefront/StorefrontOrderSuccess';

interface SuccessPageProps {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export async function generateMetadata({ params }: SuccessPageProps): Promise<Metadata> {
  const { handle } = await params;
  const storefront = await getStorefrontByHandle(handle);

  if (!storefront) {
    return {
      title: 'Order Confirmation - Store Not Found',
      description: 'The requested store could not be found.',
    };
  }

  return {
    title: `Order Confirmation - ${storefront.handle}`,
    description: `Your order from ${storefront.handle} has been confirmed`,
  };
}

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const { handle } = await params;
  const { orderId } = await searchParams;
  
  const storefront = await getStorefrontByHandle(handle);
  
  if (!storefront || !storefront.isPublic) {
    notFound();
    return;
  }

  return (
    <StorefrontOrderSuccess 
      storefront={storefront} 
      orderId={orderId || 'N/A'}
    />
  );
}
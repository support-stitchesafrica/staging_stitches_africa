/**
 * Public Waitlist Landing Page
 * Displays waitlist information and signup form
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';
import WaitlistLanding from '@/components/waitlist/WaitlistLanding';
import { Metadata } from 'next';

interface PageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const waitlist = await WaitlistService.getWaitlistBySlug(params.slug);
    
    if (!waitlist) {
      return {
        title: 'Waitlist Not Found - Stitches Africa',
        description: 'The requested waitlist could not be found.'
      };
    }

    return {
      title: `${waitlist.title} - Waitlist | Stitches Africa`,
      description: waitlist.shortDescription || waitlist.description,
      openGraph: {
        title: waitlist.title,
        description: waitlist.shortDescription || waitlist.description,
        images: [waitlist.bannerImage],
        type: 'website'
      },
      twitter: {
        card: 'summary_large_image',
        title: waitlist.title,
        description: waitlist.shortDescription || waitlist.description,
        images: [waitlist.bannerImage]
      }
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Waitlist - Stitches Africa',
      description: 'Join our exclusive waitlist for upcoming collections.'
    };
  }
}

export default async function WaitlistPage({ params }: PageProps) {
  try {
    // Get waitlist by slug
    const waitlist = await WaitlistService.getWaitlistBySlug(params.slug);
    
    if (!waitlist) {
      notFound();
    }

    // Get products for the waitlist
    const products = await WaitlistService.getWaitlistProducts(waitlist.productIds);

    return <WaitlistLanding waitlist={waitlist} products={products} />;
  } catch (error) {
    console.error('Failed to load waitlist:', error);
    notFound();
  }
}

// Generate static params for published waitlists (optional optimization)
export async function generateStaticParams() {
  try {
    const waitlists = await WaitlistService.getPublishedWaitlists();
    
    return waitlists
      .filter(waitlist => waitlist.slug)
      .map(waitlist => ({
        slug: waitlist.slug!
      }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRandomAfricanFashionUnsplash } from '@/components/waitlist/useRandomAfricanFashionUnsplash';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  slideCount?: number;
  intervalMs?: number;
};

export function FashionWaitlistCarousel({
  className,
  slideCount = 6,
  intervalMs = 4500,
}: Props) {
  const images = useRandomAfricanFashionUnsplash(slideCount);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0) {
    return (
      <div
        className={cn('absolute inset-0 bg-stone-800', className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn('absolute inset-0 z-0 overflow-hidden bg-stone-900', className)}
      aria-roledescription="carousel"
      aria-label="African fashion photography"
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          role="group"
          aria-roledescription="slide"
          aria-hidden={i !== active}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            i === active ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            priority={i === 0}
            unoptimized
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}
    </div>
  );
}

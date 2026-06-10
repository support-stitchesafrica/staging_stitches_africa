'use client';

import Image from 'next/image';
import { AFRICAN_FASHION_UNSPLASH_POOL } from '@/components/waitlist/african-fashion-unsplash';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

/** Duplicated strip for seamless CSS loop */
const STRIP = [...AFRICAN_FASHION_UNSPLASH_POOL, ...AFRICAN_FASHION_UNSPLASH_POOL];

export function FashionImageMarquee({ className }: Props) {
  return (
    <div
      className={cn('relative overflow-hidden border-y border-[#1a1a1a]/10 bg-[#1a1a1a]', className)}
      aria-hidden
    >
      <div className="flex w-max animate-fashion-marquee gap-0">
        {STRIP.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="relative h-36 w-48 shrink-0 sm:h-44 sm:w-56"
          >
            <Image
              src={img.src}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="224px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

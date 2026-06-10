'use client';

import Image from 'next/image';
import { useRandomAfricanFashionUnsplash } from '@/components/waitlist/useRandomAfricanFashionUnsplash';

function thumbUrl(src: string) {
  return src.replace('w=1920', 'w=320').replace('h=1080', 'h=320');
}

type Props = {
  count?: number;
  className?: string;
};

export function WaitlistFashionThumbStrip({ count = 8, className }: Props) {
  const images = useRandomAfricanFashionUnsplash(count);

  if (images.length === 0) return null;

  return (
    <section
      className={className ?? 'border-b border-[#2a3542]/10 bg-[#2a3542] py-8 sm:py-10'}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="text-center text-sm text-[#c5cdd6]">
          A few looks your team could shop for
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {images.map((img) => (
            <li
              key={img.src}
              className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#f5f3ef]/20 sm:h-16 sm:w-16"
            >
              <Image
                src={thumbUrl(img.src)}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

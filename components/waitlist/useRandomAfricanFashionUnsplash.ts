'use client';

import { useMemo } from 'react';
import {
  pickRandomAfricanFashionUnsplash,
  type AfricanFashionUnsplashImage,
} from '@/components/waitlist/african-fashion-unsplash';

export type { AfricanFashionUnsplashImage };

export function useRandomAfricanFashionUnsplash(count: number): AfricanFashionUnsplashImage[] {
  return useMemo(() => pickRandomAfricanFashionUnsplash(count), [count]);
}

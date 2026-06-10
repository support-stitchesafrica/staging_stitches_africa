'use client';

import { useMemo } from 'react';
import { pickRandomUnsplash, type BNPL_UNSPLASH_POOL } from '@/components/waitlist/bnpl-waitlist-unsplash';

export type UnsplashPick = (typeof BNPL_UNSPLASH_POOL)[number];

export function useRandomUnsplash(count: number): UnsplashPick[] {
  return useMemo(() => pickRandomUnsplash(count), [count]);
}

/** Curated lifestyle / fashion Unsplash photos — shuffled client-side per visit */
export const BNPL_UNSPLASH_POOL = [
  {
    src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
    alt: 'Fashion editorial',
  },
  {
    src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop&q=80',
    alt: 'Street style',
  },
  {
    src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop&q=80',
    alt: 'Wardrobe',
  },
  {
    src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop&q=80',
    alt: 'Shopping',
  },
  {
    src: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800&h=1000&fit=crop&q=80',
    alt: 'Contemporary fashion',
  },
  {
    src: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop&q=80',
    alt: 'Lifestyle',
  },
  {
    src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop&q=80',
    alt: 'Runway',
  },
  {
    src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&q=80',
    alt: 'Retail',
  },
  {
    src: 'https://images.unsplash.com/photo-1523381210438-271e8be1f52b?w=800&h=1000&fit=crop&q=80',
    alt: 'Style portrait',
  },
  {
    src: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=600&fit=crop&q=80',
    alt: 'Urban fashion',
  },
] as const;

export function pickRandomUnsplash(count: number) {
  const pool = [...BNPL_UNSPLASH_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

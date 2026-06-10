/** Curated African fashion photography on Unsplash — shuffled per visit on /waitlist */
export const AFRICAN_FASHION_UNSPLASH_POOL = [
  {
    src: 'https://images.unsplash.com/photo-1648328414427-fc902f51808c?w=1920&h=1080&fit=crop&q=80',
    alt: 'Couple in traditional Ghanaian clothing, Accra',
  },
  {
    src: 'https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=1920&h=1080&fit=crop&q=80',
    alt: 'Woman in traditional African costume and jewelry',
  },
  {
    src: 'https://images.unsplash.com/photo-1766107349536-c6de9ab38dcd?w=1920&h=1080&fit=crop&q=80',
    alt: 'Woman in traditional African attire with beaded jewelry, Ghana',
  },
  {
    src: 'https://images.unsplash.com/photo-1770777352873-d7eac408af7e?w=1920&h=1080&fit=crop&q=80',
    alt: 'Woman in elaborate African headdress and red dress, Lagos',
  },
  {
    src: 'https://images.unsplash.com/photo-1766193228857-e6e82a6c367c?w=1920&h=1080&fit=crop&q=80',
    alt: 'Young woman in patterned African print dress',
  },
  {
    src: 'https://images.unsplash.com/photo-1757140448722-f8511eb97cf1?w=1920&h=1080&fit=crop&q=80',
    alt: 'African woman with braided hair and statement earrings',
  },
  {
    src: 'https://images.unsplash.com/photo-1757140448528-332c4fa2a8a6?w=1920&h=1080&fit=crop&q=80',
    alt: 'Woman in colorful beaded African headband and jewelry',
  },
  {
    src: 'https://images.unsplash.com/photo-1757140448469-b89958de834d?w=1920&h=1080&fit=crop&q=80',
    alt: 'African fashion accessories and beaded styling',
  },
  {
    src: 'https://images.unsplash.com/photo-1711925844152-8c9d51163ba2?w=1920&h=1080&fit=crop&q=80',
    alt: 'African fashion editorial, woman in black dress, Lagos',
  },
  {
    src: 'https://images.unsplash.com/photo-1662893992279-9ed6cf05d6eb?w=1920&h=1080&fit=crop&q=80',
    alt: 'African fashion editorial, two women, Lagos',
  },
  {
    src: 'https://images.unsplash.com/photo-1770777353032-282569e14e3b?w=1920&h=1080&fit=crop&q=80',
    alt: 'African fashion model in elaborate costume and headdress',
  },
  {
    src: 'https://images.unsplash.com/photo-1745669702821-b994a8b9ad78?w=1920&h=1080&fit=crop&q=80',
    alt: 'Elegant African costume portrait, Nigeria',
  },
  {
    src: 'https://images.unsplash.com/photo-1757942653932-a83fe21fceed?w=1920&h=1080&fit=crop&q=80',
    alt: 'African fashion beauty portrait with jewelry, Accra',
  },
] as const;

export type AfricanFashionUnsplashImage = (typeof AFRICAN_FASHION_UNSPLASH_POOL)[number];

export function pickRandomAfricanFashionUnsplash(count: number): AfricanFashionUnsplashImage[] {
  const pool = [...AFRICAN_FASHION_UNSPLASH_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

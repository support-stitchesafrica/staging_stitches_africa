#!/usr/bin/env node

/**
 * Staging Data Seeder — ONE-TIME SCRIPT
 *
 * Populates Firebase Firestore staging collections with realistic mock data
 * for the Stitches Africa platform.
 *
 * Collections seeded:
 *   - staging_users          (5 tailor accounts: 3 main + 2 sub)
 *   - staging_tailors        (3 main tailor profiles)
 *   - staging_tailor_works   (10 products: bespoke + ready-to-wear)
 *   - staging_tailor_works_local (mirror of staging_tailor_works)
 *
 * IMPORTANT: This script is idempotent via a sentinel document at
 * `_seed_meta/staging-data-seeder`. To re-run, delete that document
 * from the Firestore Console first.
 *
 * Run with:
 *   npx ts-node scripts/seed-staging-data.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { adminDb } from '../lib/firebase-admin';

const uuidv4 = () => crypto.randomUUID();

const TARGET_PROJECT = 'stitches-africa';
const COLLECTIONS = [
  'staging_users',
  'staging_tailors',
  'staging_tailor_works',
  'staging_tailor_works_local',
];

const SENTINEL_COLLECTION = '_seed_meta';
const SENTINEL_DOC_ID = 'staging-data-seeder';
const SENTINEL_VERSION = '1.0.0';

interface SentinelCounts {
  tailorsSeeded: number;
  productsSeeded: number;
}

// ─── Tailor interfaces ────────────────────────────────────────────────────────

interface StagingUser {
  first_name: string;
  last_name: string;
  email: string;
  is_tailor: boolean;
  is_sub_tailor: boolean;
  role: string;
  tailorId: string;
  createdAt: string;
  phone: string;
  address: string;
  shop_name: string;
  status: 'active' | 'inactive';
}

type StagingTailor = StagingUser;

interface TailorFixture {
  id: string;
  userData: StagingUser;
  tailorData?: StagingTailor; // only present for main tailors
}

// ─── Tailor fixture builder ───────────────────────────────────────────────────

/** Pure function — no I/O. Returns 5 tailor fixtures (3 main + 2 sub). */
function buildTailorFixtures(): TailorFixture[] {
  const tailor1Id = uuidv4();
  const tailor2Id = uuidv4();
  const tailor3Id = uuidv4();
  const sub1Id = uuidv4();
  const sub2Id = uuidv4();

  const now = new Date().toISOString();

  const mainTailors: TailorFixture[] = [
    {
      id: tailor1Id,
      userData: {
        first_name: 'Emeka',
        last_name: 'Okafor',
        email: 'emeka.okafor@adirecouture.ng',
        is_tailor: true,
        is_sub_tailor: false,
        role: 'tailor',
        tailorId: tailor1Id,
        createdAt: now,
        phone: '+2348012345678',
        address: '14 Balogun Street, Lagos Island, Lagos',
        shop_name: 'Adire Couture Lagos',
        status: 'active',
      },
    },
    {
      id: tailor2Id,
      userData: {
        first_name: 'Amara',
        last_name: 'Mensah',
        email: 'amara.mensah@kentekings.gh',
        is_tailor: true,
        is_sub_tailor: false,
        role: 'tailor',
        tailorId: tailor2Id,
        createdAt: now,
        phone: '+233244567890',
        address: '7 Oxford Street, Osu, Accra',
        shop_name: 'Kente Kings Accra',
        status: 'active',
      },
    },
    {
      id: tailor3Id,
      userData: {
        first_name: 'Fatima',
        last_name: 'Al-Hassan',
        email: 'fatima.alhassan@sahelstitch.ng',
        is_tailor: true,
        is_sub_tailor: false,
        role: 'tailor',
        tailorId: tailor3Id,
        createdAt: now,
        phone: '+2348098765432',
        address: '22 Wuse Zone 5, Abuja',
        shop_name: 'Sahel Stitch Abuja',
        status: 'active',
      },
    },
  ];

  // Attach tailorData (mirrors userData) for main tailors
  mainTailors.forEach((t) => {
    t.tailorData = { ...t.userData };
  });

  const subTailors: TailorFixture[] = [
    {
      id: sub1Id,
      userData: {
        first_name: 'Chidi',
        last_name: 'Nwosu',
        email: 'chidi.nwosu@adirecouture.ng',
        is_tailor: false,
        is_sub_tailor: true,
        role: 'initiator',
        tailorId: tailor1Id, // parent: Emeka Okafor
        createdAt: now,
        phone: '+2348023456789',
        address: '14 Balogun Street, Lagos Island, Lagos',
        shop_name: 'Adire Couture Lagos',
        status: 'active',
      },
    },
    {
      id: sub2Id,
      userData: {
        first_name: 'Yetunde',
        last_name: 'Bello',
        email: 'yetunde.bello@kentekings.gh',
        is_tailor: false,
        is_sub_tailor: true,
        role: 'approver',
        tailorId: tailor2Id, // parent: Amara Mensah
        createdAt: now,
        phone: '+233244678901',
        address: '7 Oxford Street, Osu, Accra',
        shop_name: 'Kente Kings Accra',
        status: 'active',
      },
    },
  ];

  return [...mainTailors, ...subTailors];
}

// ─── Write tailors to Firestore ───────────────────────────────────────────────

/** Writes all tailor fixtures to staging_users and (for main tailors) staging_tailors. */
async function writeTailors(fixtures: TailorFixture[]): Promise<void> {
  const batch = adminDb.batch();

  for (const fixture of fixtures) {
    // staging_users — all 5 tailors
    const userRef = adminDb.collection('staging_users').doc(fixture.id);
    batch.set(userRef, fixture.userData);
    console.log(
      `  📝 staging_users    | ${fixture.userData.first_name} ${fixture.userData.last_name} | ${fixture.id}`,
    );

    // staging_tailors — main tailors only
    if (fixture.tailorData) {
      const tailorRef = adminDb.collection('staging_tailors').doc(fixture.id);
      batch.set(tailorRef, fixture.tailorData);
      console.log(
        `  📝 staging_tailors  | ${fixture.tailorData.first_name} ${fixture.tailorData.last_name} | ${fixture.id}`,
      );
    }
  }

  await batch.commit();
  console.log('✅ Tailor batch committed successfully.');
}

// ─── Product interfaces ───────────────────────────────────────────────────────

interface RtwOptions {
  colors: string[];
  fabric: string;
  season: string;
  sizes: string[];
}

interface BespokeOptions {
  customization: {
    fabricChoices: string[];
    styleOptions: string[];
    finishingOptions: string[];
  };
  measurementsRequired: string[];
  productionTime: string;
}

interface ShippingInfo {
  tierKey: string;
  manualOverride: boolean;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

interface StagingProduct {
  tailor_id: string;
  type: 'bespoke' | 'ready-to-wear';
  title: string;
  price: { base: number; discount?: number; currency: string };
  discount: number;
  description: string;
  category: 'men' | 'women' | 'kids' | 'unisex';
  wear_category: string;
  wear_quantity: number;
  tags: string[];
  keywords: string[];
  images: string[];
  sizes: { size: string; quantity: number }[];
  customSizes: boolean;
  userCustomSizes: any[];
  userSizes: any[];
  tailor: string;
  status: 'initiated' | 'verified';
  availability: string;
  deliveryTimeline: string;
  createdAt: string;
  created_at?: string; // used by getNewArrivals query — injected in buildProductFixtures map
  approvalStatus: 'pending' | 'approved' | 'rejected';
  metric_size_guide: null;
  rtwOptions: RtwOptions | null;
  bespokeOptions: BespokeOptions | null;
  shipping: ShippingInfo;
  enableMultiplePricing?: boolean;
  individualItems?: any[];
  product_id: string;
}

interface ProductFixture {
  data: StagingProduct;
}

// ─── Product fixture builder ──────────────────────────────────────────────────

/** Pure function — no I/O. Returns 10 product fixtures distributed across 3 main tailors. */
function buildProductFixtures(tailorFixtures: TailorFixture[]): ProductFixture[] {
  const mainTailors = tailorFixtures.filter((f) => f.tailorData);
  const [t1, t2, t3] = mainTailors;

  const now = new Date().toISOString();

  const defaultShipping: ShippingInfo = {
    tierKey: 'tier_medium',
    manualOverride: false,
    actualWeightKg: 1.5,
    lengthCm: 40,
    widthCm: 30,
    heightCm: 10,
  };

  // Placeholder images so products pass the filterProductsWithImages check
  const placeholderImages = [
    'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=800',
    'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800',
    'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=800',
    'https://images.unsplash.com/photo-1603217192634-61068e4d4bf9?w=800',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
  ];

  const products: StagingProduct[] = [
    // ── tailor_1 (Emeka Okafor — Adire Couture Lagos) ──────────────────────
    {
      tailor_id: t1.id,
      type: 'bespoke',
      title: 'Royal Agbada Set',
      price: { base: 85000, currency: 'NGN' },
      discount: 0,
      description: 'A majestic three-piece Agbada set crafted from premium hand-woven fabric, perfect for ceremonies and celebrations.',
      category: 'men',
      wear_category: 'Agbada',
      wear_quantity: 5,
      tags: ['agbada', 'ceremony', 'men', 'bespoke'],
      keywords: ['agbada', 'royal', 'ceremony', 'men', 'traditional'],
      images: [],
      sizes: [{ size: 'XL', quantity: 2 }, { size: 'XXL', quantity: 3 }],
      customSizes: true,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Adire Couture Lagos',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '14-21 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: null,
      bespokeOptions: {
        customization: {
          fabricChoices: ['Aso-Oke', 'Damask', 'Brocade'],
          styleOptions: ['Embroidered collar', 'Plain collar', 'Lace trim'],
          finishingOptions: ['Hand-stitched hem', 'Machine hem'],
        },
        measurementsRequired: ['chest', 'waist', 'hip', 'shoulder', 'sleeve length', 'height'],
        productionTime: '14-21 days',
      },
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t1.id,
      type: 'ready-to-wear',
      title: 'Ankara Wrap Dress',
      price: { base: 22000, currency: 'NGN' },
      discount: 5,
      description: 'Vibrant Ankara print wrap dress with adjustable tie waist, suitable for casual and semi-formal occasions.',
      category: 'women',
      wear_category: 'Ankara',
      wear_quantity: 20,
      tags: ['ankara', 'dress', 'women', 'rtw'],
      keywords: ['ankara', 'wrap dress', 'women', 'print'],
      images: [],
      sizes: [{ size: 'S', quantity: 5 }, { size: 'M', quantity: 8 }, { size: 'L', quantity: 7 }],
      customSizes: false,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Adire Couture Lagos',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '3-5 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: {
        colors: ['Blue/Yellow', 'Red/Green', 'Purple/Gold'],
        fabric: 'Ankara cotton',
        season: 'All season',
        sizes: ['S', 'M', 'L', 'XL'],
      },
      bespokeOptions: null,
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t1.id,
      type: 'bespoke',
      title: 'Boubou Grand Occasion',
      price: { base: 65000, currency: 'NGN' },
      discount: 0,
      description: 'An elegant flowing Boubou for grand occasions, available in rich embroidered fabrics for both men and women.',
      category: 'unisex',
      wear_category: 'Boubou',
      wear_quantity: 8,
      tags: ['boubou', 'unisex', 'occasion', 'bespoke'],
      keywords: ['boubou', 'grand', 'occasion', 'unisex', 'elegant'],
      images: [],
      sizes: [{ size: 'M', quantity: 3 }, { size: 'L', quantity: 3 }, { size: 'XL', quantity: 2 }],
      customSizes: true,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Adire Couture Lagos',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '10-14 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: null,
      bespokeOptions: {
        customization: {
          fabricChoices: ['Silk', 'Chiffon', 'Lace'],
          styleOptions: ['V-neck', 'Round neck', 'Embroidered neckline'],
          finishingOptions: ['Gold trim', 'Silver trim', 'Plain'],
        },
        measurementsRequired: ['chest', 'waist', 'hip', 'height'],
        productionTime: '10-14 days',
      },
      shipping: defaultShipping,
      product_id: '',
    },

    // ── tailor_2 (Amara Mensah — Kente Kings Accra) ────────────────────────
    {
      tailor_id: t2.id,
      type: 'bespoke',
      title: 'Kente Ceremony Suit',
      price: { base: 120000, currency: 'NGN' },
      discount: 0,
      description: 'A distinguished two-piece suit woven from authentic Kente cloth, ideal for weddings and cultural ceremonies.',
      category: 'men',
      wear_category: 'Kente',
      wear_quantity: 4,
      tags: ['kente', 'suit', 'men', 'ceremony', 'bespoke'],
      keywords: ['kente', 'ceremony', 'suit', 'men', 'wedding'],
      images: [],
      sizes: [{ size: 'L', quantity: 2 }, { size: 'XL', quantity: 2 }],
      customSizes: true,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Kente Kings Accra',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '21-28 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: null,
      bespokeOptions: {
        customization: {
          fabricChoices: ['Kente silk', 'Kente cotton blend'],
          styleOptions: ['Single-breasted', 'Double-breasted'],
          finishingOptions: ['Gold buttons', 'Fabric-covered buttons'],
        },
        measurementsRequired: ['chest', 'waist', 'hip', 'shoulder', 'sleeve length', 'trouser inseam'],
        productionTime: '21-28 days',
      },
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t2.id,
      type: 'ready-to-wear',
      title: 'Dashiki Festival Shirt',
      price: { base: 12000, currency: 'NGN' },
      discount: 10,
      description: 'Colourful Dashiki festival shirt with traditional embroidery at the neckline, perfect for casual and festive wear.',
      category: 'unisex',
      wear_category: 'Dashiki',
      wear_quantity: 30,
      tags: ['dashiki', 'shirt', 'unisex', 'festival'],
      keywords: ['dashiki', 'festival', 'shirt', 'unisex', 'colourful'],
      images: [],
      sizes: [{ size: 'S', quantity: 8 }, { size: 'M', quantity: 12 }, { size: 'L', quantity: 10 }],
      customSizes: false,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Kente Kings Accra',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '3-5 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: {
        colors: ['Orange/Black', 'Green/Yellow', 'Blue/White'],
        fabric: 'Cotton',
        season: 'All season',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      },
      bespokeOptions: null,
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t2.id,
      type: 'ready-to-wear',
      title: 'Ankara Kids Playsuit',
      price: { base: 8500, currency: 'NGN' },
      discount: 0,
      description: 'Fun and durable Ankara print playsuit for children, with snap buttons for easy dressing.',
      category: 'kids',
      wear_category: 'Ankara',
      wear_quantity: 25,
      tags: ['ankara', 'kids', 'playsuit', 'children'],
      keywords: ['ankara', 'kids', 'playsuit', 'children', 'print'],
      images: [],
      sizes: [{ size: '2-3Y', quantity: 8 }, { size: '4-5Y', quantity: 10 }, { size: '6-7Y', quantity: 7 }],
      customSizes: false,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Kente Kings Accra',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '3-5 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: {
        colors: ['Pink/Yellow', 'Blue/Green', 'Red/White'],
        fabric: 'Ankara cotton',
        season: 'All season',
        sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
      },
      bespokeOptions: null,
      shipping: defaultShipping,
      product_id: '',
    },

    // ── tailor_3 (Fatima Al-Hassan — Sahel Stitch Abuja) ───────────────────
    {
      tailor_id: t3.id,
      type: 'bespoke',
      title: 'Aso-Oke Bridal Gele Set',
      price: { base: 95000, currency: 'NGN' },
      discount: 0,
      description: 'A complete bridal Aso-Oke set including Gele, Iro, and Buba, hand-woven with gold and silver thread accents.',
      category: 'women',
      wear_category: 'Aso-Oke',
      wear_quantity: 3,
      tags: ['aso-oke', 'bridal', 'gele', 'women', 'bespoke'],
      keywords: ['aso-oke', 'bridal', 'gele', 'women', 'wedding'],
      images: [],
      sizes: [{ size: 'One size', quantity: 3 }],
      customSizes: true,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Sahel Stitch Abuja',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '21-30 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: null,
      bespokeOptions: {
        customization: {
          fabricChoices: ['Gold Aso-Oke', 'Silver Aso-Oke', 'Ivory Aso-Oke'],
          styleOptions: ['Traditional Gele wrap', 'Pre-tied Gele', 'Modern twist'],
          finishingOptions: ['Gold thread embroidery', 'Silver thread embroidery', 'Beaded trim'],
        },
        measurementsRequired: ['head circumference', 'bust', 'waist', 'hip'],
        productionTime: '21-30 days',
      },
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t3.id,
      type: 'ready-to-wear',
      title: 'Kaftan Lounge Wear',
      price: { base: 18000, currency: 'NGN' },
      discount: 0,
      description: 'Comfortable and stylish Kaftan lounge wear made from breathable cotton, suitable for home and casual outings.',
      category: 'men',
      wear_category: 'Kaftan',
      wear_quantity: 15,
      tags: ['kaftan', 'lounge', 'men', 'casual'],
      keywords: ['kaftan', 'lounge', 'men', 'comfortable', 'casual'],
      images: [],
      sizes: [{ size: 'M', quantity: 5 }, { size: 'L', quantity: 6 }, { size: 'XL', quantity: 4 }],
      customSizes: false,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Sahel Stitch Abuja',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '3-5 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: {
        colors: ['White', 'Cream', 'Light Blue', 'Sage Green'],
        fabric: 'Cotton',
        season: 'All season',
        sizes: ['M', 'L', 'XL', 'XXL'],
      },
      bespokeOptions: null,
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t3.id,
      type: 'bespoke',
      title: 'Adire Tie-Dye Blouse',
      price: { base: 28000, currency: 'NGN' },
      discount: 0,
      description: 'Handcrafted Adire tie-dye blouse using traditional indigo dyeing techniques, each piece uniquely patterned.',
      category: 'women',
      wear_category: 'Adire',
      wear_quantity: 6,
      tags: ['adire', 'tie-dye', 'blouse', 'women', 'bespoke'],
      keywords: ['adire', 'tie-dye', 'blouse', 'women', 'handcrafted', 'indigo'],
      images: [],
      sizes: [{ size: 'S', quantity: 2 }, { size: 'M', quantity: 2 }, { size: 'L', quantity: 2 }],
      customSizes: true,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Sahel Stitch Abuja',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '10-14 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: null,
      bespokeOptions: {
        customization: {
          fabricChoices: ['Indigo cotton', 'Natural cotton'],
          styleOptions: ['V-neck', 'Round neck', 'Off-shoulder'],
          finishingOptions: ['Hand-rolled hem', 'Machine hem', 'Lace trim'],
        },
        measurementsRequired: ['bust', 'waist', 'shoulder width', 'sleeve length'],
        productionTime: '10-14 days',
      },
      shipping: defaultShipping,
      product_id: '',
    },
    {
      tailor_id: t3.id,
      type: 'ready-to-wear',
      title: 'Kente Kids Outfit',
      price: { base: 14000, currency: 'NGN' },
      discount: 0,
      description: 'Adorable Kente-inspired outfit for children, featuring authentic woven patterns in a comfortable modern cut.',
      category: 'kids',
      wear_category: 'Kente',
      wear_quantity: 12,
      tags: ['kente', 'kids', 'outfit', 'children'],
      keywords: ['kente', 'kids', 'outfit', 'children', 'traditional'],
      images: [],
      sizes: [{ size: '3-4Y', quantity: 4 }, { size: '5-6Y', quantity: 4 }, { size: '7-8Y', quantity: 4 }],
      customSizes: false,
      userCustomSizes: [],
      userSizes: [],
      tailor: 'Sahel Stitch Abuja',
      status: 'verified',
      availability: 'available',
      deliveryTimeline: '3-5 days',
      createdAt: now,
      approvalStatus: 'pending',
      metric_size_guide: null,
      rtwOptions: {
        colors: ['Multi-colour traditional', 'Blue/Gold', 'Red/Black/Gold'],
        fabric: 'Kente cotton blend',
        season: 'All season',
        sizes: ['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
      },
      bespokeOptions: null,
      shipping: defaultShipping,
      product_id: '',
    },
  ];

  return products.map((data, i) => ({
    data: {
      ...data,
      created_at: data.createdAt,
      images: data.images.length > 0 ? data.images : [placeholderImages[i % placeholderImages.length]],
    },
  }));
}

// ─── Sentinel helpers ─────────────────────────────────────────────────────────

/** Returns true if the sentinel document already exists, indicating a prior seed run. */
/**
 * Writes each product fixture to `staging_tailor_works` (one-by-one to capture
 * auto-generated doc IDs), updates the `product_id` field, then duplicates the
 * document to `staging_tailor_works_local` using the same doc ID.
 *
 * A failure on the local-collection write is non-fatal — it logs a warning and
 * continues to the next product (mirrors the behaviour in addTailorWork.ts).
 */
async function writeProducts(fixtures: ProductFixture[]): Promise<void> {
  for (const fixture of fixtures) {
    // ── Write to staging_tailor_works ────────────────────────────────────────
    const docRef = await adminDb.collection('staging_tailor_works').add(fixture.data);

    // Back-fill product_id with the auto-generated Firestore doc ID
    await adminDb.doc(`staging_tailor_works/${docRef.id}`).update({ product_id: docRef.id });

    const productWithId: StagingProduct = { ...fixture.data, product_id: docRef.id };

    console.log(
      `  📝 staging_tailor_works       | ${fixture.data.title} | ${docRef.id} | tailor: ${fixture.data.tailor_id}`,
    );

    // ── Duplicate to staging_tailor_works_local ──────────────────────────────
    try {
      await adminDb
        .collection('staging_tailor_works_local')
        .doc(docRef.id)
        .set(productWithId);
      console.log(
        `  📋 staging_tailor_works_local | ${fixture.data.title} | ${docRef.id} ✓`,
      );
    } catch (localErr) {
      console.warn(
        `  ⚠️  staging_tailor_works_local | ${fixture.data.title} | ${docRef.id} — local write failed, continuing…`,
        localErr,
      );
    }
  }

  console.log(`✅ Products written: ${fixtures.length} to staging_tailor_works (+ local duplicates).`);
}

async function checkSentinel(): Promise<boolean> {
  const snap = await adminDb.doc(`${SENTINEL_COLLECTION}/${SENTINEL_DOC_ID}`).get();
  return snap.exists;
}

/** Writes the sentinel document with a timestamp and seed counts. */
async function writeSentinel(counts: SentinelCounts): Promise<void> {
  await adminDb.doc(`${SENTINEL_COLLECTION}/${SENTINEL_DOC_ID}`).set({
    seededAt: new Date().toISOString(),
    version: SENTINEL_VERSION,
    tailorsSeeded: counts.tailorsSeeded,
    productsSeeded: counts.productsSeeded,
  });
  console.log(`✅ Sentinel written to ${SENTINEL_COLLECTION}/${SENTINEL_DOC_ID}`);
}

async function main(): Promise<void> {
  // Startup banner
  console.log('='.repeat(60));
  console.log('🌍  Stitches Africa — Staging Data Seeder');
  console.log(`🎯  Target project : ${TARGET_PROJECT}`);
  console.log(`📦  Collections    : ${COLLECTIONS.join(', ')}`);
  console.log('='.repeat(60));

  try {
    // Idempotency guard — exit early if already seeded
    const alreadySeeded = await checkSentinel();
    if (alreadySeeded) {
      console.warn(
        `⚠️  Staging data has already been seeded (sentinel found at ${SENTINEL_COLLECTION}/${SENTINEL_DOC_ID}).`,
      );
      console.warn('   To re-run, delete that document from the Firestore Console first.');
      return;
    }

    // ── Tailors ──────────────────────────────────────────────────────────────
    console.log('\n🔨 Building tailor fixtures…');
    const tailorFixtures = buildTailorFixtures();
    console.log(`   ${tailorFixtures.length} fixtures built (${tailorFixtures.filter((f) => f.tailorData).length} main, ${tailorFixtures.filter((f) => !f.tailorData).length} sub)`);

    console.log('\n📤 Writing tailors to Firestore…');
    await writeTailors(tailorFixtures);

    // ── Products ─────────────────────────────────────────────────────────────
    console.log('\n🔨 Building product fixtures…');
    const productFixtures = buildProductFixtures(tailorFixtures);
    console.log(`   ${productFixtures.length} fixtures built`);

    console.log('\n📤 Writing products to Firestore…');
    await writeProducts(productFixtures);

    // ── Sentinel ─────────────────────────────────────────────────────────────
    console.log('\n🔒 Writing idempotency sentinel…');
    await writeSentinel({ tailorsSeeded: tailorFixtures.length, productsSeeded: productFixtures.length });

    // ── Summary ───────────────────────────────────────────────────────────────
    const mainTailors = tailorFixtures.filter((f) => f.tailorData).length;
    const totalDocs =
      tailorFixtures.length +          // staging_users
      mainTailors +                     // staging_tailors
      productFixtures.length +          // staging_tailor_works
      productFixtures.length;           // staging_tailor_works_local

    console.log('\n' + '='.repeat(60));
    console.log('🎉  Seeding complete!');
    console.log(`👗  Tailors seeded  : ${tailorFixtures.length} (${mainTailors} main, ${tailorFixtures.length - mainTailors} sub)`);
    console.log(`📦  Products seeded : ${productFixtures.length}`);
    console.log(`📝  Total documents : ${totalDocs} across 4 collections`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Unrecoverable error during seeding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { main, checkSentinel, writeSentinel, buildTailorFixtures, writeTailors, buildProductFixtures, writeProducts };
export type { TailorFixture, StagingUser, StagingTailor, ProductFixture, StagingProduct };

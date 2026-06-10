/** Fixed IDs — Auth UIDs match Firestore document IDs. */
export const STAGING_PREFIX = 'STAGING-SEED';

// Vendors
export const STAGING_VENDOR_A_UID = `${STAGING_PREFIX}-vendor-a`;
export const STAGING_VENDOR_B_UID = `${STAGING_PREFIX}-vendor-b`;
export const STAGING_VENDOR_C_UID = `${STAGING_PREFIX}-vendor-c`;

// Shoppers
export const STAGING_CUSTOMER_UID = `${STAGING_PREFIX}-customer`;
export const STAGING_CUSTOMER_2_UID = `${STAGING_PREFIX}-customer-2`;

// Marketing portal (marketing_users)
export const STAGING_MARKETING_UID = `${STAGING_PREFIX}-marketing-admin`;
export const STAGING_MARKETING_BDM_UID = `${STAGING_PREFIX}-marketing-bdm`;
export const STAGING_MARKETING_LEAD_UID = `${STAGING_PREFIX}-marketing-lead`;

// Legacy admin + unified back office
export const STAGING_ADMIN_UID = `${STAGING_PREFIX}-platform-admin`;
export const STAGING_BACKOFFICE_EDITOR_UID = `${STAGING_PREFIX}-backoffice-editor`;

// Atlas BI
export const STAGING_ATLAS_FOUNDER_UID = `${STAGING_PREFIX}-atlas-founder`;

export const STAGING_VENDOR_A_EMAIL = 'vendor-a@staging.stitchesafrica.test';
export const STAGING_VENDOR_B_EMAIL = 'vendor-b@staging.stitchesafrica.test';
export const STAGING_VENDOR_C_EMAIL = 'vendor-c@staging.stitchesafrica.test';
export const STAGING_CUSTOMER_EMAIL = 'customer@staging.stitchesafrica.test';
export const STAGING_CUSTOMER_2_EMAIL = 'customer2@staging.stitchesafrica.test';
export const STAGING_MARKETING_EMAIL = 'marketing@staging.stitchesafrica.test';
export const STAGING_MARKETING_BDM_EMAIL = 'marketing-bdm@staging.stitchesafrica.test';
export const STAGING_MARKETING_LEAD_EMAIL = 'marketing-lead@staging.stitchesafrica.test';
export const STAGING_ADMIN_EMAIL = 'platform-admin@staging.stitchesafrica.test';
export const STAGING_BACKOFFICE_EDITOR_EMAIL = 'editor@staging.stitchesafrica.test';
/** Atlas portal expects @stitchesafrica.com domain for invitations/rules. */
export const STAGING_ATLAS_FOUNDER_EMAIL = 'staging-founder@stitchesafrica.com';

export const VENDOR_BRANDS = {
  [STAGING_VENDOR_A_UID]: 'Adire Lagos House',
  [STAGING_VENDOR_B_UID]: 'Kente & Co. Bespoke',
  [STAGING_VENDOR_C_UID]: 'Zaria Heritage Atelier',
} as const;

export const DEFAULT_STAGING_PASSWORD = 'StagingTest123!';

export function getStagingPassword(): string {
  return process.env.STAGING_SEED_PASSWORD?.trim() || DEFAULT_STAGING_PASSWORD;
}

export const SEED_BRAND_LOGO =
  'https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png';

const IK = 'https://ik.imagekit.io/mztf7lvnc/stitches';

/** Staging fashion imagery — ImageKit (African fashion / editorial). */
export const STAGING_IMAGES = [
  `${IK}/pexels-alpha-paul-696966661-20009925.jpg`,
  `${IK}/pexels-mhistah-been-photography-2155349481-33821727.jpg`,
  `${IK}/pexels-biola-visuals-415017893-20455702.jpg`,
  `${IK}/pexels-nawfalgram-2160059605-36783604.jpg`,
  `${IK}/pexels-halfscreen-photography-2154320926-34747815.jpg`,
  `${IK}/pexels-el-gringo-photo-116752370-16117894.jpg`,
  `${IK}/pexels-darkshadephotos-28375903.jpg`,
  `${IK}/pexels-abubakar-mamman-2148132108-36445251.jpg`,
  `${IK}/pexels-mk-photos-2155585436-34695268.jpg`,
  `${IK}/pexels-alameenng-33570809.jpg`,
  `${IK}/pexels-taiyesalawu-36547176.jpg`,
  `${IK}/pexels-skylight-views-2151863365-37215358.jpg`,
  `${IK}/pexels-kaybee-photography-664870201-31884483.jpg`,
  `${IK}/pexels-jibarofoto-2360530.jpg`,
  `${IK}/pexels-bobography-2148946691-35730557.jpg`,
  `${IK}/pexels-thirdman-6109557.jpg`,
  `${IK}/pexels-ab-pixels-ng-31951217.jpg`,
  `${IK}/pexels-sahfy-lenz-2153643467-36824850.jpg`,
] as const;

/** Pick primary + secondary product images (wraps index for 18 products). */
export function stagingProductImages(primaryIndex: number, secondaryIndex?: number): string[] {
  const primary = STAGING_IMAGES[primaryIndex % STAGING_IMAGES.length];
  const secondary =
    STAGING_IMAGES[(secondaryIndex ?? primaryIndex + 1) % STAGING_IMAGES.length];
  return [primary, secondary];
}

/** Hero / banner slots for landing sections. */
export const STAGING_BANNERS = {
  backToWork: STAGING_IMAGES[4],
  summerEdit: STAGING_IMAGES[11],
  landingAlt: STAGING_IMAGES[0],
  collectionAlt: STAGING_IMAGES[9],
} as const;

/** @deprecated Use STAGING_IMAGES — kept for any legacy references. */
export const FASHION_IMAGES = {
  ankaraDress: STAGING_IMAGES[0],
  agbada: STAGING_IMAGES[1],
  africanPrint: STAGING_IMAGES[2],
  modelPortrait: STAGING_IMAGES[3],
  fashionStudio: STAGING_IMAGES[4],
  wrapSkirt: STAGING_IMAGES[5],
  eveningGown: STAGING_IMAGES[6],
  kenteFabric: STAGING_IMAGES[7],
  textile: STAGING_IMAGES[8],
  blazer: STAGING_IMAGES[9],
  suit: STAGING_IMAGES[10],
  shirt: STAGING_IMAGES[11],
  trousers: STAGING_IMAGES[12],
  dashiki: STAGING_IMAGES[13],
  wedding: STAGING_IMAGES[14],
  streetStyle: STAGING_IMAGES[15],
  editorial: STAGING_IMAGES[16],
  kaftan: STAGING_IMAGES[17],
} as const;

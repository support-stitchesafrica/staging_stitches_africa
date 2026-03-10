/**
 * Script to sync storefront data from local to live environment
 * This helps when you create storefronts locally but need them on live
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// You'll need to configure these with your actual project IDs and credentials
const LOCAL_PROJECT_ID = 'your-local-project-id';
const LIVE_PROJECT_ID = 'your-live-project-id';

// Initialize both Firebase instances
const localApp = initializeApp({
  credential: cert('./path-to-local-service-account.json'),
  projectId: LOCAL_PROJECT_ID
}, 'local');

const liveApp = initializeApp({
  credential: cert('./path-to-live-service-account.json'),
  projectId: LIVE_PROJECT_ID
}, 'live');

const localDb = getFirestore(localApp);
const liveDb = getFirestore(liveApp);

async function syncStorefront(handle: string) {
  try {
    console.log(`Syncing storefront: ${handle}`);

    // Get storefront from local
    const localStorefrontQuery = await localDb
      .collection('storefronts')
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (localStorefrontQuery.empty) {
      console.error(`Storefront ${handle} not found in local environment`);
      return;
    }

    const storefrontDoc = localStorefrontQuery.docs[0];
    const storefrontData = storefrontDoc.data();
    const vendorId = storefrontData.vendorId;

    console.log(`Found storefront with vendor ID: ${vendorId}`);

    // Sync storefront
    await liveDb.collection('storefronts').doc(storefrontDoc.id).set(storefrontData);
    console.log('✅ Storefront synced');

    // Sync storefront theme if exists
    const localThemeDoc = await localDb.collection('storefront_themes').doc(vendorId).get();
    if (localThemeDoc.exists) {
      await liveDb.collection('storefront_themes').doc(vendorId).set(localThemeDoc.data()!);
      console.log('✅ Storefront theme synced');
    }

    // Sync products for this vendor
    const localProductsQuery = await localDb
      .collection('products')
      .where('vendorId', '==', vendorId)
      .get();

    console.log(`Found ${localProductsQuery.size} products to sync`);

    const batch = liveDb.batch();
    localProductsQuery.docs.forEach(doc => {
      const productRef = liveDb.collection('products').doc(doc.id);
      batch.set(productRef, doc.data());
    });

    await batch.commit();
    console.log('✅ Products synced');

    console.log(`\n🎉 Successfully synced storefront ${handle} to live environment`);
    console.log(`Live URL: https://your-live-domain.com/store/${handle}`);

  } catch (error) {
    console.error('Error syncing storefront:', error);
  }
}

// Usage
const storefrontHandle = process.argv[2];
if (!storefrontHandle) {
  console.error('Please provide a storefront handle: npm run sync-storefront aso-ebi');
  process.exit(1);
}

syncStorefront(storefrontHandle);
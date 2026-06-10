/**
 * Full staging bootstrap — no production access required.
 *
 * Creates Auth users, Firestore docs, and sample orders across:
 *   - 3 vendors (18 products with ImageKit fashion images + RTW size stock)
 *   - 2 customers (addresses, cart, referral profile)
 *   - Marketing (super_admin, bdm, team_lead)
 *   - Platform admin, backoffice editor, Atlas founder
 *   - Orders: paid, multi-vendor, unpaid, VVIP, all_orders mirrors
 *   - Promotional event, vendor transactions
 *
 *   npm run staging:seed
 */
import './load-env';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { assertSeedSafeProject, getAppEnv } from '@/lib/env';
import { buildVvipUserOrderMirrorWrites } from '@/lib/marketing/vvip-user-order-mirror';
import { ROLE_PERMISSIONS, type BackOfficeRole, type Department } from '@/types/backoffice';
import { SEED_PRODUCT_CATALOG } from './seed-catalog';
import { ensureAuthUser, tailorDoc, customerAddress } from './seed-helpers';
import {
  STAGING_PREFIX,
  STAGING_VENDOR_A_UID,
  STAGING_VENDOR_B_UID,
  STAGING_VENDOR_C_UID,
  STAGING_CUSTOMER_UID,
  STAGING_CUSTOMER_2_UID,
  STAGING_MARKETING_UID,
  STAGING_MARKETING_BDM_UID,
  STAGING_MARKETING_LEAD_UID,
  STAGING_ADMIN_UID,
  STAGING_BACKOFFICE_EDITOR_UID,
  STAGING_ATLAS_FOUNDER_UID,
  STAGING_VENDOR_A_EMAIL,
  STAGING_VENDOR_B_EMAIL,
  STAGING_VENDOR_C_EMAIL,
  STAGING_CUSTOMER_EMAIL,
  STAGING_CUSTOMER_2_EMAIL,
  STAGING_MARKETING_EMAIL,
  STAGING_MARKETING_BDM_EMAIL,
  STAGING_MARKETING_LEAD_EMAIL,
  STAGING_ADMIN_EMAIL,
  STAGING_BACKOFFICE_EDITOR_EMAIL,
  STAGING_ATLAS_FOUNDER_EMAIL,
  VENDOR_BRANDS,
  STAGING_BANNERS,
  getStagingPassword,
} from './seed-constants';

const PROD_001 = `${STAGING_PREFIX}-prod-001`;
const PROD_002 = `${STAGING_PREFIX}-prod-002`;
const PROD_003 = `${STAGING_PREFIX}-prod-003`;
const PROD_004 = `${STAGING_PREFIX}-prod-004`;
const PROD_005 = `${STAGING_PREFIX}-prod-005`;
const PROD_007 = `${STAGING_PREFIX}-prod-007`;
const PROD_008 = `${STAGING_PREFIX}-prod-008`;
const PROD_013 = `${STAGING_PREFIX}-prod-013`;
const PROD_014 = `${STAGING_PREFIX}-prod-014`;
const PROD_016 = `${STAGING_PREFIX}-prod-016`;
const PROD_017 = `${STAGING_PREFIX}-prod-017`;

function departmentsForRole(role: BackOfficeRole): Department[] {
  const permissions = ROLE_PERMISSIONS[role];
  return (Object.entries(permissions) as [Department, { read: boolean; write: boolean; delete: boolean }][])
    .filter(([, p]) => p.read || p.write || p.delete)
    .map(([d]) => d);
}

function marketingPermissions(role: 'super_admin' | 'bdm' | 'team_lead') {
  const full = {
    canManageUsers: true,
    canManageTeams: true,
    canAssignVendors: true,
    canViewAllAnalytics: true,
    canManageSettings: true,
    canExportData: true,
    canViewAuditLogs: true,
    canManageNotifications: true,
  };
  if (role === 'super_admin') return full;
  if (role === 'bdm') {
    return {
      ...full,
      canManageUsers: false,
      canManageTeams: false,
      canManageSettings: false,
    };
  }
  return {
    ...full,
    canManageUsers: false,
    canManageTeams: true,
    canManageSettings: false,
    canExportData: false,
  };
}

function backofficeUserDoc(
  uid: string,
  email: string,
  fullName: string,
  role: BackOfficeRole,
) {
  return {
    uid,
    email,
    fullName,
    role,
    departments: departmentsForRole(role),
    permissions: ROLE_PERMISSIONS[role],
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    invitedBy: 'staging-seed',
    _stagingSeed: true,
  };
}

async function seedAuthAndProfiles(password: string) {
  console.log('\n--- Auth + core profiles ---');

  const accounts: { uid: string; email: string; displayName: string }[] = [
    { uid: STAGING_VENDOR_A_UID, email: STAGING_VENDOR_A_EMAIL, displayName: VENDOR_BRANDS[STAGING_VENDOR_A_UID] },
    { uid: STAGING_VENDOR_B_UID, email: STAGING_VENDOR_B_EMAIL, displayName: VENDOR_BRANDS[STAGING_VENDOR_B_UID] },
    { uid: STAGING_VENDOR_C_UID, email: STAGING_VENDOR_C_EMAIL, displayName: VENDOR_BRANDS[STAGING_VENDOR_C_UID] },
    { uid: STAGING_CUSTOMER_UID, email: STAGING_CUSTOMER_EMAIL, displayName: 'Amara Okonkwo' },
    { uid: STAGING_CUSTOMER_2_UID, email: STAGING_CUSTOMER_2_EMAIL, displayName: 'Kwame Mensah' },
    { uid: STAGING_MARKETING_UID, email: STAGING_MARKETING_EMAIL, displayName: 'Staging Marketing Admin' },
    { uid: STAGING_MARKETING_BDM_UID, email: STAGING_MARKETING_BDM_EMAIL, displayName: 'Staging BDM' },
    { uid: STAGING_MARKETING_LEAD_UID, email: STAGING_MARKETING_LEAD_EMAIL, displayName: 'Staging Team Lead' },
    { uid: STAGING_ADMIN_UID, email: STAGING_ADMIN_EMAIL, displayName: 'Staging Platform Admin' },
    { uid: STAGING_BACKOFFICE_EDITOR_UID, email: STAGING_BACKOFFICE_EDITOR_EMAIL, displayName: 'Staging Editor' },
    { uid: STAGING_ATLAS_FOUNDER_UID, email: STAGING_ATLAS_FOUNDER_EMAIL, displayName: 'Staging Atlas Founder' },
  ];

  for (const acct of accounts) {
    await ensureAuthUser({ ...acct, password });
  }

  const vendors: { uid: string; email: string; brand: string; type: string[]; city: string }[] = [
    { uid: STAGING_VENDOR_A_UID, email: STAGING_VENDOR_A_EMAIL, brand: VENDOR_BRANDS[STAGING_VENDOR_A_UID], type: ['ready_to_wear'], city: 'Lagos' },
    { uid: STAGING_VENDOR_B_UID, email: STAGING_VENDOR_B_EMAIL, brand: VENDOR_BRANDS[STAGING_VENDOR_B_UID], type: ['bespoke'], city: 'Accra' },
    { uid: STAGING_VENDOR_C_UID, email: STAGING_VENDOR_C_EMAIL, brand: VENDOR_BRANDS[STAGING_VENDOR_C_UID], type: ['ready_to_wear', 'bespoke'], city: 'Kano' },
  ];

  for (const v of vendors) {
    const doc = tailorDoc(v.uid, v.email, v.brand, v.type, v.city);
    await adminDb.collection('tailors').doc(v.uid).set(doc, { merge: true });
    await adminDb.collection('tailors_local').doc(v.uid).set(doc, { merge: true });
    await adminDb.collection('users').doc(v.uid).set(
      {
        email: v.email,
        isTailor: true,
        role: 'verifier',
        brand_name: v.brand,
        brand_logo: doc.brand_logo,
        type: v.type,
        _stagingSeed: true,
      },
      { merge: true },
    );
  }

  await adminDb.collection('users').doc(STAGING_CUSTOMER_UID).set(
    {
      email: STAGING_CUSTOMER_EMAIL,
      first_name: 'Amara',
      last_name: 'Okonkwo',
      isTailor: false,
      role: 'customer',
      phone_number: '+2348012345678',
      _stagingSeed: true,
    },
    { merge: true },
  );

  await adminDb.collection('users').doc(STAGING_CUSTOMER_2_UID).set(
    {
      email: STAGING_CUSTOMER_2_EMAIL,
      first_name: 'Kwame',
      last_name: 'Mensah',
      isTailor: false,
      role: 'customer',
      phone_number: '+233201234567',
      _stagingSeed: true,
    },
    { merge: true },
  );

  console.log('  firestore: tailors, tailors_local, users');
}

async function seedRoleCollections() {
  console.log('\n--- Dashboard roles ---');

  const marketingRoles: { uid: string; email: string; name: string; role: 'super_admin' | 'bdm' | 'team_lead' }[] = [
    { uid: STAGING_MARKETING_UID, email: STAGING_MARKETING_EMAIL, name: 'Staging Marketing Admin', role: 'super_admin' },
    { uid: STAGING_MARKETING_BDM_UID, email: STAGING_MARKETING_BDM_EMAIL, name: 'Staging BDM', role: 'bdm' },
    { uid: STAGING_MARKETING_LEAD_UID, email: STAGING_MARKETING_LEAD_EMAIL, name: 'Staging Team Lead', role: 'team_lead' },
  ];

  for (const m of marketingRoles) {
    await adminDb.collection('marketing_users').doc(m.uid).set(
      {
        uid: m.uid,
        email: m.email,
        name: m.name,
        role: m.role,
        isActive: true,
        permissions: marketingPermissions(m.role),
        createdBy: 'staging-seed',
        assignedVendors: [STAGING_VENDOR_A_UID, STAGING_VENDOR_B_UID],
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        _stagingSeed: true,
      },
      { merge: true },
    );
  }

  await adminDb.collection('admins').doc(STAGING_ADMIN_UID).set(
    {
      uid: STAGING_ADMIN_UID,
      email: STAGING_ADMIN_EMAIL,
      firstName: 'Staging',
      lastName: 'Admin',
      username: 'staging-admin',
      role: 'superadmin',
      createdAt: FieldValue.serverTimestamp(),
      _stagingSeed: true,
    },
    { merge: true },
  );

  await adminDb.collection('backoffice_users').doc(STAGING_ADMIN_UID).set(
    backofficeUserDoc(STAGING_ADMIN_UID, STAGING_ADMIN_EMAIL, 'Staging Platform Admin', 'superadmin'),
    { merge: true },
  );

  await adminDb.collection('backoffice_users').doc(STAGING_BACKOFFICE_EDITOR_UID).set(
    backofficeUserDoc(STAGING_BACKOFFICE_EDITOR_UID, STAGING_BACKOFFICE_EDITOR_EMAIL, 'Staging Editor', 'editor'),
    { merge: true },
  );

  await adminDb.collection('atlasUsers').doc(STAGING_ATLAS_FOUNDER_UID).set(
    {
      uid: STAGING_ATLAS_FOUNDER_UID,
      email: STAGING_ATLAS_FOUNDER_EMAIL,
      fullName: 'Staging Atlas Founder',
      role: 'founder',
      isAtlasUser: true,
      invitedBy: STAGING_ADMIN_UID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      _stagingSeed: true,
    },
    { merge: true },
  );

  console.log('  marketing_users, admins, backoffice_users, atlasUsers');
}

async function seedProducts() {
  console.log('\n--- Products (tailor_works) ---');

  for (const p of SEED_PRODUCT_CATALOG) {
    const normalizedType = p.type === 'ready_to_wear' ? 'ready-to-wear' : p.type;
    await adminDb.collection('tailor_works').doc(p.id).set(
      {
        product_id: p.id,
        title: p.title,
        description: p.description,
        wear_category: p.wear_category,
        type: normalizedType,
        price: { base: p.priceNgn, currency: 'NGN' },
        source_original_price: p.priceNgn,
        source_currency: 'NGN',
        currency: 'NGN',
        tailor_id: p.tailor_id,
        tailor: p.tailor,
        images: p.images,
        is_verified: true,
        status: 'active',
        availability: 'in_stock',
        tags: [...p.tags, 'staging', 'seed'],
        wear_quantity: p.wear_quantity ?? null,
        sizes: p.sizes ?? null,
        rtwOptions: p.sizes ? { sizes: p.sizes } : null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
        _stagingSeed: true,
      },
      { merge: true },
    );

    if (p.sizes?.length && p.wear_quantity) {
      const perSize = Math.max(1, Math.floor(p.wear_quantity / p.sizes.length));
      for (const size of p.sizes) {
        await adminDb
          .collection('tailor_works')
          .doc(p.id)
          .collection('sizes')
          .doc(size.toLowerCase())
          .set({ quantity: perSize, _stagingSeed: true }, { merge: true });
      }
    }

    console.log(`  tailor_works/${p.id}`);
  }
}

async function seedCustomerExtras() {
  console.log('\n--- Customer extras ---');

  const addrA = customerAddress('Amara', 'Okonkwo', STAGING_CUSTOMER_EMAIL, 'Lagos');
  await adminDb
    .collection('users_addresses')
    .doc(STAGING_CUSTOMER_UID)
    .collection('user_addresses')
    .doc(`${STAGING_PREFIX}-addr-home`)
    .set({ ...addrA, is_default: true, _stagingSeed: true }, { merge: true });

  const addrB = customerAddress('Kwame', 'Mensah', STAGING_CUSTOMER_2_EMAIL, 'Abuja');
  await adminDb
    .collection('users_addresses')
    .doc(STAGING_CUSTOMER_2_UID)
    .collection('user_addresses')
    .doc(`${STAGING_PREFIX}-addr-home`)
    .set({ ...addrB, is_default: true, _stagingSeed: true }, { merge: true });

  const cartProduct = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_004)!;
  await adminDb
    .collection('users_cart_items')
    .doc(STAGING_CUSTOMER_UID)
    .collection('user_cart_items')
    .doc(`${STAGING_PREFIX}-cart-1`)
    .set(
      {
        product_id: cartProduct.id,
        title: cartProduct.title,
        description: cartProduct.description,
        type: 'ready-to-wear',
        price: cartProduct.priceNgn,
        originalPrice: cartProduct.priceNgn,
        dutyCharge: 0,
        discount: 0,
        quantity: 1,
        color: null,
        size: 'M',
        sizes: cartProduct.sizes ?? null,
        images: cartProduct.images,
        tailor_id: cartProduct.tailor_id,
        tailor: cartProduct.tailor,
        user_id: STAGING_CUSTOMER_UID,
        sourceOriginalPrice: cartProduct.priceNgn,
        sourceCurrency: 'NGN',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        _stagingSeed: true,
      },
      { merge: true },
    );

  await adminDb.collection('referralUsers').doc(STAGING_CUSTOMER_UID).set(
    {
      userId: STAGING_CUSTOMER_UID,
      email: STAGING_CUSTOMER_EMAIL,
      fullName: 'Amara Okonkwo',
      referralCode: 'AMARA-STG',
      totalReferrals: 1,
      totalPoints: 150,
      totalRevenue: 48500,
      isActive: true,
      isAdmin: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      _stagingSeed: true,
    },
    { merge: true },
  );

  await adminDb.collection('user_measurements').doc(STAGING_CUSTOMER_UID).set(
    {
      chest: 92,
      waist: 76,
      hips: 98,
      shoulder: 42,
      sleeve_length: 58,
      unit: 'cm',
      updated_at: FieldValue.serverTimestamp(),
      _stagingSeed: true,
    },
    { merge: true },
  );

  console.log('  users_addresses, users_cart_items, referralUsers, user_measurements');
}

async function seedStandardOrders(customerId: string, tailorA: string, tailorB: string) {
  console.log('\n--- Standard orders ---');

  const paidOrderId = `${STAGING_PREFIX}-PAID-ORDER`;
  const product = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_001)!;
  const sharedAddress = customerAddress('Amara', 'Okonkwo', STAGING_CUSTOMER_EMAIL);

  const paidLineRef = `${paidOrderId}-${PROD_001}`;
  const paidLineDoc = {
    order_id: paidOrderId,
    product_order_ref: paidLineRef,
    user_id: customerId,
    tailor_id: tailorA,
    tailor_name: VENDOR_BRANDS[STAGING_VENDOR_A_UID],
    product_id: PROD_001,
    title: product.title,
    price: product.priceNgn,
    original_price: product.priceNgn,
    source_original_price: product.priceNgn,
    source_currency: 'NGN',
    quantity: 1,
    size: 'M',
    order_status: 'Delivered',
    payment_status: 'paid',
    delivery_date: new Date().toISOString(),
    delivery_type: 'Standard',
    shipping_fee: 2500,
    timestamp: FieldValue.serverTimestamp(),
    user_address: sharedAddress,
    images: product.images,
    _stagingSeed: true,
  };

  await adminDb
    .collection('users_orders')
    .doc(customerId)
    .collection('user_orders')
    .doc(`${paidOrderId}-line1`)
    .set(paidLineDoc);

  await adminDb.collection('all_orders').doc(paidLineRef).set(paidLineDoc, { merge: true });

  console.log(`  paid order: ${paidOrderId}`);
  await seedMultiVendorCart(customerId, tailorA, tailorB);
  await seedUnpaidTailorOrders(customerId, tailorA);
  await seedVendorTransactions(tailorA, paidOrderId, product.priceNgn);
}

async function seedVvipOrders(customerId: string, tailorA: string, tailorB: string) {
  console.log('\n--- VVIP orders ---');
  const now = Timestamp.now();
  const itemA = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_001)!;
  const itemB = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_008)!;

  const vvipItems = [
    {
      id: PROD_001,
      title: itemA.title,
      quantity: 1,
      price: 150,
      originalPrice: 150,
      tailor_id: tailorA,
      vendor: { id: tailorA, name: VENDOR_BRANDS[STAGING_VENDOR_A_UID] },
    },
    {
      id: PROD_008,
      title: itemB.title,
      quantity: 1,
      price: 170,
      originalPrice: 170,
      tailor_id: tailorB,
      vendor: { id: tailorB, name: VENDOR_BRANDS[STAGING_VENDOR_B_UID] },
    },
  ];

  const shippingAddress = {
    first_name: 'Amara',
    last_name: 'Okonkwo',
    street_address: '15 Admiralty Way',
    city: 'Lagos',
    state: 'LA',
    country: 'Nigeria',
    post_code: '100001',
  };

  const pendingRef = adminDb.collection('orders').doc(`${STAGING_PREFIX}-VVIP-PENDING`);
  await pendingRef.set({
    isVvip: true,
    userId: customerId,
    user_email: STAGING_CUSTOMER_EMAIL,
    user_name: 'Amara Okonkwo',
    payment_status: 'pending_verification',
    order_status: 'Pending',
    currency: 'USD',
    amount_paid: 320,
    created_at: now,
    shipping_address: shippingAddress,
    items: vvipItems,
    _stagingSeed: true,
  });

  const approvedRef = adminDb.collection('orders').doc(`${STAGING_PREFIX}-VVIP-APPROVED`);
  const approvedPayload = {
    isVvip: true,
    userId: customerId,
    user_email: STAGING_CUSTOMER_EMAIL,
    user_name: 'Amara Okonkwo',
    payment_status: 'approved',
    order_status: 'Processing',
    currency: 'USD',
    amount_paid: 320,
    created_at: now,
    payment_date: now,
    shipping_address: shippingAddress,
    items: vvipItems,
    _stagingSeed: true,
  };
  await approvedRef.set(approvedPayload);

  const mirrorWrites = buildVvipUserOrderMirrorWrites({
    userId: customerId,
    masterOrderId: approvedRef.id,
    items: approvedPayload.items,
    shippingFee: 0,
    shippingAddress: approvedPayload.shipping_address,
    userNameFallback: approvedPayload.user_name,
    orderStatus: 'Processing',
  });

  for (const { docId, data } of mirrorWrites) {
    await adminDb
      .collection('users_orders')
      .doc(customerId)
      .collection('user_orders')
      .doc(docId)
      .set({ ...data, _stagingSeed: true }, { merge: true });
  }

  console.log(`  pending: ${pendingRef.id}`);
  console.log(`  approved + mirrors: ${approvedRef.id}`);
}

async function seedMultiVendorCart(customerId: string, tailorA: string, tailorB: string) {
  console.log('\n--- Multi-vendor cart order ---');
  const orderId = `${STAGING_PREFIX}-MULTI-CART`;
  const productA = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_002)!;
  const productB = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_007)!;
  const sharedAddress = customerAddress('Amara', 'Okonkwo', STAGING_CUSTOMER_EMAIL, 'Abuja');

  const lines = [
    {
      docId: `${orderId}-a`,
      tailor_id: tailorA,
      product_id: PROD_002,
      title: productA.title,
      price: productA.priceNgn,
      images: productA.images,
    },
    {
      docId: `${orderId}-b`,
      tailor_id: tailorB,
      product_id: PROD_007,
      title: productB.title,
      price: productB.priceNgn,
      images: productB.images,
    },
  ];

  for (const line of lines) {
    const productOrderRef = `${orderId}-${line.product_id}`;
    const lineDoc = {
      order_id: orderId,
      product_order_ref: productOrderRef,
      user_id: customerId,
      tailor_id: line.tailor_id,
      tailor_name:
        line.tailor_id === tailorA
          ? VENDOR_BRANDS[STAGING_VENDOR_A_UID]
          : VENDOR_BRANDS[STAGING_VENDOR_B_UID],
      product_id: line.product_id,
      title: line.title,
      price: line.price,
      original_price: line.price,
      source_original_price: line.price,
      source_currency: 'NGN',
      quantity: 1,
      order_status: 'Processing',
      payment_status: 'unpaid',
      delivery_date: new Date().toISOString(),
      delivery_type: 'Standard',
      shipping_fee: 3000,
      timestamp: FieldValue.serverTimestamp(),
      user_address: sharedAddress,
      images: line.images,
      _stagingSeed: true,
    };

    await adminDb
      .collection('users_orders')
      .doc(customerId)
      .collection('user_orders')
      .doc(line.docId)
      .set(lineDoc);

    await adminDb.collection('all_orders').doc(productOrderRef).set(lineDoc, { merge: true });
  }

  console.log(`  order_id: ${orderId} (${lines.length} line items, 2 vendors)`);
}

async function seedUnpaidTailorOrders(customerId: string, tailorA: string) {
  console.log('\n--- Unpaid tailor subcollection orders ---');
  const orderId = `${STAGING_PREFIX}-UNPAID`;
  const product = SEED_PRODUCT_CATALOG.find((p) => p.id === PROD_003)!;

  await adminDb.collection('tailors').doc(tailorA).collection('orders').doc(orderId).set({
    order_id: orderId,
    product_id: PROD_003,
    title: product.title,
    quantity: 1,
    price: product.priceNgn,
    shipping_fee: 2500,
    order_status: 'Processing',
    delivery_date: new Date().toISOString(),
    delivery_type: 'Standard',
    user_id: customerId,
    user_address: customerAddress('Amara', 'Okonkwo', STAGING_CUSTOMER_EMAIL),
    images: product.images,
    timestamp: FieldValue.serverTimestamp(),
    tailor_id: tailorA,
    tailor_name: VENDOR_BRANDS[STAGING_VENDOR_A_UID],
    payment_status: 'unpaid',
    _stagingSeed: true,
  });

  console.log(`  tailors/${tailorA}/orders/${orderId} (unpaid)`);
}

async function seedVendorTransactions(tailorId: string, orderId: string, amount: number) {
  console.log('\n--- Vendor transactions ---');
  const txId = `${STAGING_PREFIX}-TX-PAID`;

  await adminDb.collection('tailors').doc(tailorId).collection('transactions').doc(txId).set(
    {
      transaction_id: txId,
      amount: Math.round(amount * 0.8),
      created_by: 'staging-seed',
      date: FieldValue.serverTimestamp(),
      description: `Payout for order ${orderId}`,
      order_id: orderId,
      status: 'completed',
      type: 'credit',
      payment_status: 'paid',
      _stagingSeed: true,
    },
    { merge: true },
  );

  const pendingTxId = `${STAGING_PREFIX}-TX-PENDING`;
  await adminDb.collection('tailors').doc(tailorId).collection('transactions').doc(pendingTxId).set(
    {
      transaction_id: pendingTxId,
      amount: Math.round(amount * 0.8),
      created_by: 'staging-seed',
      date: FieldValue.serverTimestamp(),
      description: 'Pending vendor payout',
      order_id: `${STAGING_PREFIX}-UNPAID`,
      status: 'pending',
      type: 'credit',
      payment_status: 'unpaid',
      _stagingSeed: true,
    },
    { merge: true },
  );

  console.log(`  tailors/${tailorId}/transactions (${txId}, ${pendingTxId})`);
}

async function seedPromotionalEvent() {
  console.log('\n--- Promotional event ---');
  const eventId = `${STAGING_PREFIX}-PROMO-SUMMER`;
  const now = Timestamp.now();
  const end = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const promoProducts = [PROD_005, PROD_013, PROD_016].map((id) => {
    const p = SEED_PRODUCT_CATALOG.find((x) => x.id === id)!;
    const discount = 15;
    return {
      productId: id,
      discountPercentage: discount,
      originalPrice: p.priceNgn,
      discountedPrice: Math.round(p.priceNgn * (1 - discount / 100)),
      addedAt: now,
    };
  });

  await adminDb.collection('promotionalEvents').doc(eventId).set(
    {
      id: eventId,
      name: 'Staging Summer Edit',
      startDate: now,
      endDate: end,
      status: 'active',
      isPublished: true,
      products: promoProducts,
      banner: {
        imageUrl: STAGING_BANNERS.summerEdit,
        title: 'Summer Edit — Up to 15% off',
        description: 'Heat-friendly African fashion from our featured ateliers.',
        displayPercentage: 15,
        uploadedAt: now,
      },
      createdBy: STAGING_MARKETING_UID,
      createdAt: now,
      updatedAt: now,
      _stagingSeed: true,
    },
    { merge: true },
  );

  console.log(`  promotionalEvents/${eventId}`);
}

async function seedProductCollections() {
  console.log('\n--- Product collections (landing banners) ---');
  const now = FieldValue.serverTimestamp();
  const nowTs = Timestamp.now();

  const emptyCanvas = {
    elements: [] as unknown[],
    backgroundColor: '#ffffff',
    dimensions: { width: 1200, height: 800 },
  };

  const collections = [
    {
      id: `${STAGING_PREFIX}-collection-back-to-work`,
      name: 'Back to Work',
      title: 'Back to Work',
      description:
        'Polished pieces for the office, meetings, and power dressing — tailored for the modern professional.',
      thumbnail: STAGING_BANNERS.backToWork,
      bannerImage: STAGING_BANNERS.backToWork,
      badge: 'Featured Collection',
      productIds: [PROD_004, PROD_005, PROD_007, PROD_014],
    },
    {
      id: `${STAGING_PREFIX}-collection-new-season`,
      name: 'New Season Edit',
      title: 'New Season Edit',
      description:
        'Fresh arrivals from our featured ateliers — discover what is new this season.',
      thumbnail: STAGING_BANNERS.collectionAlt,
      bannerImage: STAGING_BANNERS.collectionAlt,
      badge: 'New Arrivals',
      productIds: [PROD_001, PROD_002, PROD_016, PROD_017],
    },
  ];

  for (const c of collections) {
    await adminDb.collection('product_collections').doc(c.id).set(
      {
        name: c.name,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        banner: {
          imageUrl: c.bannerImage,
          title: c.title,
          description: c.description,
          uploadedAt: nowTs,
        },
        badge: c.badge,
        productIds: c.productIds,
        canvasState: emptyCanvas,
        published: true,
        publishedAt: nowTs,
        createdBy: STAGING_MARKETING_UID,
        isFreeShipping: false,
        createdAt: now,
        updatedAt: now,
        _stagingSeed: true,
      },
      { merge: true },
    );
    console.log(`  product_collections/${c.id}`);
  }
}

function printCredentials(password: string) {
  console.log('\n========================================');
  console.log('Staging test accounts (all same password)');
  console.log('========================================');
  console.log(`Password: ${password}\n`);

  const rows: [string, string, string][] = [
    ['Vendor A (RTW)', STAGING_VENDOR_A_EMAIL, '/vendor'],
    ['Vendor B (bespoke)', STAGING_VENDOR_B_EMAIL, '/vendor'],
    ['Vendor C (mixed)', STAGING_VENDOR_C_EMAIL, '/vendor'],
    ['Customer 1', STAGING_CUSTOMER_EMAIL, '/shops/auth'],
    ['Customer 2', STAGING_CUSTOMER_2_EMAIL, '/shops/auth'],
    ['Marketing super_admin', STAGING_MARKETING_EMAIL, '/marketing'],
    ['Marketing BDM', STAGING_MARKETING_BDM_EMAIL, '/marketing'],
    ['Marketing team_lead', STAGING_MARKETING_LEAD_EMAIL, '/marketing'],
    ['Platform admin', STAGING_ADMIN_EMAIL, '/admin'],
    ['Backoffice editor', STAGING_BACKOFFICE_EDITOR_EMAIL, '/backoffice'],
    ['Atlas founder', STAGING_ATLAS_FOUNDER_EMAIL, '/atlas'],
  ];

  for (const [label, email, path] of rows) {
    console.log(`${label.padEnd(22)} ${email}`);
    console.log(`${''.padEnd(22)} → ${path}`);
  }

  console.log('\nReferral code (customer 1): AMARA-STG');
  console.log('Products: 18 in tailor_works (STAGING-SEED-prod-001 … 018)');
  console.log('Collections: Back to Work + New Season Edit (landing banner)');
  console.log('Promo banner: Summer Edit (promotionalEvents)');
  console.log('========================================\n');
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');

  assertSeedSafeProject(projectId);

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    try {
      const sa = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8'),
      ) as { project_id?: string };
      if (sa.project_id) {
        assertSeedSafeProject(sa.project_id);
        if (sa.project_id !== projectId) {
          throw new Error(
            `[seed] Service account project "${sa.project_id}" does not match ` +
              `NEXT_PUBLIC_FIREBASE_PROJECT_ID="${projectId}". Fix .env.staging.`,
          );
        }
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.startsWith('[env]') || err.message.startsWith('[seed]'))
      ) {
        throw err;
      }
      throw new Error('[seed] Invalid FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 in .env.staging');
    }
  }

  const password = getStagingPassword();

  console.log(`Seeding staging project: ${projectId} (APP_ENV=${getAppEnv()})`);
  console.log('No production database access required.\n');

  await seedAuthAndProfiles(password);
  await seedRoleCollections();
  await seedProducts();
  await seedCustomerExtras();
  await seedStandardOrders(STAGING_CUSTOMER_UID, STAGING_VENDOR_A_UID, STAGING_VENDOR_B_UID);
  await seedVvipOrders(STAGING_CUSTOMER_UID, STAGING_VENDOR_A_UID, STAGING_VENDOR_B_UID);
  await seedPromotionalEvent();
  await seedProductCollections();

  printCredentials(password);
  console.log('Seed complete. Run: npm run dev:staging');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

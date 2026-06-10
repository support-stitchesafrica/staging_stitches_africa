import { adminAuth } from '@/lib/firebase-admin';
import { SEED_BRAND_LOGO } from './seed-constants';

export async function ensureAuthUser(opts: {
  uid: string;
  email: string;
  displayName: string;
  password: string;
}) {
  try {
    await adminAuth.getUser(opts.uid);
    await adminAuth.updateUser(opts.uid, {
      email: opts.email,
      password: opts.password,
      emailVerified: true,
      displayName: opts.displayName,
    });
    console.log(`  auth: updated ${opts.email}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      await adminAuth.createUser({
        uid: opts.uid,
        email: opts.email,
        password: opts.password,
        emailVerified: true,
        displayName: opts.displayName,
      });
      console.log(`  auth: created ${opts.email}`);
      return;
    }
    throw err;
  }
}

export function tailorDoc(
  uid: string,
  email: string,
  brandName: string,
  type: string[],
  city = 'Lagos',
) {
  const [firstName, ...rest] = brandName.split(' ');
  return {
    tailor_registered_info: {
      'first-name': firstName,
      'last-name': rest.join(' ') || 'Atelier',
      email,
      id: uid,
    },
    'company-verification': {
      status: 'approved',
      companyName: brandName,
      registrationNumber: `RC-STAGING-${uid.slice(-6).toUpperCase()}`,
    },
    'identity-verification': { status: 'approved', fullName: brandName },
    'company-address-verification': {
      status: 'approved',
      city,
      country: 'Nigeria',
      countryCode: 'NG',
      streetAddress: '12 Fashion District',
      state: city === 'Lagos' ? 'LA' : 'KD',
      postCode: '100001',
    },
    featured_works: [],
    ratings: 4.6,
    wallet: 0,
    wallet_balance: 0,
    walletDetails: { balance: 0, eligibleBalance: 0, pendingBalance: 0 },
    transactions: [],
    brandName,
    brand_name: brandName,
    email,
    phone_number: '+2348000000000',
    brand_logo: SEED_BRAND_LOGO,
    type,
    hasSubaccount: false,
    splitPercentage: null,
    isSLA: true,
    slaAcceptedAt: new Date().toISOString(),
    slaVersion: '1.0',
    status: 'approved',
    featured: false,
    yearsOfExperience: 5,
    _stagingSeed: true,
  };
}

export function customerAddress(
  firstName: string,
  lastName: string,
  email: string,
  city = 'Lagos',
) {
  return {
    first_name: firstName,
    last_name: lastName,
    street_address: '15 Admiralty Way',
    flat_number: '4B',
    city,
    state: city === 'Lagos' ? 'LA' : 'FCT',
    country: 'Nigeria',
    post_code: city === 'Lagos' ? '100001' : '900001',
    user_email: email,
    phone_number: '+2348012345678',
    country_code: 'NG',
    dial_code: '+234',
  };
}

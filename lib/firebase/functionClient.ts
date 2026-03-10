// lib/firebase/functionsClient.ts

import { getApp } from "firebase/app";
import { getFunctions, HttpsCallable, httpsCallable, HttpsCallableResult } from "firebase/functions";

/**
 * Map each callable name to its deployed region.
 * From your deploy logs, all YouVerify callables are in europe-west1.
 * Keep DHL/NOWPayments/etc. in us-central1 for later reuse if you want.
 */
const FUNCTION_REGION: Record<string, string> = {
  // — YouVerify (all europe-west1) —
  verifyBusiness: "europe-west1",
  verifyNin: "europe-west1",
  verifyPassport: "europe-west1",
  verifyPhoneNumber: "europe-west1",
  verifyBvn: "europe-west1",
  verifyGhanaPassport: "europe-west1",
  verifyKenyanPassport: "europe-west1",
  verifySouthAfricanID: "europe-west1",
  verifyDriversLicense: "europe-west1",

  // — (Optional) others from your list —
  // DHL & translate/NOWPayments etc. (us-central1)
  validateDhlAddress: "us-central1",
  getDhlDomesticRate: "us-central1",
  getDhlExportPackageRate: "us-central1",
  createDhlDomesticShipment: "us-central1",
  createDhlExportPackageShipment: "us-central1",
  trackDhlShipment: "us-central1",
  createDhlDomesticPickup: "us-central1",
  createDhlExportPackagePickup: "us-central1",
  translateText: "us-central1",
  createNowPaymentsPayment: "us-central1",
  getNowPaymentsMinAmount: "us-central1",
  getNowPaymentsEstimatedPrice: "us-central1",
  getNowPaymentsPaymentStatus: "us-central1",

  // Paystack/Flutterwave and related (europe-west1)
  verifyTransaction: "europe-west1",
  getBankList: "europe-west1",
  verifyAccount: "europe-west1",
  createTransferRecipient: "europe-west1",
  initiateTransfer: "europe-west1",
  createSubaccount: "europe-west1",
  createPaystackVirtualAccount: "europe-west1",
  getForexPrice: "europe-west1",
  createPerson: "europe-west1",
  updatePerson: "europe-west1",
  partialUpdatePerson: "europe-west1",
  startManualCalculation: "europe-west1",
  getTaskSet: "europe-west1",
  createFlutterwaveSubaccount: "europe-west1",
  getFlutterwaveSubaccount: "europe-west1",
  updateFlutterwaveSubaccount: "europe-west1",
  deleteFlutterwaveSubaccount: "europe-west1",
};

const DEFAULT_REGION = "us-central1";

function regionFor(name: string) {
  return FUNCTION_REGION[name] ?? DEFAULT_REGION;
}

/**
 * Returns a typed httpsCallable bound to the correct region for `name`.
 */
export function regionCallable<Req = any, Res = any>(name: string): HttpsCallable<Req, Res> {
  const app = getApp();
  const functions = getFunctions(app, regionFor(name));
  return httpsCallable<Req, Res>(functions, name, { timeout: 60_000 });
}

/**
 * Convenience wrapper to call and unwrap data in one go.
 */
export async function callInRegion<Req extends object, Res = any>(
  name: string,
  data: Req
): Promise<Res> {
  const fn = regionCallable<Req, Res>(name);
  const result: HttpsCallableResult<Res> = await fn(data);
  return result.data;
}

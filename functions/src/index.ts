import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import axios, { AxiosError, isAxiosError } from "axios";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

// ─── YouVerify helpers ────────────────────────────────────────────────────────

interface VerificationConfig {
  baseUrl: string;
  headers: { [key: string]: string };
}

const getYouVerifyConfig = (): VerificationConfig => {
  const secretKey = process.env.YOUVERIFY_PRODUCTION_API_KEY;
  if (!secretKey) throw new HttpsError("internal", "YouVerify API key not set");
  return {
    baseUrl: "https://api.youverify.co",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      token: secretKey,
    },
  };
};

const youVerifyRequest = async (
  method: "get" | "post",
  endpoint: string,
  data?: any,
  maxRetries = 3
) => {
  const { baseUrl, headers } = getYouVerifyConfig();
  const url = `${baseUrl}/${endpoint.replace(/^\//, "")}`;
  const isCompanyCheck = endpoint.includes("company-advance-check");
  const timeout = isCompanyCheck ? 50000 : 15000;
  const effectiveMaxRetries = isCompanyCheck ? 2 : maxRetries;

  for (let attempt = 1; attempt <= effectiveMaxRetries; attempt++) {
    try {
      const response = await axios({ method, url, headers, data, timeout });
      return response.data;
    } catch (error) {
      const isLastAttempt = attempt === effectiveMaxRetries;
      if (isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const apiData = error.response?.data;
        const isTimeout =
          error.code === "ECONNABORTED" || error.message.includes("timeout");
        const isServiceUnavailable =
          status === 503 || status === 502 || status === 504;
        if ((isTimeout || isServiceUnavailable) && !isLastAttempt) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        let msg = "YouVerify API request failed";
        try {
          if (apiData?.message) msg = String(apiData.message);
          else if (apiData?.detail) msg = String(apiData.detail);
          else if (error.message) msg = String(error.message);
        } catch (_) {
          msg = isTimeout ? "Request timeout" : "YouVerify API request failed";
        }
        const code =
          status >= 400 && status < 500 ? "invalid-argument" : "internal";
        throw new HttpsError(code as any, msg, { status, attempt, isTimeout });
      }
      if (isLastAttempt) {
        const errorMsg =
          error instanceof Error ? error.message : "Network error";
        throw new HttpsError("internal", errorMsg);
      }
    }
  }
  throw new HttpsError("internal", "YouVerify API request failed after all retries");
};

// ─── Duplicate-check helpers ──────────────────────────────────────────────────

const checkExistingIdentityVerification = async (idNumber: string) => {
  try {
    const snap = await admin
      .firestore()
      .collection("tailors")
      .where("identity-verification.idNumber", "==", idNumber)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  } catch (e) {
    console.error("[checkExistingIdentityVerification]", e);
    return null;
  }
};

const checkExistingBusinessVerification = async (registrationNumber: string) => {
  try {
    const snap = await admin
      .firestore()
      .collection("tailors")
      .where("company-verification.registrationNumber", "==", registrationNumber)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  } catch (e) {
    console.error("[checkExistingBusinessVerification]", e);
    return null;
  }
};

const checkExistingPhoneVerification = async (phoneNumber: string) => {
  try {
    const snap = await admin
      .firestore()
      .collection("tailors")
      .where("identity-verification.idNumber", "==", phoneNumber)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  } catch (e) {
    console.error("[checkExistingPhoneVerification]", e);
    return null;
  }
};

const YV_SECRET = defineSecret("YOUVERIFY_PRODUCTION_API_KEY");
const YV_OPTS = {
  region: "europe-west1" as const,
  secrets: [YV_SECRET],
  enforceAppCheck: false,
  cors: true,
};

// ─── Business Verification ────────────────────────────────────────────────────

export const verifyBusiness = onCall(
  { ...YV_OPTS, timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
    const userId = request.auth.uid;
    const {
      registrationNumber,
      countryCode,
      isConsent = true,
      premium = false,
    } = request.data;

    if (!registrationNumber || !countryCode)
      throw new HttpsError("invalid-argument", "Registration number and country code are required");

    const cleanedRegNumber = registrationNumber.replace(/\s+/g, "").toUpperCase();
    const regNumberPattern = /^(RC|BN|IT|LP|LLP)\d+$/i;
    if (!regNumberPattern.test(cleanedRegNumber))
      throw new HttpsError(
        "invalid-argument",
        "Invalid registration number format. Must start with RC, BN, IT, LP, or LLP followed by numbers."
      );

    const db = admin.firestore();
    const userDoc = await db.collection("tailors").doc(userId).get();
    if (userDoc.exists) {
      const ud = userDoc.data();
      if (ud?.["company-verification"]?.registrationNumber) {
        throw new HttpsError(
          "failed-precondition",
          `You have already verified a business: ${ud["company-verification"].registrationNumber}`
        );
      }
    }

    const existing = await checkExistingBusinessVerification(cleanedRegNumber);
    if (existing) {
      const brandName = existing.brandName || existing.brand_name || "Unknown";
      throw new HttpsError("failed-precondition", `This registration number is already verified. Business: ${brandName}`);
    }

    const response = await youVerifyRequest("post", "v2/api/verifications/global/company-advance-check", {
      registrationNumber: cleanedRegNumber,
      countryCode,
      isConsent,
      premium,
    });

    if (!response || typeof response !== "object")
      throw new HttpsError("internal", "Invalid response from YouVerify API");

    const result: { [k: string]: any } = {};
    Object.entries(response).forEach(([k, v]) => { result[k] = v; });
    return result;
  }
);

// ─── NIN Verification ─────────────────────────────────────────────────────────

export const verifyNin = onCall(YV_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
  const userId = request.auth.uid;
  const {
    nin,
    isSubjectConsent,
    premiumNin = false,
    lastName,
    firstName,
    dateOfBirth,
    selfieImage,
  } = request.data || {};

  if (!nin || typeof nin !== "string")
    throw new HttpsError("invalid-argument", "NIN (string) is required");
  if (isSubjectConsent !== true)
    throw new HttpsError("invalid-argument", "isSubjectConsent must be true");
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))
    throw new HttpsError("invalid-argument", "dateOfBirth must be YYYY-MM-DD");

  const db = admin.firestore();
  const userDoc = await db.collection("tailors").doc(userId).get();
  if (userDoc.exists) {
    const ud = userDoc.data();
    if (ud?.["identity-verification"]?.idNumber)
      throw new HttpsError("failed-precondition", `Identity already verified: ${ud["identity-verification"].idNumber}`);
  }

  const existing = await checkExistingIdentityVerification(nin);
  if (existing) {
    const fullName =
      existing["identity-verification"]?.fullName ||
      `${existing.first_name || ""} ${existing.last_name || ""}`.trim() ||
      "Unknown";
    throw new HttpsError("failed-precondition", `This NIN is already verified for ${fullName}`);
  }

  const payload: any = { id: nin, premiumNin, isSubjectConsent };
  if (lastName || firstName || dateOfBirth) {
    payload.validation = {};
    if (lastName) payload.validation.lastName = lastName;
    if (firstName) payload.validation.firstName = firstName;
    if (dateOfBirth) payload.validation.dateOfBirth = dateOfBirth;
  }
  if (selfieImage) {
    const normalized = /^data:image\/\w+;base64,/.test(selfieImage)
      ? selfieImage
      : `data:image/jpeg;base64,${selfieImage}`;
    payload.selfie = { image: normalized };
  }

  const response = await youVerifyRequest("post", "v2/api/identity/ng/nin", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── Driver's License ─────────────────────────────────────────────────────────

export const verifyDriversLicense = onCall(YV_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
  const userId = request.auth.uid;
  const { licenseNumber } = request.data;
  if (!licenseNumber) throw new HttpsError("invalid-argument", "License number is required");

  const db = admin.firestore();
  const userDoc = await db.collection("tailors").doc(userId).get();
  if (userDoc.exists) {
    const ud = userDoc.data();
    if (ud?.["identity-verification"]?.idNumber)
      throw new HttpsError("failed-precondition", `Identity already verified: ${ud["identity-verification"].idNumber}`);
  }

  const existing = await checkExistingIdentityVerification(licenseNumber);
  if (existing) {
    const fullName = `${existing.first_name || ""} ${existing.last_name || ""}`.trim() || "Unknown";
    throw new HttpsError("failed-precondition", `This license is already verified for ${fullName}`);
  }

  const response = await youVerifyRequest("post", "v2/api/identity/ng/drivers-license", {
    id: licenseNumber,
    isSubjectConsent: true,
  });
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── Nigerian Passport ────────────────────────────────────────────────────────

export const verifyPassport = onCall(YV_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
  const userId = request.auth.uid;
  const { passportNumber, isSubjectConsent, lastName, firstName, dateOfBirth, selfieImage, metadata } = request.data;

  if (!passportNumber || !lastName || isSubjectConsent === undefined)
    throw new HttpsError("invalid-argument", "Passport number, last name and consent are required");

  const db = admin.firestore();
  const userDoc = await db.collection("tailors").doc(userId).get();
  if (userDoc.exists) {
    const ud = userDoc.data();
    if (ud?.["identity-verification"]?.idNumber)
      throw new HttpsError("failed-precondition", `Identity already verified: ${ud["identity-verification"].idNumber}`);
  }

  const existing = await checkExistingIdentityVerification(passportNumber);
  if (existing) {
    const fullName = `${existing.first_name || ""} ${existing.last_name || ""}`.trim() || "Unknown";
    throw new HttpsError("failed-precondition", `This passport is already verified for ${fullName}`);
  }

  const payload: any = { id: passportNumber, isSubjectConsent, lastName };
  if (firstName) payload.firstName = firstName;
  if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
  if (selfieImage) payload.selfie = { image: selfieImage };
  if (metadata) payload.metadata = metadata;

  const response = await youVerifyRequest("post", "v2/api/identity/ng/passport", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── Phone Number ─────────────────────────────────────────────────────────────

export const verifyPhoneNumber = onCall(YV_OPTS, async (request) => {
  const { mobile, isSubjectConsent, metadata } = request.data;
  if (!mobile || isSubjectConsent === undefined)
    throw new HttpsError("invalid-argument", "Phone number and consent are required");

  const existing = await checkExistingPhoneVerification(mobile);
  if (existing) {
    const fullName = `${existing.first_name || ""} ${existing.last_name || ""}`.trim() || "Unknown";
    throw new HttpsError("failed-precondition", `This phone number is already verified for ${fullName}`);
  }

  const payload: any = { mobile, isSubjectConsent };
  if (metadata) payload.metadata = metadata;

  const response = await youVerifyRequest("post", "v2/api/identity/ng/phone", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── BVN ──────────────────────────────────────────────────────────────────────

export const verifyBvn = onCall(YV_OPTS, async (request) => {
  const { bvn, isSubjectConsent, premiumBVN = false, lastName, firstName, dateOfBirth, selfieImage, metadata } = request.data;
  if (!bvn || isSubjectConsent === undefined)
    throw new HttpsError("invalid-argument", "BVN and consent are required");
  if (isSubjectConsent !== true)
    throw new HttpsError("failed-precondition", "isSubjectConsent must be true");

  const payload: any = { id: bvn, isSubjectConsent, premiumBVN };
  if (lastName || firstName || dateOfBirth) {
    payload.validation = { data: {} as Record<string, string> };
    if (lastName) payload.validation.data.lastName = lastName;
    if (firstName) payload.validation.data.firstName = firstName;
    if (dateOfBirth) payload.validation.data.dateOfBirth = dateOfBirth;
  }
  if (selfieImage) payload.selfie = { image: selfieImage };
  if (metadata) payload.metadata = metadata;

  const response = await youVerifyRequest("post", "v2/api/identity/ng/bvn-premium", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── Ghana Passport ───────────────────────────────────────────────────────────

export const verifyGhanaPassport = onCall(YV_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
  const userId = request.auth.uid;
  const { passportNumber, isSubjectConsent, lastName, firstName, dateOfBirth, selfieImage, metadata } = request.data;
  if (!passportNumber || isSubjectConsent === undefined)
    throw new HttpsError("invalid-argument", "Passport number and consent are required");

  const db = admin.firestore();
  const userDoc = await db.collection("tailors").doc(userId).get();
  if (userDoc.exists) {
    const ud = userDoc.data();
    if (ud?.["identity-verification"]?.idNumber)
      throw new HttpsError("failed-precondition", `Identity already verified: ${ud["identity-verification"].idNumber}`);
  }

  const existing = await checkExistingIdentityVerification(passportNumber);
  if (existing) {
    const fullName = `${existing.first_name || ""} ${existing.last_name || ""}`.trim() || "Unknown";
    throw new HttpsError("failed-precondition", `This passport is already verified for ${fullName}`);
  }

  const payload: any = { id: passportNumber, isSubjectConsent };
  if (lastName || firstName || dateOfBirth) {
    payload.validations = {};
    if (lastName) payload.validations.lastName = lastName;
    if (firstName) payload.validations.firstName = firstName;
    if (dateOfBirth) payload.validations.dateOfBirth = dateOfBirth;
  }
  if (selfieImage) payload.selfie = { image: selfieImage };
  if (metadata) payload.metadata = metadata;

  const response = await youVerifyRequest("post", "v2/api/identity/gh/passport", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── Kenyan Passport ──────────────────────────────────────────────────────────

export const verifyKenyanPassport = onCall(YV_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
  const userId = request.auth.uid;
  const { passportNumber, isSubjectConsent, lastName, firstName, dateOfBirth, selfieImage, metadata } = request.data;
  if (!passportNumber || isSubjectConsent === undefined)
    throw new HttpsError("invalid-argument", "Passport number and consent are required");

  const db = admin.firestore();
  const userDoc = await db.collection("tailors").doc(userId).get();
  if (userDoc.exists) {
    const ud = userDoc.data();
    if (ud?.["identity-verification"]?.idNumber)
      throw new HttpsError("failed-precondition", `Identity already verified: ${ud["identity-verification"].idNumber}`);
  }

  const existing = await checkExistingIdentityVerification(passportNumber);
  if (existing) {
    const fullName = `${existing.first_name || ""} ${existing.last_name || ""}`.trim() || "Unknown";
    throw new HttpsError("failed-precondition", `This passport is already verified for ${fullName}`);
  }

  const payload: any = { id: passportNumber, isSubjectConsent };
  if (lastName || firstName || dateOfBirth) {
    payload.validations = {};
    if (lastName) payload.validations.lastName = lastName;
    if (firstName) payload.validations.firstName = firstName;
    if (dateOfBirth) payload.validations.dateOfBirth = dateOfBirth;
  }
  if (selfieImage) payload.selfie = { image: selfieImage };
  if (metadata) payload.metadata = metadata;

  const response = await youVerifyRequest("post", "v2/api/identity/ke/passport", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── South African ID ─────────────────────────────────────────────────────────

export const verifySouthAfricanID = onCall(YV_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated");
  const userId = request.auth.uid;
  const { saidNumber, isSubjectConsent, lastName, firstName, middleName, email, phoneNumber } = request.data;
  if (!saidNumber || isSubjectConsent === undefined)
    throw new HttpsError("invalid-argument", "ID number and consent are required");

  const db = admin.firestore();
  const userDoc = await db.collection("tailors").doc(userId).get();
  if (userDoc.exists) {
    const ud = userDoc.data();
    if (ud?.["identity-verification"]?.idNumber)
      throw new HttpsError("failed-precondition", `Identity already verified: ${ud["identity-verification"].idNumber}`);
  }

  const existing = await checkExistingIdentityVerification(saidNumber);
  if (existing) {
    const fullName = `${existing.first_name || ""} ${existing.last_name || ""}`.trim() || "Unknown";
    throw new HttpsError("failed-precondition", `This ID is already verified for ${fullName}`);
  }

  const validations: any = {};
  if (lastName) validations.lastName = lastName;
  if (firstName) validations.firstName = firstName;
  if (middleName) validations.middleName = middleName;
  if (email) validations.email = email;
  if (phoneNumber) validations.phoneNumber = phoneNumber;

  const payload: any = { id: saidNumber, isSubjectConsent };
  if (Object.keys(validations).length > 0) payload.validations = { data: validations };

  const response = await youVerifyRequest("post", "v2/api/identity/za/said", payload);
  if (!response || typeof response !== "object")
    throw new HttpsError("internal", "Invalid response from YouVerify API");

  const result: { [k: string]: any } = {};
  Object.entries(response).forEach(([k, v]) => { result[k] = v; });
  return result;
});

// ─── DHL Domestic Rate (v2) ──────────────────────────────────────────────────

interface DhlErrorResponse {
  detail?: string;
  message?: string;
}

const getDefaultShipperDetails = () => ({
  addressLine1: "123 Lagos Street",
  addressLine2: "Lekki Phase 1",
  addressLine3: "Lekki",
  cityName: "Lagos",
  countyName: "Lagos",
  postalCode: "100001",
  countryCode: "NG",
});

const formatShippingDate = (dateString: string): string => {
  if (dateString.includes("GMT")) return dateString;
  return new Date(dateString).toISOString();
};

export const getDhlDomesticRate = onCall(
  { region: "us-central1", enforceAppCheck: false, cors: true },
  async (request) => {
    const { plannedShippingDateAndTime, receiverDetails, packages, accessToken } = request.data;

    if (!plannedShippingDateAndTime || !receiverDetails || !Array.isArray(packages) || packages.length === 0) {
      throw new HttpsError("invalid-argument", "Missing required DHL fields");
    }

    const requiredFields = ["addressLine1", "cityName", "countyName", "postalCode", "countryCode"];
    const missing = requiredFields.filter((f) => !receiverDetails[f]);
    if (missing.length > 0) {
      throw new HttpsError("invalid-argument", `Missing receiver fields: ${missing.join(", ")}`);
    }

    const payload = {
      plannedShippingDateAndTime: formatShippingDate(plannedShippingDateAndTime),
      dataModel: "REGULAR",
      customerDetails: {
        shipperDetails: getDefaultShipperDetails(),
        receiverDetails: {
          addressLine1: receiverDetails.addressLine1,
          addressLine2: receiverDetails.addressLine2 || receiverDetails.cityName || "Lagos",
          addressLine3: receiverDetails.addressLine3 || receiverDetails.postalCode || "NG",
          postalCode: receiverDetails.postalCode,
          cityName: receiverDetails.cityName,
          countyName: receiverDetails.countyName,
          countryCode: receiverDetails.countryCode,
        },
      },
      packages: packages.map((pkg: { weight: number; dimensions: { length: number; width: number; height: number } }) => ({
        weight: Math.ceil(pkg.weight),
        dimensions: {
          length: Math.round(pkg.dimensions.length),
          width: Math.round(pkg.dimensions.width),
          height: Math.round(pkg.dimensions.height),
        },
      })),
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const response = await axios.post(
        "https://stitchesafricamobile-backend.onrender.com/api/delivery/Dhl/Rate/Domestic",
        payload,
        { headers }
      );

      const responseData = response.data as Record<string, unknown>;
      if (!responseData || typeof responseData !== "object") throw new Error("Invalid response from DHL API");

      const result: Record<string, unknown> = {};
      Object.entries(responseData).forEach(([k, v]) => { result[k] = v; });
      return result;
    } catch (error) {
      const axiosError = error as AxiosError<DhlErrorResponse>;
      const errorDetail = axiosError.response?.data?.detail ?? axiosError.response?.data?.message ?? axiosError.message;
      const errorStatus = axiosError.response?.status;
      throw new HttpsError(
        errorStatus === 422 ? "invalid-argument" : "internal",
        `Failed to fetch DHL domestic rate: ${errorDetail}`,
        { status: errorStatus, details: axiosError.response?.data }
      );
    }
  }
);

// ─── Vendor Auto-Payout Webhook ──────────────────────────────────────────────
export { processVendorPayout } from "./payout/processVendorPayout";

// ─── processPostPayment ───────────────────────────────────────────────────────

const FLW_SECRET = defineSecret("FLW_SECRET_KEY");

export const processPostPayment = onCall(
  {
    region: "europe-west1" as const,
    enforceAppCheck: false,
    cors: true,
    secrets: [FLW_SECRET],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {
      userId,
      paymentRef,
      paymentProvider,
      amount_paid,
      subtotal_after_coupon,
      shippingFee,
      cartItems,
      shippingAddress,
      currency,
      coupon_code,
      coupon_value,
      coupon_currency,
      referralCode,
      freeShippingReason,
      deliveryDate,
      courierData,
      userEmail,
      isBogoCheckout,
      isUnifiedCheckout,
      tax,
      tax_currency,
      logoUrl,
      isTestMode,
    } = request.data;

    // ── Flutterwave server-side transaction verification ──────────────────────
    if (paymentProvider === "flutterwave") {
      const flwSecretKey = process.env.FLW_SECRET_KEY;
      if (!flwSecretKey) {
        throw new HttpsError("internal", "Flutterwave secret key not configured");
      }

      // Derive expected amount from the payload total
      const expectedAmount: number =
        typeof amount_paid === "number"
          ? amount_paid
          : typeof subtotal_after_coupon === "number"
          ? subtotal_after_coupon + (typeof shippingFee === "number" ? shippingFee : 0)
          : 0;

      try {
        const verifyUrl = `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(paymentRef)}/verify`;
        const verifyResponse = await axios.get(verifyUrl, {
          headers: {
            Authorization: `Bearer ${flwSecretKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });

        const verifyData = verifyResponse.data?.data;

        if (
          !verifyData ||
          verifyData.status !== "successful" ||
          verifyData.amount < expectedAmount
        ) {
          console.error("[processPostPayment] Flutterwave verification failed:", {
            status: verifyData?.status,
            amount: verifyData?.amount,
            expectedAmount,
          });
          throw new HttpsError(
            "failed-precondition",
            "Flutterwave transaction verification failed"
          );
        }

        console.log("[processPostPayment] Flutterwave verification passed:", {
          txId: verifyData.id,
          status: verifyData.status,
          amount: verifyData.amount,
          expectedAmount,
        });
      } catch (err) {
        if (err instanceof HttpsError) throw err;
        console.error("[processPostPayment] Flutterwave verify API error:", err);
        throw new HttpsError(
          "failed-precondition",
          "Flutterwave transaction verification failed"
        );
      }
    }

    // ── Order document creation ───────────────────────────────────────────────
    const db = admin.firestore();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Resolve cart items: use payload cartItems if provided, else fetch from Firestore
    let resolvedCartItems: any[] = [];
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      resolvedCartItems = cartItems;
    } else {
      // Fallback: fetch active cart from Firestore (backward compatibility)
      try {
        const cartSnap = await db
          .collection("carts")
          .where("userId", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get();
        if (!cartSnap.empty) {
          resolvedCartItems = cartSnap.docs[0].data().items || [];
        }
      } catch (cartErr) {
        console.warn("[processPostPayment] Cart fetch fallback failed:", cartErr);
      }
    }

    if (resolvedCartItems.length === 0) {
      throw new HttpsError("failed-precondition", "No cart items found for order");
    }

    const orderDoc = {
      orderId,
      userId,
      paymentRef,
      paymentReference: paymentRef,
      paymentProvider,
      items: resolvedCartItems,
      shippingAddress: shippingAddress || null,
      shippingFee: shippingFee || 0,
      currency: currency || "NGN",
      amount_paid: amount_paid || 0,
      subtotal_after_coupon: subtotal_after_coupon || 0,
      coupon_code: coupon_code || null,
      coupon_value: coupon_value || null,
      coupon_currency: coupon_currency || null,
      referralCode: referralCode || null,
      freeShippingReason: freeShippingReason || null,
      deliveryDate: deliveryDate || null,
      courierData: courierData || null,
      userEmail: userEmail || null,
      isBogoCheckout: isBogoCheckout || false,
      isUnifiedCheckout: isUnifiedCheckout || true,
      tax: tax || 0,
      tax_currency: tax_currency || currency || "NGN",
      logoUrl: logoUrl || null,
      isTestMode: isTestMode || false,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("orders").doc(orderId).set(orderDoc);

    console.log("[processPostPayment] Order created:", orderId);
    return { success: true, orderId };
  }
);

export const sendOrderPlacedVendorEmail = onCall(
  { region: "europe-west1" as const, enforceAppCheck: false, cors: true },
  async (request) => {
    const { to, vendorName, orderId, productName, quantity, totalAmount } = request.data;
    if (!to || !orderId) throw new HttpsError("invalid-argument", "Missing required email fields");

    console.log(`[Email] Vendor: ${vendorName} (${to}), Order: ${orderId}, ${quantity} × ${productName} = ${totalAmount}`);
    try {
      await admin.firestore().collection("mail_logs").add({
        to,
        type: "vendor_order_notification",
        orderId,
        status: "sent",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          vendorName,
          orderId,
          productName,
          quantity,
          totalAmount,
        },
      });
    } catch (err) {
      console.error("[Email] Failed to log:", err);
    }
    return { success: true, message: "Email queued successfully" };
  }
);




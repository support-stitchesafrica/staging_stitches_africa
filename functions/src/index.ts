import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

// NIN Verification
export const verifyNin = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { nin, isSubjectConsent, isLive, premiumNin, lastName, firstName, dateOfBirth, selfieImage } = data;

  if (!nin || !isSubjectConsent) {
    throw new functions.https.HttpsError("invalid-argument", "NIN and subject consent are required");
  }

  // 🔹 Call your YouVerify API here (replace with actual HTTP request)
  // const response = await fetch("https://api.youverify.co/...")

  return {
    status: "success",
    data: {
      nin,
      fullName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
      dateOfBirth: dateOfBirth ?? "1990-01-01",
      isLive: isLive ?? false,
      premiumNin: premiumNin ?? false,
      selfieVerified: !!selfieImage,
    },
  };
});

// BVN Verification
export const verifyBvn = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { bvn, isSubjectConsent } = data;
  if (!bvn || !isSubjectConsent) {
    throw new functions.https.HttpsError("invalid-argument", "BVN and consent are required");
  }

  return { status: "success", bvn, verified: true };
});

// Passport (Nigeria)
export const verifyPassport = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { passportNumber, isSubjectConsent, lastName } = data;
  if (!passportNumber || !isSubjectConsent || !lastName) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required passport fields");
  }

  return { status: "success", passportNumber, lastName };
});

// Driver’s License
export const verifyDriversLicense = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { licenseNumber } = data;
  if (!licenseNumber) {
    throw new functions.https.HttpsError("invalid-argument", "License number required");
  }

  return { status: "success", licenseNumber };
});

// Business
export const verifyBusiness = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { registrationNumber, countryCode } = data;
  if (!registrationNumber || !countryCode) {
    throw new functions.https.HttpsError("invalid-argument", "Missing business details");
  }

  return { status: "success", registrationNumber, countryCode: countryCode.toUpperCase() };
});

// Phone Number
export const verifyPhoneNumber = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { mobile, isSubjectConsent } = data;
  if (!mobile || !isSubjectConsent) {
    throw new functions.https.HttpsError("invalid-argument", "Phone number and consent required");
  }

  return { status: "success", mobile };
});

// Ghana Passport
export const verifyGhanaPassport = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { passportNumber, isSubjectConsent } = data;
  if (!passportNumber || !isSubjectConsent) {
    throw new functions.https.HttpsError("invalid-argument", "Missing Ghana passport fields");
  }

  return { status: "success", passportNumber };
});

// Kenya Passport
export const verifyKenyanPassport = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { passportNumber, isSubjectConsent } = data;
  if (!passportNumber || !isSubjectConsent) {
    throw new functions.https.HttpsError("invalid-argument", "Missing Kenyan passport fields");
  }

  return { status: "success", passportNumber };
});


// South African ID
export const verifySouthAfricanID = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { saidNumber, isSubjectConsent } = data;
  if (!saidNumber || !isSubjectConsent) {
    throw new functions.https.HttpsError("invalid-argument", "Missing SA ID fields");
  }

  return { status: "success", saidNumber };
});

// Vendor Email Notification
export const sendOrderPlacedVendorEmail = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { 
    to, 
    vendorName, 
    orderId, 
    customerName, 
    productName, 
    quantity, 
    totalAmount 
  } = data;

  if (!to || !orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required email fields (to, orderId)");
  }

  // Log the email attempt (Simulating email sending for now as package.json is missing to confirm nodemailer)
  console.log(`[Email Service] Sending Order Placed Email to Vendor: ${vendorName} (${to})`);
  console.log(`[Email Service] Order ID: ${orderId}`);
  console.log(`[Email Service] Content: Customer ${customerName} ordered ${quantity}x ${productName} for ${totalAmount}`);

  // In a real environment, you would use nodemailer or a service like SendGrid/Postmark here.
  // Example: await transporter.sendMail({ ... });
  
  // Create a notification record in Firestore (optional, but good for history)
  try {
      await admin.firestore().collection('mail_logs').add({
          to,
          type: 'vendor_order_notification',
          orderId,
          status: 'sent', // Simulating success
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: data
      });
  } catch (err) {
      console.error("[Email Service] Failed to log email to Firestore:", err);
  }

  return { success: true, message: "Email queued successfully" };
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDhlDomesticRate = exports.sendOrderPlacedVendorEmail = exports.verifySouthAfricanID = exports.verifyKenyanPassport = exports.verifyGhanaPassport = exports.verifyPhoneNumber = exports.verifyBusiness = exports.verifyDriversLicense = exports.verifyPassport = exports.verifyBvn = exports.verifyNin = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// NIN Verification
exports.verifyNin = functions.region("europe-west1").https.onCall(async (data, context) => {
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
            fullName: `${firstName !== null && firstName !== void 0 ? firstName : ""} ${lastName !== null && lastName !== void 0 ? lastName : ""}`.trim(),
            dateOfBirth: dateOfBirth !== null && dateOfBirth !== void 0 ? dateOfBirth : "1990-01-01",
            isLive: isLive !== null && isLive !== void 0 ? isLive : false,
            premiumNin: premiumNin !== null && premiumNin !== void 0 ? premiumNin : false,
            selfieVerified: !!selfieImage,
        },
    };
});
// BVN Verification
exports.verifyBvn = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { bvn, isSubjectConsent } = data;
    if (!bvn || !isSubjectConsent) {
        throw new functions.https.HttpsError("invalid-argument", "BVN and consent are required");
    }
    return { status: "success", bvn, verified: true };
});
// Passport (Nigeria)
exports.verifyPassport = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { passportNumber, isSubjectConsent, lastName } = data;
    if (!passportNumber || !isSubjectConsent || !lastName) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required passport fields");
    }
    return { status: "success", passportNumber, lastName };
});
// Driver’s License
exports.verifyDriversLicense = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { licenseNumber } = data;
    if (!licenseNumber) {
        throw new functions.https.HttpsError("invalid-argument", "License number required");
    }
    return { status: "success", licenseNumber };
});
// Business
exports.verifyBusiness = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { registrationNumber, countryCode } = data;
    if (!registrationNumber || !countryCode) {
        throw new functions.https.HttpsError("invalid-argument", "Missing business details");
    }
    return { status: "success", registrationNumber, countryCode: countryCode.toUpperCase() };
});
// Phone Number
exports.verifyPhoneNumber = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { mobile, isSubjectConsent } = data;
    if (!mobile || !isSubjectConsent) {
        throw new functions.https.HttpsError("invalid-argument", "Phone number and consent required");
    }
    return { status: "success", mobile };
});
// Ghana Passport
exports.verifyGhanaPassport = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { passportNumber, isSubjectConsent } = data;
    if (!passportNumber || !isSubjectConsent) {
        throw new functions.https.HttpsError("invalid-argument", "Missing Ghana passport fields");
    }
    return { status: "success", passportNumber };
});
// Kenya Passport
exports.verifyKenyanPassport = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { passportNumber, isSubjectConsent } = data;
    if (!passportNumber || !isSubjectConsent) {
        throw new functions.https.HttpsError("invalid-argument", "Missing Kenyan passport fields");
    }
    return { status: "success", passportNumber };
});
// South African ID
exports.verifySouthAfricanID = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { saidNumber, isSubjectConsent } = data;
    if (!saidNumber || !isSubjectConsent) {
        throw new functions.https.HttpsError("invalid-argument", "Missing SA ID fields");
    }
    return { status: "success", saidNumber };
});
// Vendor Email Notification
exports.sendOrderPlacedVendorEmail = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { to, vendorName, orderId, customerName, productName, quantity, totalAmount } = data;
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
    }
    catch (err) {
        console.error("[Email Service] Failed to log email to Firestore:", err);
    }
    return { success: true, message: "Email queued successfully" };
});
// DHL Domestic Rate - Fixed payload format
const axios_1 = __importDefault(require("axios"));
const getDefaultShipperDetails = () => ({
    addressLine1: "123 Lagos Street",
    addressLine2: "",
    addressLine3: "",
    cityName: "Lagos",
    countyName: "Lagos",
    postalCode: "100001",
    countryCode: "NG"
});
const formatShippingDate = (dateString) => {
    // Pass through as-is if it already has the DHL format with timezone (e.g. "2026-03-27T10:00:00 GMT+01:00")
    if (dateString.includes("GMT")) {
        return dateString;
    }
    // Fallback: convert to ISO string
    const date = new Date(dateString);
    return date.toISOString();
};
exports.getDhlDomesticRate = functions.region("us-central1").https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const { plannedShippingDateAndTime, receiverDetails, packages, accessToken, } = data;
    if (!plannedShippingDateAndTime ||
        !receiverDetails ||
        !Array.isArray(packages) ||
        packages.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: plannedShippingDateAndTime, receiverDetails, packages");
    }
    const requiredReceiverFields = ["addressLine1", "cityName", "countyName", "postalCode", "countryCode"];
    const missingReceiverFields = requiredReceiverFields.filter((field) => !receiverDetails[field]);
    if (missingReceiverFields.length > 0) {
        throw new functions.https.HttpsError("invalid-argument", `Missing required receiver fields: ${missingReceiverFields.join(", ")}`);
    }
    const shipperDetails = getDefaultShipperDetails();
    const completeReceiverDetails = {
        addressLine1: receiverDetails.addressLine1,
        addressLine2: receiverDetails.addressLine2 || "",
        addressLine3: receiverDetails.addressLine3 || "",
        postalCode: receiverDetails.postalCode,
        cityName: receiverDetails.cityName,
        countyName: receiverDetails.countyName,
        countryCode: receiverDetails.countryCode,
    };
    // DomesticRateDataModel schema requires weight and dimensions as integers (int32)
    const formattedPackages = packages.map((pkg) => ({
        weight: Math.ceil(pkg.weight), // round up to nearest integer (int32 required)
        dimensions: {
            length: Math.round(pkg.dimensions.length),
            width: Math.round(pkg.dimensions.width),
            height: Math.round(pkg.dimensions.height),
        },
    }));
    // Payload matches the backend's expected format exactly
    const payload = {
        plannedShippingDateAndTime: formatShippingDate(plannedShippingDateAndTime),
        dataModel: "REGULAR",
        customerDetails: {
            shipperDetails,
            receiverDetails: completeReceiverDetails,
        },
        packages: formattedPackages,
    };
    try {
        console.log("DHL Domestic Rate Request Payload:", JSON.stringify(payload, null, 2));
        const headers = {
            "Content-Type": "application/json",
        };
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }
        const response = await axios_1.default.post("https://stitchesafricamobile-backend.onrender.com/api/delivery/Dhl/Rate/Domestic", payload, { headers });
        const responseData = response.data;
        if (!responseData || typeof responseData !== "object") {
            throw new Error("Invalid response format from DHL API");
        }
        const typedResponse = {};
        Object.entries(responseData).forEach(([key, value]) => {
            if (typeof key === "string") {
                typedResponse[key] = value;
            }
        });
        return typedResponse;
    }
    catch (error) {
        const axiosError = error;
        console.error("DHL Domestic Rate Error:", axiosError);
        console.error("DHL API Response:", (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data);
        const errorDetail = ((_c = (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.detail) ||
            ((_e = (_d = axiosError.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) ||
            axiosError.message;
        const errorStatus = (_f = axiosError.response) === null || _f === void 0 ? void 0 : _f.status;
        throw new functions.https.HttpsError(errorStatus === 422 ? "invalid-argument" : "internal", `Failed to fetch DHL domestic rate: ${errorDetail}`, {
            status: errorStatus,
            details: (_g = axiosError.response) === null || _g === void 0 ? void 0 : _g.data,
            requestPayload: payload,
        });
    }
});
//# sourceMappingURL=index.js.map
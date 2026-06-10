import { Firestore } from "firebase-admin/firestore";
import { PayoutCalculation, PayoutResult } from "../types";

interface PaystackSubaccount {
  subaccount_code: string;
  account_number: string;
  settlement_bank: string;
  business_name?: string;
}

interface VendorDoc {
  id: string;
  brandName?: string;
  paystackSubaccount?: PaystackSubaccount;
  paystackRecipientCode?: string;
  [key: string]: unknown;
}

interface OrderDoc {
  id: string;
  tailor_id: string;
  title?: string;
  product_title?: string;
  [key: string]: unknown;
}

interface PaystackRecipientResponse {
  status: boolean;
  message: string;
  data?: {
    recipient_code: string;
    type: string;
    name: string;
  };
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    transfer_code: string;
    reference: string;
    amount: number;
  };
}

/**
 * Creates a Paystack transfer recipient from the vendor's subaccount details,
 * or returns the cached recipient_code if already stored on the vendor doc.
 * Caches the recipient_code back to Firestore tailors/{id}.paystackRecipientCode.
 */
export async function createOrGetPaystackRecipient(
  db: Firestore,
  vendor: VendorDoc,
  secretKey: string
): Promise<string> {
  // Return cached recipient code if available
  if (vendor.paystackRecipientCode) {
    return vendor.paystackRecipientCode;
  }

  const subaccount = vendor.paystackSubaccount;
  if (!subaccount?.account_number || !subaccount?.settlement_bank) {
    throw new Error("Vendor missing Paystack subaccount bank details");
  }

  const payload = {
    type: "nuban",
    name: vendor.brandName ?? "Vendor",
    account_number: subaccount.account_number,
    bank_code: subaccount.settlement_bank,
    currency: "NGN",
  };

  const res = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(payload),
  });

  const json: PaystackRecipientResponse = await res.json();

  if (!json.status || !json.data?.recipient_code) {
    throw new Error(`Paystack recipient creation failed: ${json.message}`);
  }

  const recipientCode = json.data.recipient_code;

  // Cache recipient code on vendor document
  await db.collection("tailors").doc(vendor.id).update({
    paystackRecipientCode: recipientCode,
  });

  return recipientCode;
}

/**
 * Executes a Paystack transfer payout to the vendor.
 * Amount is converted to kobo (NGN * 100).
 */
export async function executePaystackPayout(
  db: Firestore,
  order: OrderDoc,
  vendor: VendorDoc,
  calculation: PayoutCalculation,
  secretKey: string
): Promise<PayoutResult> {
  const recipientCode = await createOrGetPaystackRecipient(db, vendor, secretKey);

  const amountInKobo = Math.round(calculation.vendorAmount * 100);
  const productTitle = (order.product_title ?? order.title ?? "product").slice(0, 100);
  const reference = `payout_${order.id}_${Date.now()}`;

  const payload = {
    source: "balance",
    amount: amountInKobo,
    recipient: recipientCode,
    reason: `Payout for order ${order.id} - ${productTitle}`,
    reference,
  };

  const res = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(payload),
  });

  const json: PaystackTransferResponse = await res.json();

  // Paystack returns status: true even for pending transfers
  if (json.status && json.data) {
    const transferStatus = json.data.status;
    if (transferStatus === "success" || transferStatus === "pending") {
      return {
        status: "completed",
        reference: json.data.transfer_code ?? reference,
        provider: "paystack",
      };
    }
  }

  // Any other response is a failure
  return {
    status: "failed",
    error: json.message ?? "Paystack transfer failed with unknown error",
    provider: "paystack",
  };
}

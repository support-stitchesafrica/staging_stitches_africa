import { FlutterwaveAccountDetails, PayoutCalculation, PayoutResult } from "../types";

interface VendorDoc {
  id: string;
  brandName?: string;
  flutterwaveAccountDetails?: FlutterwaveAccountDetails;
  [key: string]: unknown;
}

interface OrderDoc {
  id: string;
  tailor_id: string;
  title?: string;
  product_title?: string;
  [key: string]: unknown;
}

interface FlutterwaveTransferResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
}

/**
 * Executes a Flutterwave transfer payout to the vendor's bank account.
 * Uses the vendor's flutterwaveAccountDetails stored in Firestore.
 */
export async function executeFlutterwavePayout(
  order: OrderDoc,
  vendor: VendorDoc,
  calculation: PayoutCalculation,
  secretKey: string
): Promise<PayoutResult> {
  const accountDetails = vendor.flutterwaveAccountDetails;

  if (
    !accountDetails?.bank_code ||
    !accountDetails?.account_number ||
    !accountDetails?.currency
  ) {
    return {
      status: "failed",
      error: "Vendor missing Flutterwave account details",
      provider: "flutterwave",
    };
  }

  // Unique reference per task 4.3
  const reference = `payout_${order.id}_${Date.now()}`;

  const payload = {
    account_bank: accountDetails.bank_code,
    account_number: accountDetails.account_number,
    amount: calculation.vendorAmount,
    narration: `Payout for order ${order.id}`,
    currency: accountDetails.currency ?? calculation.currency,
    reference,
    debit_currency: accountDetails.currency ?? calculation.currency,
  };

  const res = await fetch("https://api.flutterwave.com/v3/transfers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(payload),
  });

  const json: FlutterwaveTransferResponse = await res.json();

  // Map Flutterwave response to PayoutResult per task 4.4
  if (json.status === "success" && json.data) {
    const transferStatus = json.data.status?.toLowerCase();
    if (
      transferStatus === "successful" ||
      transferStatus === "new" ||
      transferStatus === "pending"
    ) {
      return {
        status: "completed",
        reference: json.data.reference ?? reference,
        provider: "flutterwave",
      };
    }
  }

  return {
    status: "failed",
    error: json.message ?? "Flutterwave transfer failed with unknown error",
    provider: "flutterwave",
  };
}

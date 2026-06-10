/**
 * Credit tailor wallets from order line items using NGN source_original_price
 * (same rules as app/shops/checkout/page.tsx processOrderCreation).
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

export type OrderLineItemForWallet = Record<string, unknown>;

function num(v: unknown): number | undefined {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : undefined;
}

/**
 * Per-tailor earnings in NGN from line items (source_original_price preferred).
 */
export function computeTailorEarningsFromItems(
  items: unknown[],
): Map<string, number> {
  const tailorEarnings = new Map<string, number>();

  if (!Array.isArray(items)) {
    return tailorEarnings;
  }

  for (const raw of items) {
    if (typeof raw !== 'object' || raw === null) continue;
    const item = raw as OrderLineItemForWallet;

    const tailorId = String(
      item.tailor_id ?? item.tailorId ?? '',
    ).trim();
    if (!tailorId) continue;

    const qty = Math.max(1, Math.floor(num(item.quantity) ?? 1));
    const unitEarning =
      num(item.source_original_price ?? item.sourceOriginalPrice) ??
      num(item.source_price ?? item.sourcePrice) ??
      0;

    if (unitEarning <= 0) continue;

    const earning = unitEarning * qty;
    tailorEarnings.set(tailorId, (tailorEarnings.get(tailorId) || 0) + earning);
  }

  return tailorEarnings;
}

export type CreditTailorWalletsResult = {
  credited: Record<string, number>;
  providerKey: string;
  skipped: boolean;
  reason?: string;
};

/**
 * Increment `tailors/{id}` wallet fields for each vendor in the order.
 * Non-blocking failures per tailor are logged; does not throw on partial failure.
 */
export async function creditTailorWalletsFromOrderItems(
  items: unknown[],
  options: {
    providerKey?: string;
    orderId?: string;
  } = {},
): Promise<CreditTailorWalletsResult> {
  const providerKey = (options.providerKey ?? 'manual_transfer')
    .toLowerCase()
    .trim();
  const tailorEarnings = computeTailorEarningsFromItems(items);

  if (tailorEarnings.size === 0) {
    return {
      credited: {},
      providerKey,
      skipped: true,
      reason: 'no_tailor_earnings',
    };
  }

  const credited: Record<string, number> = {};
  const now = FieldValue.serverTimestamp();

  await Promise.all(
    Array.from(tailorEarnings.entries()).map(async ([tailorId, amount]) => {
      try {
        await adminDb.collection('tailors').doc(tailorId).update({
          wallet: FieldValue.increment(amount),
          wallet_balance: FieldValue.increment(amount),
          [`wallet_by_provider.${providerKey}`]: FieldValue.increment(amount),
          'wallet_details.last_updated': now,
        });
        credited[tailorId] = amount;
      } catch (err) {
        console.warn(
          `[tailor-wallet-credit] Failed for tailor ${tailorId}${options.orderId ? ` order ${options.orderId}` : ''}:`,
          err,
        );
      }
    }),
  );

  if (options.orderId) {
    console.log(
      `[tailor-wallet-credit] Order ${options.orderId} credited:`,
      credited,
      'provider:',
      providerKey,
    );
  }

  return { credited, providerKey, skipped: false };
}

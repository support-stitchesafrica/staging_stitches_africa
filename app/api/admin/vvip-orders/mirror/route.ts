/**
 * POST /api/admin/vvip-orders/mirror
 * Backfills user_orders subcollection for existing VVIP orders
 * so adminGenerateDhlShipmentForOrderV2 can find them.
 *
 * Body: { orderId: string }  — mirrors a single VVIP order
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { buildVvipUserOrderMirrorWrites } from "@/lib/marketing/vvip-user-order-mirror";

export async function POST(request: NextRequest) {
  try {
    const { orderId, tailorId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Fetch the VVIP order from the top-level orders collection
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
    }

    const data = orderDoc.data()!;

    if (!data.isVvip) {
      return NextResponse.json({ error: "Order is not a VVIP order" }, { status: 400 });
    }

    const userId: string = data.userId;
    const items: any[] = data.items || [];

    if (!userId) {
      return NextResponse.json({ error: "Order has no userId" }, { status: 400 });
    }

    // Mirror only items belonging to the specified tailor (if tailorId provided)
    // This prevents all-tailor items from appearing under one vendor
    const itemsToMirror = tailorId
      ? items.filter((item: any) =>
          item.tailor_id === tailorId ||
          item.vendor?.id === tailorId ||
          item.tailor?.id === tailorId
        )
      : items;

    if (itemsToMirror.length === 0) {
      return NextResponse.json({
        success: true,
        mirrored: 0,
        message: `No items found for tailor ${tailorId} in order ${orderId}`,
      });
    }

    const shippingFee =
      typeof data.shippingFee === "number" && Number.isFinite(data.shippingFee)
        ? data.shippingFee
        : 0;

    const userNameFb = `${data.user_name || ""}`.trim();

    const mirrorWrites = buildVvipUserOrderMirrorWrites({
      userId,
      masterOrderId: orderId,
      items,
      shippingFee,
      shippingAddress: data.shipping_address || {},
      userNameFallback: userNameFb,
      orderStatus:
        typeof data.order_status === "string" ? data.order_status : "pending",
    });

    const filteredWrites = mirrorWrites.filter((_, idx) =>
    {
      if (!tailorId) return true;
      const cartItem = items[idx];
      return (
        cartItem &&
        (cartItem.tailor_id === tailorId ||
          cartItem.vendor?.id === tailorId ||
          cartItem.tailor?.id === tailorId)
      );
    });

    const mirrorPromises = filteredWrites.map(({ docId, data: row }) =>
      adminDb
        .collection("users_orders")
        .doc(userId)
        .collection("user_orders")
        .doc(docId)
        .set(row as Record<string, unknown>, { merge: true }),
    );

    await Promise.all(mirrorPromises);

    return NextResponse.json({
      success: true,
      mirrored: filteredWrites.length,
      message: `Mirrored ${filteredWrites.length} item(s) for order ${orderId}`,
    });
  } catch (error: any) {
    console.error("[VVIP Mirror] Error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

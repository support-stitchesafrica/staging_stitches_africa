import { UserOrder } from "../../../types";

type OrderData = Partial<UserOrder>;

const DELIVERED_STATUSES = ["delivered", "ok - delivered", "shipment delivered"];

function isDeliveredState(order: OrderData): boolean {
  const lastEventStatus = order.last_dhl_event?.status?.toLowerCase() ?? "";
  const orderStatus = order.order_status?.toLowerCase() ?? "";
  return (
    DELIVERED_STATUSES.some((s) => lastEventStatus.includes(s)) ||
    orderStatus === "delivered"
  );
}

/**
 * Returns true only when transitioning TO a delivered state (not already delivered).
 */
export function isDeliveryEvent(before: OrderData, after: OrderData): boolean {
  const wasDeliveredBefore = isDeliveredState(before);
  const isDeliveredNow = isDeliveredState(after);
  return isDeliveredNow && !wasDeliveredBefore;
}

import { UserOrder } from "./userOrder";

interface MostOrderedProduct {
  product_id: string;
  title: string;
  totalQuantity: number;
  tailor_name: string;
}

export const getMostOrderedProduct = (orders: UserOrder[]): MostOrderedProduct | null => {
  const productMap: Record<string, MostOrderedProduct> = {};

  for (const order of orders) {
    const key = order.product_id;

    if (!productMap[key]) {
      productMap[key] = {
        product_id: key,
        title: order.title,
        totalQuantity: order.quantity,
        tailor_name: order.tailor_name
      };
    } else {
      productMap[key].totalQuantity += order.quantity;
    }
  }

  const mostOrdered = Object.values(productMap).reduce((max, curr) =>
    curr.totalQuantity > max.totalQuantity ? curr : max
  , { product_id: "", title: "", totalQuantity: 0, tailor_name: "" });

  return mostOrdered.totalQuantity > 0 ? mostOrdered : null;
};

import { parseISO } from "date-fns";
import { OrderResponse } from "./returnOrder";

export const calculateCustomerRetentionRate = (responses: OrderResponse[]): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = (currentMonth - 1 + 12) % 12;
  const currentYear = now.getFullYear();
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthCustomers = new Set<string>();
  const previousMonthCustomers = new Set<string>();

  for (const res of responses) {
    for (const order of res.user_order) {
      const date = new Date(order.timestamp || order.delivery_date);
      const month = date.getMonth();
      const year = date.getFullYear();

      if (year === currentYear && month === currentMonth) {
        currentMonthCustomers.add(order.user_id);
      } else if (year === previousYear && month === previousMonth) {
        previousMonthCustomers.add(order.user_id);
      }
    }
  }

  const returningCustomers = Array.from(currentMonthCustomers).filter(userId =>
    previousMonthCustomers.has(userId)
  );

  const totalCurrent = currentMonthCustomers.size;

  if (totalCurrent === 0) return 0;

  const retentionRate = (returningCustomers.length / totalCurrent) * 100;
  return Math.round(retentionRate); // or use `toFixed(2)` for decimals
};

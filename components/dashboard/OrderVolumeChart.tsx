"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAllUserOrders, UserOrder } from "@/admin-services/userOrder";

interface MonthlyOrderData {
  name: string; // e.g., Jan, Feb
  orders: number;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function OrderVolumeChart() {
  const [chartData, setChartData] = useState<MonthlyOrderData[]>([]);

  useEffect(() => {
    const fetchOrdersAndGroupByMonth = async () => {
      const allOrders: UserOrder[] = [];
      let lastDoc = null;
      let hasMore = true;

      // Fetch all pages of orders
      while (hasMore) {
        const { orders, lastVisible, hasMore: more } = await fetchAllUserOrders({ lastDoc });
        allOrders.push(...orders);
        lastDoc = lastVisible;
        hasMore = more;
      }

      // Initialize counts for all 12 months
      const monthlyCounts = new Array(12).fill(0);

      allOrders.forEach((order) => {
        const date = new Date(order.timestamp);
        const monthIndex = date.getMonth(); // 0 = Jan, 11 = Dec
        monthlyCounts[monthIndex]++;
      });

      // Format for recharts
      const formattedData: MonthlyOrderData[] = monthNames.map((name, i) => ({
        name,
        orders: monthlyCounts[i]
      }));

      setChartData(formattedData);
    };

    fetchOrdersAndGroupByMonth();
  }, []);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg lg:text-xl text-gray-900 dark:text-gray-100">
          Order Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="name"
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <YAxis 
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)'
                }}
              />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

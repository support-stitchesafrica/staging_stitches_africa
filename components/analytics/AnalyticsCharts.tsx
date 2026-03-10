"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAllUserOrders, UserOrder } from "@/admin-services/userOrder";

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const categoryColors = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#3b82f6", // Blue
];

export const AnalyticsCharts = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      const allOrders: UserOrder[] = [];
      let lastDoc = null;
      let hasMore = true;

      while (hasMore) {
        const { orders, lastVisible, hasMore: more } = await fetchAllUserOrders({ lastDoc });
        allOrders.push(...orders);
        lastDoc = lastVisible;
        hasMore = more;
      }

      const monthlyAgg = new Array(12).fill(null).map((_, i) => ({
        month: monthLabels[i],
        revenue: 0,
        orders: 0,
      }));

      const categoryCount: Record<string, number> = {};

      allOrders.forEach((order) => {
        const date = new Date(order.timestamp);
        const monthIndex = date.getMonth();

        monthlyAgg[monthIndex].orders += 1;
        monthlyAgg[monthIndex].revenue += order.price || 0;

        const category = order.wear_category || "Uncategorized";
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const formattedCategories: CategoryData[] = Object.entries(categoryCount).map(([name, value], index) => ({
        name,
        value,
        color: categoryColors[index % categoryColors.length],
      }));

      setMonthlyData(monthlyAgg);
      setCategoryData(formattedCategories);
    };

    loadAnalytics();
  }, []);

  return (
    <motion.div
      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 📈 Revenue Overview */}
      <Card className="bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-gray-900 dark:to-gray-800 shadow-lg border-none rounded-2xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#colorRevenue)"
                strokeWidth={4}
                dot={{ r: 5, fill: "#6366f1" }}
                activeDot={{ r: 7, stroke: "#4338ca", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 🥧 Sales by Category */}
      <Card className="bg-gradient-to-br from-cyan-100 via-white to-indigo-100 dark:from-gray-900 dark:to-gray-800 shadow-lg border-none rounded-2xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
            Sales by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex justify-center">
          <ResponsiveContainer width="90%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 📦 Monthly Orders */}
      <Card className="bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-gray-900 dark:to-gray-800 shadow-lg border-none rounded-2xl xl:col-span-2 hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
            Monthly Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="orders" fill="url(#colorOrders)" radius={[8, 8, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

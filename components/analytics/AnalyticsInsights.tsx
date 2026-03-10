"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Users, UserPlus } from "lucide-react";
import { fetchLowStockWears } from "@/admin-services/fetchLowStockWears";
import { fetchAllUserOrders } from "@/admin-services/userOrder";
import { getMostOrderedProduct } from "@/admin-services/getMostOrderedProduct";
import { useMonthlyCustomerRegistrations } from "@/admin-services/useMonthlyCustomerRegistrations";
import { fetchAllReturnOrders } from "@/admin-services/returnOrder";
import { calculateCustomerRetentionRate } from "@/admin-services/calculateCustomerRetentionRate";

export const AnalyticsInsights = () =>
{
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [topProduct, setTopProduct] = useState<{
    title: string;
    totalQuantity: number;
    tailor_name: string;
  } | null>(null);
  const [retention, setRetention] = useState<number | null>(null);

  const monthlyRegistrations = useMonthlyCustomerRegistrations();

  useEffect(() =>
  {
    const fetchInsights = async () =>
    {
      const wears = await fetchLowStockWears();
      setLowStockCount(wears.length);

      const orders = await fetchAllUserOrders();
      const top = getMostOrderedProduct(orders.orders);
      setTopProduct(top);

      const returnOrders = await fetchAllReturnOrders();
      const retentionRate = calculateCustomerRetentionRate(returnOrders.orders);
      setRetention(retentionRate);
    };

    fetchInsights();
  }, []);

  const insights = [
    {
      title: "Top Performing Product",
      description: topProduct
        ? `Most ordered product: ${topProduct.title} (${topProduct.totalQuantity} orders) by ${topProduct.tailor_name}`
        : "Analyzing product performance...",
      type: "success",
      icon: TrendingUp,
      action: "View Details",
    },
    {
      title: "Inventory Alert",
      description:
        lowStockCount !== null
          ? `${lowStockCount} product${lowStockCount !== 1 ? "s" : ""} are running low on stock and need restocking soon`
          : "Checking inventory status...",
      type: "warning",
      icon: AlertCircle,
      action: "Manage Inventory",
    },
    {
      title: "Customer Retention",
      description:
        retention !== null
          ? `Your customer retention rate is ${retention}% compared to last month`
          : "Calculating retention rate...",
      type: "info",
      icon: Users,
      action: "View Report",
    },
    {
      title: "New Customers",
      description: `You gained ${monthlyRegistrations} new customers this month.`,
      type: "growth",
      icon: UserPlus,
      action: "See Customers",
    },
  ];

  const getCardStyle = (type: string) =>
  {
    switch (type)
    {
      case "success":
        return "border-l-4 border-l-green-500";
      case "warning":
        return "border-l-4 border-l-yellow-500";
      case "info":
        return "border-l-4 border-l-blue-500";
      case "progress":
        return "border-l-4 border-l-purple-500";
      default:
        return "";
    }
  };

  const getIconColor = (type: string) =>
  {
    switch (type)
    {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      case "progress":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Business Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {insights.map((insight, index) => (
          <Card
            key={index}
            className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${getCardStyle(insight.type)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <insight.icon className={`h-5 w-5 ${getIconColor(insight.type)}`} />
                <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {insight.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                {insight.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

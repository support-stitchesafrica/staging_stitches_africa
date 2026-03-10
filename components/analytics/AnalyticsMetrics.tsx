
"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveProducts } from "@/admin-services/useActiveProducts";
import { useTotalCustomers } from "@/admin-services/useTotalCustomers";
import { useTotalRevenue } from "@/admin-services/useTotalRevenue";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart } from "lucide-react";

export const AnalyticsMetrics = () =>
{
  const { totalRevenue, totalOrders, totalQuantity } = useTotalRevenue();
  const totalCustomers = useTotalCustomers();
  const activeProducts = useActiveProducts();

  const formattedRevenue = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(totalRevenue);
  const metrics = [
    {
      title: "Total Revenue",
      value: formattedRevenue,
      change: "+20.1%",
      changeType: "increase",
      icon: DollarSign,
      description: "from last month"
    },
    {
      title: "Total Orders",
      value: totalOrders,
      change: "+15.3%",
      changeType: "increase",
      icon: ShoppingCart,
      description: "from last month"
    },
    {
      title: "Active Products",
      value: activeProducts,
      change: "+5.2%",
      changeType: "increase",
      icon: Package,
      description: "from last month"
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      change: "-2.1%",
      changeType: "decrease",
      icon: Users,
      description: "from last month"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metric.value}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {metric.changeType === "increase" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={metric.changeType === "increase" ? "text-green-500" : "text-red-500"}>
                {metric.change}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {metric.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

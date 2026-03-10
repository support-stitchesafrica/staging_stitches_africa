"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTotalCustomers } from "@/admin-services/useTotalCustomers";
import { useTotalRevenue } from "@/admin-services/useTotalRevenue";
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Users } from "lucide-react";

export function DashboardStats() {
  const { totalRevenue, totalOrders, totalQuantity } = useTotalRevenue();
  const totalCustomers = useTotalCustomers();
  const formattedRevenue = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(totalRevenue);

  const stats = [
    {
      title: "Total Revenue",
      value: formattedRevenue,
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      change: "+15.3%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Products Sold",
      value: totalQuantity,
      change: "+8.2%",
      trend: "up",
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Active Customers",
      value: totalCustomers,
      change: "-2.4%",
      trend: "down",
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

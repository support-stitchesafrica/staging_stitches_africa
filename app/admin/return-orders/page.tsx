'use client';

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import
{
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { fetchAllReturnOrders, OrderResponse } from "@/admin-services/returnOrder";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";

const ReturnOrders = () =>
{
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
    
      useEffect(() => {
        const role = localStorage.getItem("adminRole");
    
        // 🚨 Redirect if not superadmin or admin
        if (role !== "superadmin" && role !== "admin") {
          router.replace("/"); // redirect to home
        }
      }, [router]);

  useEffect(() =>
  {
    const loadOrders = async () =>
    {
      setLoading(true);
      const { orders: fetchedOrders } = await fetchAllReturnOrders({ search });
      setOrders(fetchedOrders);
      setLoading(false);
    };

    loadOrders();
  }, [search]);

  return (
    <SidebarLayout
      pageTitle="Return Orders"
      pageDescription="Manage product returns and refund requests"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Return Orders</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by tailor name..."
                  className="pl-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                Process Return
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[640px] sm:min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">ORDER REF</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">PRODUCT</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">QUANTITY</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">REASON</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">STATUS</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <LoadingSpinner/>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No return orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((response) =>
                  response.user_order.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">{order.product_order_ref}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{order.title}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{order.quantity}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{response.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            response.status === "completed"
                              ? "default"
                              : response.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            response.status === "completed"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                              : response.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"
                                : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                          }
                        >
                          {response.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {new Date(order.timestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ReturnOrders;

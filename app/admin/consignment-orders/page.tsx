"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { fetchAllUserOrders, UserOrder } from "@/admin-services/userOrder";
import NoItemFound from "@/components/NoItemFound";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";

let searchTimeout: NodeJS.Timeout;

const truncateId = (id: string, length = 8) =>
  id.length > length ? id.slice(0, length) + "..." : id;

const ConsignmentOrders = () => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();
    
      useEffect(() => {
        const role = localStorage.getItem("adminRole");
    
        // 🚨 Redirect if not superadmin or admin
        if (role !== "superadmin" && role !== "admin") {
          router.replace("/"); // redirect to home
        }
      }, [router]);

  const loadOrders = async (loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
      setLastDoc(null); // Reset pagination when not loading more
    }

    const { orders: newOrders, lastVisible, hasMore } = await fetchAllUserOrders({
      status,
      search: debouncedSearch,
      lastDoc: loadMore ? lastDoc : null
    });

    setOrders(loadMore ? [...orders, ...newOrders] : newOrders);
    setLastDoc(lastVisible as any);
    setHasMore(hasMore);
    setLoading(false);
  };

  // Debounce search input
  useEffect(() => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Fetch when filters or debounced search changes
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "in Progress":
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SidebarLayout
      pageTitle="Consignment"
      pageDescription="Manage your incoming consignment orders"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by customer name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full sm:w-60 text-sm bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in Progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="overflow-x-auto w-full">
              <h1 className="text-lg font-bold sm:text-base lg:text-lg">Recent Consignment Orders</h1>
              <p className="text-xs sm:text-sm">Track and manage your consignment orders</p>

              {loading && orders.length === 0 ? (
                <LoadingSpinner/>
              ) : orders.length === 0 ? (
                <NoItemFound/>
              ) : (
                <>
                  <Table className="min-w-[640px] sm:min-w-[720px] text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const customerName = `${order.user_address.first_name} ${order.user_address.last_name}`;
                        return (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">{truncateId(order.order_id)}</TableCell>
                            <TableCell>{customerName}</TableCell>
                            <TableCell>{new Date(order.timestamp).toLocaleDateString()}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>${order.price.toLocaleString()}</TableCell>
                            <TableCell>{order.delivery_date}</TableCell>
                            <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {hasMore && (
                    <div className="text-center mt-4">
                      <Button onClick={() => loadOrders(true)} disabled={loading}>
                        {loading ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ConsignmentOrders;

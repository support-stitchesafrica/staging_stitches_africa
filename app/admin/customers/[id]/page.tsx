"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import CustomerSidebarLayout from "@/components/layout/CustomerSidebarLayout";
import { UsersTab } from "@/components/vendor/users-tab";
import { ProductsTab } from "@/components/vendor/products-tab";
import { OrdersTab } from "@/components/vendor/orders-tab";
import { TransactionsTab } from "@/components/vendor/transactions-tab";
import { getUserById, User, getOrdersByUserId, UserOrder } from "@/admin-services/userService";
import { CustomerOrdersTab } from "@/components/vendor/customer-orders-tab";
import { CustomerReturnsTab } from "@/components/vendor/customer-return-tab";
CustomerReturnsTab
import { useParams } from "next/navigation";
import Link from "next/link";

const CustomerDetailPage = () => {
  const params = useParams();
  const userId = params.id as string;

  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge>Unknown</Badge>;
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">Approved</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-100 text-red-800">Inactive</Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        if (!userData) {
          setError("Customer not found");
          setLoading(false);
          return;
        }
        setCustomer(userData);

        const userOrders = await getOrdersByUserId(userId);
        setOrders(userOrders);
      } catch (err) {
        console.error(err);
        setError("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <CustomerSidebarLayout
        pageTitle="Customer Dashboard"
        pageDescription="Loading customer details..."
      >
        <p>Loading...</p>
      </CustomerSidebarLayout>
    );
  }

  if (error) {
    return (
      <CustomerSidebarLayout
        pageTitle="Customer Dashboard"
        pageDescription="Error loading customer details"
      >
        <p className="text-red-500">{error}</p>
      </CustomerSidebarLayout>
    );
  }

  if (!customer) {
    return (
      <CustomerSidebarLayout
        pageTitle="Customer Dashboard"
        pageDescription="Customer not found"
      >
        <p>No customer found with this ID.</p>
      </CustomerSidebarLayout>
    );
  }

  return (
    <CustomerSidebarLayout
      pageTitle="Customer Dashboard"
      pageDescription="View customer profile, orders, and activity"
    >
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="admin/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">
            {customer.first_name} {customer.last_name}
          </h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {customer.first_name} {customer.last_name}
              </CardTitle>
              <CardDescription>Customer ID: {customer.id}</CardDescription>
            </div>
            {getStatusBadge("approved")} {/* If you have status in User, replace this */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Email:</strong> {customer.email || "N/A"}
              </p>
              <p>
                <strong>Created At:</strong> {customer.createdAt || "N/A"}
              </p>
            </div>
            <div>
              <p>
                <strong>Tailor ID:</strong> {customer.tailorId || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="space-y-4 mt-4">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="returns">Return History</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <CustomerOrdersTab userId={userId} />
        </TabsContent>
        <TabsContent value="returns">
          <CustomerReturnsTab userId={userId} />
        </TabsContent>
      </Tabs>
    </CustomerSidebarLayout>
  );
};

export default CustomerDetailPage;

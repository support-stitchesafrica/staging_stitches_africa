"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { getTailorWorks, TailorWork } from "@/admin-services/getTailorWorks";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 5;

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState<TailorWork[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
    
      useEffect(() => {
        const role = localStorage.getItem("adminRole");
    
        // 🚨 Redirect if not superadmin or admin
        if (role !== "superadmin" && role !== "admin") {
          router.replace("/"); // redirect to home
        }
      }, [router]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getTailorWorks();
        setInventoryData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch tailor works:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const getStockStatus = (quantity?: number) => {
    if (typeof quantity !== "number") return "Unknown";
    return quantity <= 5 ? "Low Stock" : "In Stock";
  };

  const filteredData = inventoryData.filter((item) => {
    const title = item?.title ?? "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

    const stockStatus = getStockStatus(item?.wear_quantity);
    const matchesStatus =
      statusFilter === "all" ||
      stockStatus.toLowerCase().replace(" ", "-") === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <SidebarLayout
      pageTitle="Inventory"
      pageDescription="Manage your product inventory, stock levels, and alerts"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory</h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Filter Dropdown */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Add Button */}
              <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : paginatedData.length === 0 ? (
            <div className="p-6 text-gray-500 dark:text-gray-400">No products found.</div>
          ) : (
            <>
              <Table className="min-w-[640px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">PRODUCT NAME</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">SKU</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">AVAILABLE UNITS</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">RESERVED UNITS</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">STATUS</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => {
                    const status = getStockStatus(item?.wear_quantity);

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {item?.title ?? "Untitled"}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {(item?.product_id ?? "UNKNOWN").slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {item?.wear_quantity ?? 0}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">0</TableCell>
                        <TableCell>
                          <Badge
                            variant={status === "In Stock" ? "default" : "secondary"}
                            className={
                              status === "In Stock"
                                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20"
                                : "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                            }
                          >
                            {status === "Low Stock" && "⚠ "}
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span className="text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Inventory;

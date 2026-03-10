"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SidebarLayout from "@/components/layout/SidebarLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAllTailorTransactions, TailorTransaction } from "@/admin-services/getTailorTransactions";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 5;

const StatementOfAccount = () => {
  const [transactions, setTransactions] = useState<TailorTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const parseCustomDate = (dateStr: string) => {
  // Example: "30 July 2025 at 23:52:43 UTC+1"
  try {
    const parts = dateStr.replace(" at ", " ");
    const parsedDate = new Date(parts);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    // Fallback: manually split components
    const [day, monthName, year, time, tz] = parts.split(" ");
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth(); // convert month name to index
    return new Date(`${year}-${monthIndex + 1}-${day}T${time}${tz.replace("UTC", "")}`);
  } catch {
    return new Date(); // fallback to now if parsing fails
  }
};

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const tailorId = localStorage.getItem("tailorUID") || "";
      try {
        const data = await getAllTailorTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((item) =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Transaction Statement", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Date", "Description", "Amount", "Type"]],
      body: filteredTransactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        `$${tx.amount.toFixed(2)}`,
        tx.type,
      ]),
    });

    doc.save("statement.pdf");
  };

  return (
    <SidebarLayout
      pageTitle="Statement"
      pageDescription="View your transaction history and account balance"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transaction History
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // reset page
                  }}
                />
              </div>

              <Button onClick={handleExportPDF} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                Export to PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[640px] sm:min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">DATE</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">DESCRIPTION</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">AMOUNT</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Status</TableHead>
                <TableHead className="text-gray-500 dark:text-gray-400 font-medium">TYPE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {parseCustomDate(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      ${item.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.type === "Credit" ? "default" : "secondary"}
                        className={ "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.type === "Credit" ? "default" : "secondary"}
                        className={
                          item.type === "Credit"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                        }
                      >
                        {item.type}
                      </Badge>
                    </TableCell>
                    
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center px-4 py-4 border-t dark:border-gray-700 text-sm">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default StatementOfAccount;

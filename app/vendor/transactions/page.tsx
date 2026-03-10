"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Banknote,
  Download,
} from "lucide-react";
import {
  getTailorTransactionsById,
  TailorTransaction,
} from "@/vendor-services/getTailorTransactionsById";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
    case "Success":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "Credit Card":
      return <CreditCard className="h-4 w-4" />;
    case "Cash":
      return <Banknote className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp?.seconds) return "Invalid date";
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TailorTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const fetchData = async () => {
      const tailorId = localStorage.getItem("tailorUID");
      if (!tailorId) return;
      const txs = await getTailorTransactionsById(tailorId);
      setTransactions(txs || []);
    };
    fetchData();
  }, []);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Filtered transactions by tab and search
  const filteredTransactions = transactions.filter((transaction) => {
    const desc = (transaction.description || "").toLowerCase();
    const txId = (transaction.transaction_id || "").toLowerCase();
    const matchesSearch =
      desc.includes(searchTerm.toLowerCase()) ||
      txId.includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "income") return matchesSearch && transaction.type === "income";
    if (activeTab === "expenses") return matchesSearch && transaction.type === "expense";

    return matchesSearch;
  });

  // --- Metrics ---

  // totalGrossPayments: sum of successful/completed payments (description includes 'payment' OR type === 'income')
  const totalGrossPayments = filteredTransactions
    .filter(
      (t) =>
        (t.description?.toLowerCase().includes("payment") || t.type === "income") &&
        (t.status === "Completed" || t.status === "Success")
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // totalCommission: sum of successful/completed commission entries (we keep them only for calculation, not display)
  const totalCommission = filteredTransactions
    .filter(
      (t) =>
        t.description?.toLowerCase().includes("commission") &&
        (t.status === "Completed" || t.status === "Success")
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Active balance = payments - commissions (only subtract commissions, as requested)
  const activeBalance = totalGrossPayments - totalCommission;

  // totalExpenses: sum of expense transactions EXCLUDING commission entries (so commission isn't double counted)
  const totalExpenses = filteredTransactions
    .filter(
      (t) =>
        t.type === "expense" &&
        !t.description?.toLowerCase().includes("commission") &&
        (t.status === "Completed" || t.status === "Success")
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Helper to format amounts with sign and comma separators
  const formatAmount = (amount: number, type?: string, description?: string) => {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (type === "expense") return `-${formatted}`;
    // If description is a payment we keep it positive sign
    return `+${formatted}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </div>

        {/* Summary Cards: Total (gross payments), Active (payments - commissions), Expenses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalGrossPayments.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <ArrowUpRight className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                  <p
                    className={`text-2xl font-bold ${
                      activeBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${Math.abs(activeBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${activeBalance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                  <ArrowUpRight
                    className={`h-6 w-6 ${activeBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <ArrowDownLeft className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>View all your financial transactions</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="all" className="flex-1 sm:flex-auto">
                  All Transactions ({filteredTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="income" className="flex-1 sm:flex-auto">
                  Income ({filteredTransactions.filter((t) => t.type === "income").length})
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex-1 sm:flex-auto">
                  Expenses ({filteredTransactions.filter((t) => t.type === "expense").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {paginatedTransactions.map((transaction) => {
                  const isPayment = transaction.description?.toLowerCase().includes("payment") || transaction.type === "income";
                  const isCommission = transaction.description?.toLowerCase().includes("commission");
                  const isExpense = transaction.type === "expense" && !isCommission;
                  // Display sign according to type: expenses negative, others positive.
                  const amountNumber = Number(transaction.amount || 0);
                  const displayAmount =
                    isExpense ? `-${amountNumber.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
                    `+${amountNumber.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

                  return (
                    <div
                      key={transaction.transaction_id}
                      className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                          <div
                            className={`p-3 rounded-full flex-shrink-0 ${
                              isPayment ? "bg-green-100" : transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {isPayment ? (
                              <ArrowUpRight className="h-6 w-6 text-green-600" />
                            ) : transaction.type === "income" ? (
                              <ArrowUpRight className="h-6 w-6 text-green-600" />
                            ) : (
                              <ArrowDownLeft className="h-6 w-6 text-red-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                              <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <span className="font-medium">ID:</span> {transaction.transaction_id}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium">Order:</span> {transaction.order_id || "N/A"}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${
                                isExpense ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              ${displayAmount}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              {getPaymentMethodIcon("Credit Card")}
                              <span className="ml-1">{transaction.created_by}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                            {transaction.order_id && <Button variant="outline" size="sm">View Order</Button>}
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {paginatedTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                      Next
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Eye, Search } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Transaction {
  id: string
  orderId: string
  customerName: string
  amount: number
  type: "payment" | "refund" | "commission"
  status: "completed" | "pending" | "failed"
  date: string
  paymentMethod: string
  description: string
}

const mockTransactions: Transaction[] = [
  {
    id: "TXN001",
    orderId: "ORD001",
    customerName: "Alice Cooper",
    amount: 1999.98,
    type: "payment",
    status: "completed",
    date: "2024-03-01",
    paymentMethod: "Credit Card",
    description: "Payment for Enterprise Software Suite",
  },
  {
    id: "TXN002",
    orderId: "ORD002",
    customerName: "Bob Wilson",
    amount: 49.99,
    type: "payment",
    status: "pending",
    date: "2024-03-10",
    paymentMethod: "PayPal",
    description: "Payment for Cloud Storage Solution",
  },
  {
    id: "TXN003",
    orderId: "ORD001",
    customerName: "Alice Cooper",
    amount: -199.99,
    type: "refund",
    status: "completed",
    date: "2024-03-12",
    paymentMethod: "Credit Card",
    description: "Partial refund for Enterprise Software Suite",
  },
  {
    id: "TXN004",
    orderId: "ORD003",
    customerName: "Carol Brown",
    amount: 59.99,
    type: "commission",
    status: "completed",
    date: "2024-03-08",
    paymentMethod: "Bank Transfer",
    description: "Commission for Analytics Dashboard sale",
  },
]

interface TransactionsTabProps {
  vendorId: string
}

export function TransactionsTab({ vendorId }: TransactionsTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const filteredTransactions = mockTransactions.filter(transaction =>
    transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "payment":
        return <Badge className="bg-blue-100 text-blue-800">Payment</Badge>
      case "refund":
        return <Badge className="bg-orange-100 text-orange-800">Refund</Badge>
      case "commission":
        return <Badge className="bg-purple-100 text-purple-800">Commission</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          All transactions for this vendor
        </CardDescription>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id}</TableCell>
                <TableCell>{transaction.orderId}</TableCell>
                <TableCell>{transaction.customerName}</TableCell>
                <TableCell className={transaction.amount < 0 ? "text-red-600" : "text-green-600"}>
                  ${Math.abs(transaction.amount)}
                </TableCell>
                <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.paymentMethod}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription>
                          Detailed information for transaction {selectedTransaction?.id}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedTransaction && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p><strong>Transaction ID:</strong> {selectedTransaction.id}</p>
                              <p><strong>Order ID:</strong> {selectedTransaction.orderId}</p>
                              <p><strong>Customer:</strong> {selectedTransaction.customerName}</p>
                              <p><strong>Amount:</strong> ${Math.abs(selectedTransaction.amount)}</p>
                            </div>
                            <div>
                              <p><strong>Type:</strong> {selectedTransaction.type}</p>
                              <p><strong>Status:</strong> {selectedTransaction.status}</p>
                              <p><strong>Date:</strong> {selectedTransaction.date}</p>
                              <p><strong>Payment Method:</strong> {selectedTransaction.paymentMethod}</p>
                            </div>
                          </div>
                          <div>
                            <p><strong>Description:</strong></p>
                            <p className="text-sm text-muted-foreground">{selectedTransaction.description}</p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

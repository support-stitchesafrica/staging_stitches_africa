"use client";

import VendorSidebarLayout from '@/components/layout/VendorSidebarLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTailors } from '@/admin-services/useTailors'
import { ArrowLeft, Eye, Search } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'

const VendorPages = () =>
{
    const { tailors, loading, error } = useTailors()
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 5

    const search = searchTerm.toLowerCase()
    const filteredVendors = (tailors || []).filter((vendor) =>
    {
        return (
            (vendor?.brand_name && vendor?.brand_name.toLowerCase().includes(search)) ||
            (vendor.tailor_registered_info?.email && vendor.tailor_registered_info.email.toLowerCase().includes(search)) ||
            (vendor.id && vendor.id.toLowerCase().includes(search))
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredVendors.length / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const paginatedVendors = filteredVendors.slice(startIndex, startIndex + rowsPerPage)



    // Optional: Map it to something like a badge color
    const getStatusColor = (status: string) =>
    {
        switch (status?.toLowerCase())
        {
            case "approved":
                return "bg-green-100 text-green-800"; // Approved style
            case "pending":
            default:
                return "bg-yellow-100 text-yellow-800"; // Pending style
        }
    };

    return (
        <VendorSidebarLayout
            pageTitle="Vendor Dashboard"
            pageDescription="Manage your product inventory, stock levels, and alerts"
        >
            <div className="flex items-center justify-between space-y-2 mb-3">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/vendors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to dashboard
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Vendors</CardTitle>
                    <CardDescription>
                        Manage and view all vendors in your system
                    </CardDescription>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) =>
                            {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1) // reset page when searching
                            }}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>

                <CardContent>
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Wallet</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedVendors.map((vendor) =>
                            {
                                // Extract the status for this vendor
                                const status = vendor["company_verification"]?.status || "pending";

                                return (
                                    <TableRow key={vendor.id}>
                                        <TableCell className="font-medium">{vendor.id}</TableCell>
                                        <TableCell>{vendor.brand_name}</TableCell>
                                        <TableCell>{vendor.tailor_registered_info?.email || "—"}</TableCell>

                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                {status}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            {vendor.wallet ? `$${vendor.wallet}` : "$0"}
                                        </TableCell>
                                        <TableCell>{vendor.totalProducts}</TableCell>
                                        <TableCell>{vendor.totalUsers}</TableCell>
                                        <TableCell>{vendor.totalOrders}</TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/admin/all-vendors/${vendor.id}`}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {paginatedVendors.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        No vendors found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination controls */}
                    <div className="flex justify-between items-center mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <span>
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </VendorSidebarLayout>
    )
}

export default VendorPages

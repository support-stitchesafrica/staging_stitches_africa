"use client"

import VendorSidebarLayout from '@/components/layout/VendorSidebarLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Vendorlanding from '@/components/Vendor'
import { useTailors } from '@/admin-services/useTailors'
import { ArrowLeft, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

const VendorPage = () =>
{
    const { tailors, loading, error } = useTailors()
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 5

    const search = searchTerm.toLowerCase()
    const filteredVendors = (tailors || []).filter((vendor) =>
    {
        return (
            (vendor.brand_name && vendor.brand_name.toLowerCase().includes(search)) ||
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
                                    <Link href="/admin">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Admin Portal
                                    </Link>
                                </Button>
                            </div>
                        </div>
            <Vendorlanding />
        </VendorSidebarLayout>
    )
}

export default VendorPage

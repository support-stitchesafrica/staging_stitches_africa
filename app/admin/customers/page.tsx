"use client";

// pages/CustomerPages.tsx
import CustomerSidebarLayout from '@/components/layout/CustomerSidebarLayout'
import VendorSidebarLayout from '@/components/layout/VendorSidebarLayout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllUsers, User } from '@/admin-services/userService'
import { ArrowLeft, Eye, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation';

const CustomerPages = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 5

    const router = useRouter();
      
        useEffect(() => {
          const role = localStorage.getItem("adminRole");
      
          // 🚨 Redirect if not superadmin or admin
          if (role !== "superadmin" && role !== "admin") {
            router.replace("/"); // redirect to home
          }
        }, [router]);

    // Fetch all users
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getAllUsers()
                setUsers(data)
            } catch (err) {
                console.error(err)
                setError("Failed to fetch users")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const search = searchTerm.toLowerCase()
    const filteredUsers = users.filter((user) => {
        return (
            (user.first_name && user.first_name.toLowerCase().includes(search)) ||
            (user.last_name && user.last_name.toLowerCase().includes(search)) ||
            (user.email && user.email.toLowerCase().includes(search)) ||
            (user.id && user.id.toLowerCase().includes(search))
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage)

    return (
        <CustomerSidebarLayout
            pageTitle="Customer Dashboard"
            pageDescription="Manage and view all registered customers"
        >
            <div className="flex items-center justify-between space-y-2 mb-3">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to dashboard
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                    <CardDescription>
                        Manage and view all customers in your system
                    </CardDescription>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
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
                                <TableHead>User ID</TableHead>
                                <TableHead>First Name</TableHead>
                                <TableHead>Last Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tailor ID</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.id}</TableCell>
                                    <TableCell>{user.first_name}</TableCell>
                                    <TableCell>{user.last_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.tailorId || "—"}</TableCell>
                                    <TableCell>
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/customers/${user.id}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {paginatedUsers.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        No customers found
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
        </CustomerSidebarLayout>
    )
}

export default CustomerPages

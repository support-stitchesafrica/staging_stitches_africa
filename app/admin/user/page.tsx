"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { deleteAdmin, getAllAdmins, updateSubAdminRole, createSubAdmin } from "@/admin-services/adminAuth"
import SidebarLayout from "@/components/layout/SidebarLayout"

type Admin = {
    uid: string
    firstName: string
    lastName: string
    email: string
    username: string
    role: "admin" | "superadmin"
    createdAt: string
}

export default function UserManagementPage()
{
    const [admins, setAdmins] = useState<Admin[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
    const [openDialog, setOpenDialog] = useState<"view" | "edit" | "delete" | "create" | null>(null)

    // create form state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState<"admin" | "superadmin">("admin")



    const { userRole } = useAuth() // still available if you want it elsewhere

    useEffect(() =>
    {
        const fetchAdmins = async () =>
        {
            try
            {
                const data = await getAllAdmins()
                setAdmins(data as Admin[])
            } catch (err: any)
            {
                toast.error(err.message)
            } finally
            {
                setLoading(false)
            }
        }
        fetchAdmins()
    }, [])


    const columns: ColumnDef<Admin>[] = [
        { header: "First Name", accessorKey: "firstName" },
        { header: "Last Name", accessorKey: "lastName" },
        { header: "Email", accessorKey: "email" },
        { header: "Username", accessorKey: "username" },
        { header: "Role", accessorKey: "role" },
        {
            header: "Created At",
            accessorKey: "createdAt",
            cell: ({ getValue }) =>
            {
                const value = getValue() as any

                if (!value) return ""

                // Handle Firestore Timestamp
                if (value.seconds)
                {
                    const date = new Date(value.seconds * 1000)
                    return date.toLocaleString() // or toLocaleDateString()
                }

                // Handle string date fallback
                if (typeof value === "string")
                {
                    return new Date(value).toLocaleString()
                }

                return String(value)
            },
        },
        {
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                        {
                            setSelectedAdmin(row.original)
                            setOpenDialog("view")
                        }}
                    >
                        View
                    </Button>

                    {/* ✅ Always show Edit + Delete buttons now */}
                    <Button
                        size="sm"
                        onClick={() =>
                        {
                            setSelectedAdmin(row.original)
                            setOpenDialog("edit")
                        }}
                    >
                        Edit Role
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                        {
                            setSelectedAdmin(row.original)
                            setOpenDialog("delete")
                        }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ]

    const table = useReactTable({
        data: admins,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const handleRoleUpdate = async (uid: string, newRole: "admin" | "superadmin") =>
    {
        try
        {
            await updateSubAdminRole(uid, newRole)
            setAdmins((prev) =>
                prev.map((a) => (a.uid === uid ? { ...a, role: newRole } : a))
            )
            toast.success("Role updated successfully")
            setOpenDialog(null)
        } catch (err: any)
        {
            toast.error(err.message)
        }
    }

    const handleDelete = async (uid: string) =>
    {
        try
        {
            await deleteAdmin(uid)
            setAdmins((prev) => prev.filter((a) => a.uid !== uid))
            toast.success("Admin deleted")
            setOpenDialog(null)
        } catch (err: any)
        {
            toast.error(err.message)
        }
    }

    const handleCreate = async (e: React.FormEvent) =>
    {
        e.preventDefault()
        try
        {
            const newAdmin = await createSubAdmin({
                email,
                password,
                firstName,
                lastName,
                username,
                role,
            })
            setAdmins((prev) => [...prev, newAdmin as unknown as Admin])
            toast.success("Admin created successfully")
            // reset form
            setFirstName("")
            setLastName("")
            setUsername("")
            setEmail("")
            setPassword("")
            setRole("admin")
            setOpenDialog(null)
        } catch (err: any)
        {
            toast.error(err.message)
        }
    }

    return (
        <SidebarLayout
            pageTitle="Admin Management"
            pageDescription="Manage your Admin and Role preference"
        >
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold"></h1>

                    {/* ✅ Always show Create Admin button */}
                    <Button onClick={() => setOpenDialog("create")}>Create Admin</Button>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="w-full border rounded-lg">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="p-2 text-left">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="border-b">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* ========== VIEW ADMIN DIALOG ========== */}
                <Dialog open={openDialog === "view"} onOpenChange={() => setOpenDialog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Admin Details</DialogTitle>
                        </DialogHeader>
                        {selectedAdmin && (
                            <div className="space-y-2">
                                <p><b>Name:</b> {selectedAdmin.firstName} {selectedAdmin.lastName}</p>
                                <p><b>Email:</b> {selectedAdmin.email}</p>
                                <p><b>Username:</b> {selectedAdmin.username}</p>
                                <p><b>Role:</b> {selectedAdmin.role}</p>
                                <p>
                                    <b>Created At:</b>{" "}
                                    {(() =>
                                    {
                                        const value: any = selectedAdmin.createdAt
                                        if (!value) return ""
                                        if (value.seconds)
                                        {
                                            return new Date(value.seconds * 1000).toLocaleString()
                                        }
                                        if (typeof value === "string")
                                        {
                                            return new Date(value).toLocaleString()
                                        }
                                        return String(value)
                                    })()}
                                </p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>


                {/* ========== EDIT ROLE DIALOG ========== */}
                <Dialog open={openDialog === "edit"} onOpenChange={() => setOpenDialog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Role</DialogTitle>
                        </DialogHeader>
                        {selectedAdmin && (
                            <div className="space-y-4">
                                <p>Change role for <b>{selectedAdmin.firstName}</b></p>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleRoleUpdate(selectedAdmin.uid, "admin")}>Set Admin</Button>
                                    <Button onClick={() => handleRoleUpdate(selectedAdmin.uid, "superadmin")}>Set Super Admin</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ========== DELETE DIALOG ========== */}
                <Dialog open={openDialog === "delete"} onOpenChange={() => setOpenDialog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Delete</DialogTitle>
                        </DialogHeader>
                        {selectedAdmin && (
                            <div>
                                <p>Are you sure you want to delete <b>{selectedAdmin.email}</b>?</p>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="destructive" onClick={() => handleDelete(selectedAdmin.uid)}>Delete</Button>
                                    <Button variant="secondary" onClick={() => setOpenDialog(null)}>Cancel</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ========== CREATE ADMIN DIALOG ========== */}
                <Dialog open={openDialog === "create"} onOpenChange={() => setOpenDialog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Admin</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleCreate}>
                            <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <select
                                className="w-full border rounded-md p-2"
                                value={role}
                                onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
                            >
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                            <Button type="submit">Create</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </SidebarLayout>
    )
}

"use client"

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Phone, MapPin, Store, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  addSubTailor,
  getTailorsUnderTailorId,
  updateTailorRole,
} from "@/vendor-services/userAuth"
import { Navbar } from "@/components/navbar"
import { ModernNavbar } from "@/components/vendor/modern-navbar"

interface TailorUser {
  uid: string
  tailorId?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  shop_name?: string
  role?: string
  is_tailor?: boolean
  is_sub_tailor?: boolean
  status?: "active" | "inactive"
  createdAt?: string
}

export default function TailorsPage() {
  const [tailors, setTailors] = useState<TailorUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTailor, setSelectedTailor] = useState<TailorUser | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    shop_name: "",
    role: "initiator",
  })

  const tailorUID =
    typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null

  const fetchTailors = async () => {
    if (!tailorUID) return
    const result = await getTailorsUnderTailorId(tailorUID)
    if (result.success) {
      const data = (result.data as any[]).map((doc) => ({
        uid: doc.uid || doc.id || doc.tailorId,
        ...doc,
      }))
      setTailors(data)
    } else {
      toast.error(result.message)
    }
  }

  useEffect(() => {
    fetchTailors()
  }, [tailorUID])

  const handleAddSubTailor = async () => {
    if (!tailorUID) return toast.error("Missing tailor UID.")

    const { first_name, last_name, email, password, role, phone, address, shop_name } = formData
    if (!first_name || !last_name || !email || !password) {
      return toast.error("Please fill in all required fields.")
    }

    const res = await addSubTailor(
      tailorUID,
      first_name,
      last_name,
      email,
      password,
      role
    )

    if (res.success) {
      toast.success("Sub-Tailor added!")
      setModalOpen(false)
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        shop_name: "",
        role: "initiator",
      })
      fetchTailors()

      await fetch("/api/send-subtailor-mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("tailorToken") || "",
        },
        body: JSON.stringify({
          to: email,
          subFirstName: first_name,
          subLastName: last_name,
          subEmail: email,
          role,
          logoUrl: "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
        }),
      })
    } else {
      toast.error(res.message)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedTailor) return toast.error("No tailor selected.")

    const targetId = selectedTailor.uid
    if (!targetId) return toast.error("Selected user has no valid ID.")

    const newRole = selectedTailor.role || "initiator"
    const res = await updateTailorRole(targetId, newRole)

    if (res.success) {
      toast.success(res.message)
      fetchTailors()
      setInfoModalOpen(false)
      setSelectedTailor(null)
    } else {
      toast.error(res.message)
    }
  }

  const filteredTailors = tailors.filter(
    (t) =>
      (t.first_name + " " + t.last_name)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (!roleFilter || t.role?.toLowerCase() === roleFilter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <ModernNavbar />
      <div className="px-6 py-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tailor Management</h1>
            <p className="text-gray-600">Manage your tailoring team, roles, and access levels.</p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white flex items-center gap-2 mt-4 sm:mt-0">
                <Plus className="h-4 w-4" /> Add New Tailor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add a Sub-Tailor</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {[
                  { id: "first_name", label: "First Name" },
                  { id: "last_name", label: "Last Name" },
                  { id: "email", label: "Email" },
                  { id: "password", label: "Password", type: "password" },
                  { id: "phone", label: "Phone Number" },
                  { id: "shop_name", label: "Shop Name" },
                  { id: "address", label: "Address" },
                ].map(({ id, label, type }) => (
                  <div key={id}>
                    <Label htmlFor={id}>{label}</Label>
                    <Input
                      id={id}
                      type={type || "text"}
                      value={(formData as any)[id]}
                      onChange={(e) =>
                        setFormData({ ...formData, [id]: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                ))}

                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full border rounded-md mt-1 px-3 py-2"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="initiator">Initiator</option>
                    <option value="verifier">Verifier</option>
                  </select>
                </div>

                <Button onClick={handleAddSubTailor} className="bg-black text-white mt-4">
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search tailor by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            placeholder="Filter by role..."
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-52"
          />
        </div>

        {/* Tailor Grid */}
        {filteredTailors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTailors.map((user) => (
              <Card
                key={user.uid}
                className="hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  setSelectedTailor(user)
                  setInfoModalOpen(true)
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  {user.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" /> {user.phone}
                    </p>
                  )}
                  {user.shop_name && (
                    <p className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-400" /> {user.shop_name}
                    </p>
                  )}
                  {user.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" /> {user.address}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <Badge>{user.role || "Tailor"}</Badge>
                    <Badge
                      variant={user.status === "active" ? "default" : "secondary"}
                    >
                      {user.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800">No Tailors Found</h3>
            <p className="text-gray-500">Try adjusting your filters or add a new tailor.</p>
          </div>
        )}
      </div>

      {/* Info Modal */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Tailor Info</DialogTitle>
          </DialogHeader>
          {selectedTailor && (
            <div className="space-y-4">
              <p><strong>Email:</strong> {selectedTailor.email}</p>
              <p><strong>Current Role:</strong> {selectedTailor.role}</p>

              <select
                className="border border-input rounded-md px-3 py-2 text-sm w-full"
                value={selectedTailor.role || ""}
                onChange={(e) =>
                  setSelectedTailor({ ...selectedTailor, role: e.target.value })
                }
              >
                <option value="initiator">Initiator</option>
                <option value="verifier">Verifier</option>
                <option value="verified">Verified</option>
              </select>

              <Button
                onClick={handleUpdateRole}
                className="bg-black text-white w-full"
              >
                Update Role
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

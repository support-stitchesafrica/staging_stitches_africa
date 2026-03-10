"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation"
import { newsletterUserOperations, type NewsletterUser } from "@/lib/firebase/collections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth/auth-context"

export default function NewsletterUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { newsletterUser: currentUser } = useAuth()
  const [user, setUser] = useState<NewsletterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    role: "viewer" as "admin" | "editor" | "viewer",
    isNewsuser: true,
  })

  useEffect(() => {
    loadUser()
  }, [params.id])

  const loadUser = async () => {
    setLoading(true)
    const data = await newsletterUserOperations.getById(params.id as string)
    if (data) {
      setUser(data)
      setFormData({
        displayName: data.displayName || "",
        email: data.email,
        role: data.role || "viewer",
        isNewsuser: data.isNewsuser,
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!user?.id) return

    setSaving(true)
    try {
      await newsletterUserOperations.update(user.id, {
        displayName: formData.displayName,
        role: formData.role,
        isNewsuser: formData.isNewsuser,
      })
      alert("User updated successfully!")
      router.push("/dashboard/newsletter-users")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = currentUser?.role === "admin"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-medium text-foreground">Edit User</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update user details and permissions</p>
        </div>
        {isAdmin && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Basic details about this user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "editor" | "viewer") => setFormData({ ...formData, role: value })}
                disabled={!isAdmin}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Editor - Can create and edit
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Viewer - Read only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isNewsuser">Active Status</Label>
                <p className="text-sm text-muted-foreground">Allow this user to access the dashboard</p>
              </div>
              <Switch
                id="isNewsuser"
                checked={formData.isNewsuser}
                onCheckedChange={(checked) => setFormData({ ...formData, isNewsuser: checked })}
                disabled={!isAdmin}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={user.isNewsuser ? "default" : "destructive"} className="mt-1">
                {user.isNewsuser ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant="secondary" className="mt-1">
                {user.role || "viewer"}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <p className="mt-1 text-sm">{user.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="mt-1 text-sm">{user.updatedAt?.toDate?.()?.toLocaleDateString() || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import
{
  getTailorProfile,
  updateTailorProfile,
  TailorProfile,
} from "@/vendor-services/tailorProfile"
import { uploadImages } from "@/vendor-services/uploadImages"
import { Navbar } from "@/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import ChangePasswordDialog from "@/components/change=password"
import { ModernNavbar } from "@/components/vendor/modern-navbar"

export default function SettingsPage()
{
  const [profile, setProfile] = useState<Partial<TailorProfile>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const tailorUID =
    typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null

  useEffect(() =>
  {
    const fetchProfile = async () =>
    {
      setLoading(true)
      const res = await getTailorProfile(tailorUID as string)
      if (res.success)
      {
        setProfile(res.data as any)
      }
      setLoading(false)
    }

    if (tailorUID) fetchProfile()
  }, [tailorUID])

  const handleChange = (field: keyof TailorProfile, value: any) =>
  {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () =>
  {
    setSaving(true)
    const res = await updateTailorProfile(tailorUID as string, profile)
    setSaving(false)
    if (res.success)
    {
      toast.success("Profile updated successfully")
    } else
    {
      toast.error(res.message)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    const files = e.target.files
    if (!files || files.length === 0 || !tailorUID) return
    try
    {
      setUploading(true)
      const urls = await uploadImages([files[0]], tailorUID)
      setProfile((prev) => ({ ...prev, imageUrl: urls[0] }))
    } catch (err: any)
    {
      toast.error("Image upload failed", err)
    } finally
    {
      setUploading(false)
    }
  }

  return (
    <div>
      <ModernNavbar />

      <Card className="p-4 md:p-8 max-w-4xl mt-5 mx-auto">
        <CardHeader>
          <CardTitle>Tailor Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">

          {/* Image Upload */}
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={profile.imageUrl || "/placeholder.svg?height=96&width=96"}
              />
              <AvatarFallback className="text-lg">JD</AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Change Photo"}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>First Name</Label>
              <Input value={profile.first_name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Last Name</Label>
              <Input value={profile.last_name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={profile.email || ""} disabled />
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <Input
                value={profile.role || ""}
                onChange={(e) => handleChange("role", e.target.value)}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input
                value={profile.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={profile.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={profile.dateOfBirth || ""}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>State of Origin</Label>
              <Input
                value={profile.stateOfOrigin || ""}
                onChange={(e) => handleChange("stateOfOrigin", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Gender</Label>
              <Input
                value={profile.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Nationality</Label>
              <Input
                value={profile.nationality || ""}
                onChange={(e) => handleChange("nationality", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>LGA</Label>
              <Input
                value={profile.localGovernmentArea || ""}
                onChange={(e) => handleChange("localGovernmentArea", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Languages Spoken (comma separated)</Label>
              <Input
                value={profile.languagesSpoken?.join(", ") || ""}
                onChange={(e) =>
                  handleChange(
                    "languagesSpoken",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Years of Experience</Label>
              <Input
                type="number"
                value={profile.yearsOfExperience || 0}
                onChange={(e) =>
                  handleChange("yearsOfExperience", Number(e.target.value))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Skill Specialties (comma separated)</Label>
              <Input
                value={profile.skillSpecialties?.join(", ") || ""}
                onChange={(e) =>
                  handleChange(
                    "skillSpecialties",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
              />
            </div>

            <div className="md:col-span-2 grid gap-2">
              <Label>Bio</Label>
              <Input
                value={profile.bio || ""}
                onChange={(e) => handleChange("bio", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button onClick={handleSubmit} disabled={saving} className="w-full md:w-auto">
              {saving ? "Saving..." : "Update Profile"}
            </Button>
            <div className="mt-6">
              <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                Change Password
              </Button>
            </div>
          </div>
          <ChangePasswordDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

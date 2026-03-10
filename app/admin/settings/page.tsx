'use client';

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { toast } from "sonner";
import { getCurrentAdminProfile, updateAdminProfile } from "@/admin-services/adminAuth";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "admin",
  });

  // Load current admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getCurrentAdminProfile();
        setAdminProfile(profile);
        setFormData({
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          email: profile?.email || "",
          role: profile?.role || "admin",
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  // Handle form change
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save profile
  const handleSave = async () => {
    setLoading(true);
    try {
      await updateAdminProfile(formData);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout
      pageTitle="Settings"
      pageDescription="Manage your account settings and preferences"
    >
      <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6">
        <Tabs defaultValue="admin" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="admin">Admin Profile</TabsTrigger>
            {/* <TabsTrigger value="profile">Profile Setup</TabsTrigger>
            <TabsTrigger value="documentation">Documentation / KYC</TabsTrigger> */}
            <TabsTrigger value="permissions">User Permissions</TabsTrigger>
          </TabsList>

          {/* ========== Admin Profile Tab ========== */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Profile</CardTitle>
                <CardDescription>Manage admin user settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!adminProfile ? (
                  <p>Loading profile...</p>
                ) : (
                  <div className="space-y-4">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        className="bg-white text-black"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        className="bg-white text-black"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        readOnly
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* Role (dropdown only if superadmin) */}
                    {adminProfile?.role === "superadmin" && (
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => handleChange("role", value)}
                        >
                          <SelectTrigger className="bg-white text-black">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default Settings;

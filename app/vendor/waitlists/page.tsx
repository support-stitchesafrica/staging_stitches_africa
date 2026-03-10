"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CollectionManagementDashboard } from "@/components/vendor/waitlist/CollectionManagementDashboard";
import { Loader2 } from "lucide-react";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

export default function VendorWaitlistsPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tailorToken");
    const id = localStorage.getItem("tailorUID");

    if (!token) {
      router.push("/vendor");
      return;
    }

    if (id) {
      setVendorId(id);
    }
    setLoading(false);
  }, [router]);

  if (loading || !vendorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (

		<div className="min-h-screen bg-gray-50">
				<ModernNavbar />
    <div className="container mx-auto px-4 py-8">
      <CollectionManagementDashboard vendorId={vendorId} />
    </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WaitlistAnalyticsDashboard } from "@/components/vendor/waitlist/WaitlistAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VendorWaitlistAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/vendor/login');
        return;
      }
      setVendorId(user.uid);
    }
  }, [user, authLoading, router]);

  if (authLoading || !vendorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/vendor/waitlists')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Waitlists
        </Button>
      </div>

      <WaitlistAnalyticsDashboard vendorId={vendorId} />
    </div>
  );
}

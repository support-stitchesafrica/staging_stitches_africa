"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WaitlistAnalyticsDashboard } from "@/components/vendor/waitlist/WaitlistAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

interface CollectionAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionAnalyticsPage({ params }: CollectionAnalyticsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tailorToken");
    const uid = localStorage.getItem("tailorUID");

    if (!token || !uid) {
      router.push("/vendor");
      return;
    }

    setUser({ uid });
    setAuthLoading(false);
  }, [router]);

  if (authLoading || !user) {
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
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/vendor/waitlists/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
        </div>

        <WaitlistAnalyticsDashboard vendorId={user.uid} collectionId={id} />
      </div>
    </div>
  );
}

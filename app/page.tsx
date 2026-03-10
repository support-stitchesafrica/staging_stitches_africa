"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/optimized-loader";
import { analytics } from "@/lib/analytics";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Track page view
    analytics.trackPageView('/', 'Home - Redirect');
    
    // Preload the shops page
    router.prefetch("/shops");
    
    // Redirect to /shops on page load with a small delay for better UX
    const timer = setTimeout(() => {
      router.replace("/shops");
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Stitches Africa
          </h1>
          <p className="text-gray-600">Loading your fashion destination...</p>
        </div>
      </div>
    </div>
  );
}

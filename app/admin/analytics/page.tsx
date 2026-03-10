"use client";


import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { AnalyticsMetrics } from "@/components/analytics/AnalyticsMetrics";
import { AnalyticsInsights } from "@/components/analytics/AnalyticsInsights";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Analytics = () =>
{

  const router = useRouter();
    
      useEffect(() => {
        const role = localStorage.getItem("adminRole");
    
        // 🚨 Redirect if not superadmin or admin
        if (role !== "superadmin" && role !== "admin") {
          router.replace("/"); // redirect to home
        }
      }, [router]);

  return (
    <SidebarLayout
      pageTitle="Analytics"
      pageDescription="View detailed analytics and insights about your business"
    >

      <div className="space-y-6">
        <AnalyticsMetrics />
        <AnalyticsCharts />
        <AnalyticsInsights />
      </div>

    </SidebarLayout>
  );
};

export default Analytics;

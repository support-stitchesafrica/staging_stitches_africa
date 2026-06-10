"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { TailorWorksInventoryView } from "@/components/inventory/TailorWorksInventoryView";

const Inventory = () => {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("adminRole");

    if (role !== "superadmin" && role !== "admin") {
      router.replace("/");
    }
  }, [router]);

  return (
    <SidebarLayout
      pageTitle="Inventory"
      pageDescription="Manage your product inventory, stock levels, and alerts"
    >
      <TailorWorksInventoryView
        getAuthToken={async () => localStorage.getItem("adminToken")}
      />
    </SidebarLayout>
  );
};

export default Inventory;

"use client";

import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { OrderVolumeChart } from "@/components/dashboard/OrderVolumeChart";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { VendorDashboardStats } from "./dashboard/VendorDashboardStats";
import { RecentTailorActivity } from "./dashboard/RecentTailorActivity";

const Vendorlanding = () =>
{
const handleLogout = () => {
    signOut(auth);
  };

  return (

      <div className="space-y-6">
        <VendorDashboardStats />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OrderVolumeChart />
          </div>
          <div>
            <RecentTailorActivity />
          </div>
        </div>
      </div>

  );
};

export default Vendorlanding;

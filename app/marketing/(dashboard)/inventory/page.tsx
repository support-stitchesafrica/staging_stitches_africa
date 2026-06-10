"use client";

import { useMarketingAuth, withMarketingAuth } from "@/contexts/MarketingAuthContext";
import { TailorWorksInventoryView } from "@/components/inventory/TailorWorksInventoryView";

function MarketingInventoryPage() {
  const { firebaseUser } = useMarketingAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product inventory</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse marketplace products and update categories and wear sub-categories (same tooling as admin
          inventory).
        </p>
      </div>
      <TailorWorksInventoryView
        getAuthToken={async () => {
          if (!firebaseUser) return null;
          return firebaseUser.getIdToken();
        }}
      />
    </div>
  );
}

export default withMarketingAuth(MarketingInventoryPage, {
  requiredRole: ["super_admin", "team_lead", "bdm", "team_member"],
});

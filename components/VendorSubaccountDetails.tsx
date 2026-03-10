"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Building2, User, Banknote, Hash, Percent, CalendarDays, Copy } from "lucide-react";
import { TailorKyc } from "@/vendor-services/tailorService";
import { memo } from "react";

interface VendorSubaccountDetailsProps {
  subaccount: TailorKyc["flutterwaveSubaccount"];
  profile: TailorKyc | null;
}

function VendorSubaccountDetails({
  subaccount,
  profile,
}: VendorSubaccountDetailsProps) {
  if (!subaccount) return null;

  return (
    <Card className="border border-gray-200 shadow-md overflow-hidden rounded-2xl">
      {/* --- Header Section --- */}
      <CardHeader className="bg-gradient-to-r from-[#1E293B] via-[#334155] to-[#475569] text-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">
              Flutterwave Subaccount
            </CardTitle>
            <p className="text-sm text-gray-800 mt-1">
              Linked to {profile?.brandName || "Vendor Account"}
            </p>
          </div>
          {/* <Button
            variant="secondary"
            size="sm"
            className="mt-4 sm:mt-0 bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Edit Subaccount
          </Button> */}
        </div>
      </CardHeader>

      {/* --- Content Section --- */}
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Business Name */}
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="font-medium text-gray-900">
                {profile?.brandName || subaccount.business_name}
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{subaccount.full_name}</p>
            </div>
          </div>

          {/* Bank Name */}
          <div className="flex items-center gap-3">
            <Banknote className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-medium text-gray-900">{subaccount.bank_name}</p>
            </div>
          </div>

          {/* Account Number */}
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">
                  {subaccount.account_number}
                </p>
                <Copy
                  size={14}
                  className="text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => navigator.clipboard.writeText(subaccount.account_number)}
                />
              </div>
            </div>
          </div>

          {/* Bank Code */}
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Bank Code</p>
              <p className="font-medium text-gray-900">{subaccount.account_bank}</p>
            </div>
          </div>

          {/* Subaccount ID */}
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-pink-500" />
            <div>
              <p className="text-sm text-gray-500">Subaccount ID</p>
              <Badge variant="secondary" className="mt-1">
                {subaccount.subaccount_id}
              </Badge>
            </div>
          </div>

          {/* Split Type */}
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-teal-500" />
            <div>
              <p className="text-sm text-gray-500">Split Type</p>
              <Badge className="capitalize">{subaccount.split_type}</Badge>
            </div>
          </div>

          {/* Split Value */}
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Split Value</p>
              <p className="font-medium text-gray-900">
                {subaccount.split_value * 100}%
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Created At */}
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium text-gray-800">
              {new Date(subaccount.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default memo(VendorSubaccountDetails);
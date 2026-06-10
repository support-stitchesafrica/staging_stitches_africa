"use client";

import React, { useState, memo } from "react";
import { saveIdentityVerification } from "@/vendor-services/firebaseService";

function BvnVerification()
{
  const [bvn, setBvn] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!bvn || bvn.length !== 11)
    {
      setError("BVN must be 11 digits");
      return;
    }

    const userId =
      localStorage.getItem("tailorUID") || localStorage.getItem("userId") || "";
    if (!userId)
    {
      setError("User not found. Please log in again.");
      return;
    }

    try
    {
      setLoading(true);
      await saveIdentityVerification({
        userId,
        idNumber: bvn,
        fullName: "",
        verificationType: "bvn",
        countryCode: "NG",
      });
      setSaved(true);
    } catch (err: any)
    {
      setError(err.message || "Failed to save BVN");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">BVN Verification</h2>

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          value={bvn}
          onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter BVN"
          maxLength={11}
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
      {saved && <p className="text-green-600 mt-3">BVN saved successfully.</p>}
    </div>
  );
}

export default memo(BvnVerification);

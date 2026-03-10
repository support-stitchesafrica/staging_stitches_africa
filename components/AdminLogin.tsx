"use client";

import { useState } from "react";
import { loginAdmin } from "../admin-services/adminAuth";

interface AdminLoginProps {
  onLogin: (admin: any) => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await loginAdmin(email, password);

    if (result.success) {
      const adminData = result.data;
      onLogin(adminData);

      // try {
      //   await fetch("/api/send-admin-login", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       to: email,
      //       adminName: adminData.firstName || "Admin",
      //       newOrders: 27,
      //       pendingApprovals: 3,
      //     }),
      //   });
      // } catch (err) {
      //   console.error("Failed to send login email:", err);
      // }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center space-x-3">
          <img
            src="/Stitches-Africa-Logo-06.png"
            alt="Stiches Africa Logo"
            className="h-24 w-24"
          />
          <h1 className="text-xl font-bold text-purple-700">Stiches Africa</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 text-black px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
          >
            Login
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

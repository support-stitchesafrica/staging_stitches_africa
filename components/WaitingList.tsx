"use client";

import React, {  useState , memo } from "react";

export default function WaitingListForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Loading...");

    try {
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

       // 2️⃣ Send welcome email to the user
            const welcomeResponse = await fetch("/api/waiting-list/welcome", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const welcomeData = await welcomeResponse.json();
            if (!welcomeResponse.ok)
                console.warn("⚠️ Welcome email failed:", welcomeData.error);

      if (res.ok) {
        setStatus("✅ You’ve been added to the waiting list!");
        setEmail("");
      } else {
        setStatus("❌ " + data.error);
      }
    } catch (err) {
      setStatus("❌ Something went wrong");
    }
  };

  return (
    <div className=" flex items-center justify-center bg-gray-900 p-10">
      <div className=" text-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">Join the Waiting List</h1>
        <p className="text-gray-300 mb-6">
          Be the first to know when we launch. Enter your email below.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-600 bg-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full bg-[#E2725B] text-white p-3 rounded-lg font-semibold transition"
          >
            Join Waiting List
          </button>
          {status && <p className="text-sm mt-2">{status}</p>}
        </form>
      </div>
    </div>
  );
}

export default memo(WaitingList);

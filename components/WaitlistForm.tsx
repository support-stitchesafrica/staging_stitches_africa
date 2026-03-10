"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, CheckCircle2 } from "lucide-react";

// ✅ Google Ads conversion tracking
declare global {
  interface Window {
    gtag: any;
  }
}

const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Google Ads conversion function
  const gtag_report_conversion = (url?: string) => {
    const callback = function () {
      if (typeof url !== "undefined") {
        window.location.href = url;
      }
    };
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "conversion", {
        send_to: "AW-17649108372/gmdBCMuZwa0bEJSL4N9B",
        event_callback: callback,
      });
    } else {
      console.warn("⚠️ gtag not found – conversion not tracked.");
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ Save to waiting list (Firestore + admin notification)
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join waitlist");

      // 2️⃣ Send welcome email
      const welcomeResponse = await fetch("/api/waiting-list/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const welcomeData = await welcomeResponse.json();
      if (!welcomeResponse.ok)
        console.warn("⚠️ Welcome email failed:", welcomeData.error);

      // 3️⃣ Fire Google Ads conversion event
      gtag_report_conversion();

      // 4️⃣ Success state
      setIsSubmitted(true);
      toast.success(
        "🎉 You're on the list! Check your email for a welcome message."
      );
      setEmail("");
    } catch (err) {
      console.error("Waitlist submission error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Success View
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in px-4 sm:px-0">
        <div className="bg-[#1a102a] border border-[#D4AF37]/30 rounded-full p-5 sm:p-6 shadow-[0_0_30px_rgba(226,114,91,0.4)] animate-pulse-slow">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#E2725B]" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
            You're in!
          </h3>
          <p className="text-gray-400 text-sm sm:text-base">
            We’ll send updates to{" "}
            <span className="text-[#E2725B] font-semibold break-all">
              {email}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ✅ Waitlist Input Form
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl animate-fade-in px-3 sm:px-0"
    >
      <div
        className="
          flex flex-col sm:flex-row items-stretch sm:items-center
          bg-[#0b0614]/95 border border-[#E2725B]/30 backdrop-blur-xl
          rounded-2xl sm:rounded-full
          shadow-[0_0_40px_rgba(226,114,91,0.15)]
          overflow-hidden p-1 sm:p-0 transition-all duration-300
        "
      >
        {/* Input */}
        <div className="flex items-center flex-1 px-4 py-3 sm:py-0">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2725B] mr-3 hidden sm:block" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              flex-1 bg-transparent text-gray-200 placeholder-gray-500 
              focus:outline-none focus:text-white
              text-sm sm:text-base py-2 sm:py-3
            "
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full sm:w-auto
            px-5 sm:px-8 py-3
            text-sm sm:text-base font-semibold text-white
            bg-gradient-to-r from-[#E2725B] to-[#D4AF37]
            hover:from-[#E2725B]/90 hover:to-[#D4AF37]/90
            shadow-[0_0_25px_rgba(226,114,91,0.5)]
            transition-all duration-300
            hover:scale-105
            rounded-xl sm:rounded-full
            focus:outline-none focus:ring-2 focus:ring-[#E2725B]/40
          "
        >
          {isLoading ? "Joining..." : "Join Waitlist"}
        </button>
      </div>

      {/* Subtext */}
      <p className="text-center text-xs sm:text-sm text-gray-500 mt-3">
        Be among the first to get exclusive access.
      </p>
    </form>
  );
};

export default WaitlistForm;

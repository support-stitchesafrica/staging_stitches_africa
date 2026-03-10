"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import CountdownTimer from "@/components/CountdownTimer";
import WaitlistForm from "@/components/WaitlistForm";
import { trackPageView } from "@/utils/trackPageView";

const Index = () =>
{
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() =>
  {
    if (typeof window === "undefined") return; // ensure browser only

    if (!sessionStorage.getItem("viewed_waitlist"))
    {
      // ✅ dynamically import the tracker so it’s never evaluated on the server
      import("@/utils/trackPageView").then(({ trackPageView }) =>
      {
        trackPageView("waiting-list");
      });

      sessionStorage.setItem("viewed_waitlist", "true");
    }
  }, []);

  const previewImages = [
    "/images/preview11.png",
    "/images/preview3.png",
    "/images/preview7.png",
  ];

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#FFF5ED] via-[#FFF9F5] to-[#FFF2E1] flex flex-col items-center justify-center text-center overflow-hidden">
      {/* ✅ Google Ads Tag */}
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-17649108372"
      />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17649108372');
        `}
      </Script>

      {/* 🟠 Background Glow Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-[#E2725B]/30 rounded-full blur-[180px] animate-pulse" />
        <div
          className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-[#D4AF37]/25 rounded-full blur-[160px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* 🧵 Logo Section */}
      <motion.div
        className="mt-12 sm:mt-16"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Image
          src="/Stitches-Africa-Logo-06.png"
          alt="Stitches Africa Logo"
          width={200}
          height={200}
          className="mx-auto w-32 sm:w-40 md:w-48 h-auto drop-shadow-lg hover:scale-110 transition-transform duration-500"
        />
      </motion.div>

      {/* ✨ Hero Section */}
      <motion.div
        className="mt-8 space-y-6 px-6 max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1.2 }}
      >
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#E2725B]/10 border border-[#E2725B]/20 shadow-[inset_0_0_15px_rgba(226,114,91,0.1)] backdrop-blur-sm">
          <Sparkles className="w-5 h-5 text-[#E2725B] animate-pulse" />
          <span className="text-sm sm:text-base text-[#E2725B] font-medium tracking-wide">
            Something Incredible is Coming
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-[#E2725B] via-[#D4AF37] to-[#E2725B] bg-clip-text text-transparent leading-tight">
          The Future of African Fashion
        </h1>

        <p className="text-[#555] text-base sm:text-lg md:text-xl leading-relaxed">
          Discover fashion that’s{" "}
          <span className="font-semibold text-[#E2725B]">bold</span>,{" "}
          <span className="font-semibold text-[#D4AF37]">beautiful</span>, and{" "}
          <span className="font-semibold text-[#E2725B]">
            unapologetically African.
          </span>{" "}
          Stitches Africa is redefining how the world shops, customizes, and
          celebrates African fashion.
        </p>
      </motion.div>

      {/* 🕒 Countdown */}
      <motion.div
        className="mt-10"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        {/* <CountdownTimer /> */}
      </motion.div>

      {/* 📨 Waitlist CTA */}
      <motion.div
        className="mt-12 bg-white/80 backdrop-blur-md border border-[#f5f5f5] rounded-3xl shadow-[0_10px_40px_rgba(212,175,55,0.15)] p-8 sm:p-10 w-full max-w-lg mx-auto hover:shadow-[0_10px_50px_rgba(226,114,91,0.25)] transition-all duration-500"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-2xl sm:text-3xl font-semibold text-[#E2725B] mb-3">
          Be Part of the Movement
        </h3>
        <p className="text-[#555] mb-6 text-sm sm:text-base">
          Join the waitlist and get early access when we launch.
        </p>
        <WaitlistForm />
      </motion.div>

      {/* 🖼️ App Preview Carousel */}
      <section className="mt-20 w-full px-6">
        <motion.h3
          className="text-3xl sm:text-4xl font-semibold text-[#E2725B] mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Sneak Peek ✨
        </motion.h3>
        <p className="text-[#555] text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-10">
          A glimpse of the stunning Stitches Africa experience — elegant,
          powerful, and crafted for you.
        </p>

        <motion.div
          className="flex justify-center gap-6 overflow-x-auto pb-4 scrollbar-hide"
          whileInView={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {previewImages.map((src, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer flex-shrink-0 rounded-2xl    transition-all duration-300 w-[180px] sm:w-[220px]"
              onClick={() => setSelectedImage(src)}
            >
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                width={220}
                height={400}
                className="rounded-2xl w-full h-auto object-contain"
              />
            </motion.div>
          ))}
        </motion.div>

        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="relative w-full max-w-5xl p-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 text-white bg-white/10 hover:bg-white/30 p-2 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
              <Image
                src={selectedImage}
                alt="Preview Full"
                width={1000}
                height={800}
                className="rounded-3xl max-h-[85vh] w-auto mx-auto object-contain shadow-[0_0_50px_rgba(226,114,91,0.4)]"
              />
            </div>
          </div>
        )}
      </section>

      {/* 🌍 Brand Features */}
      <motion.section
        className="mt-20 px-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[
          {
            title: "Authentic African Designs",
            desc: "Discover bespoke and ready-to-wear pieces crafted by Africa’s top creators.",
          },
          {
            title: "AI Perfect Fit",
            desc: "Our advanced measurement tool ensures your outfit fits flawlessly.",
          },
          {
            title: "Global Payments",
            desc: "Shop securely and easily — pay in your currency, wherever you are.",
          },
          {
            title: "Worldwide Shipping",
            desc: "From Africa to your wardrobe — we deliver worldwide.",
          },
          {
            title: "Empower Local Creators",
            desc: "Every purchase supports African designers and artisans.",
          },
          {
            title: "Personalized Experience",
            desc: "Chat directly with creators to bring your dream looks to life.",
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.03 }}
            className="bg-white/70 rounded-3xl border border-[#f2f2f2] p-8 shadow-[0_8px_25px_rgba(212,175,55,0.1)] backdrop-blur-md hover:shadow-[0_8px_35px_rgba(226,114,91,0.15)] transition-all"
          >
            <h4 className="text-xl font-semibold text-[#E2725B] mb-3">
              {feature.title}
            </h4>
            <p className="text-[#555] text-base leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </motion.section>

      {/* ⚡ Floating Button */}
      <button
        onClick={() => setShowWaitlist(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#E2725B] to-[#D4AF37] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-all duration-300"
      >
        Join Waitlist
      </button>

      {/* 💌 Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md">
          <motion.div
            className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md relative shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <button
              onClick={() => setShowWaitlist(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-semibold text-[#E2725B] mb-3">
              Join the Waitlist
            </h3>
            <p className="text-[#666] text-sm sm:text-base mb-6">
              Get notified when we launch and enjoy exclusive early-access perks.
            </p>
            <WaitlistForm />
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 pb-10 text-sm text-[#777]">
        © {new Date().getFullYear()} Stitches Africa • Launching November 2025
      </footer>
    </div>
  );
};

export default Index;

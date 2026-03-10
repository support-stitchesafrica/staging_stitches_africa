"use client";

import { memo } from "react";
// components/HowItWorks.tsx

import Image from "next/image";
import { Download, UserPlus, Ruler, ShoppingBag } from "lucide-react";

function HowItWorks() {
  return (
    <div className="w-full">
      {/* Top Section */}
      <section className="bg-gradient-to-r from-gray-900 to-black text-white py-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 px-6 lg:px-12">
          {/* Phone Image */}
          <div className="flex justify-center md:w-1/2">
            <img
              src="/images/PHONE-1-992x2048.png"
              alt="Phone mockup"
              width={320}
              height={640}
              className="object-contain drop-shadow-2xl"
            />
          </div>

          {/* Text Content */}
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              How It Works
            </h2>
            <p className="text-gray-400 text-base mb-10 max-w-md">
              Getting your bespoke outfit has never been easier. Follow these
              simple steps to experience the perfect fit and style tailored just
              for you.
            </p>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: <Download className="w-5 h-5" />,
                  title: "Download The App",
                },
                {
                  icon: <UserPlus className="w-5 h-5" />,
                  title: "Create a Free Account",
                },
                {
                  icon: <Ruler className="w-5 h-5" />,
                  title: "Get Your Measurement",
                },
                {
                  icon: <ShoppingBag className="w-5 h-5" />,
                  title: "Start Shopping",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition rounded-lg p-4"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-400 text-black font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      {step.icon}
                      <span>{step.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="bg-white text-black py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-12 px-6 lg:px-12">
          {/* Left: Text + Input */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              Become part of{" "}
              <span className="text-yellow-500">Stitches Africa</span>
            </h2>
            <p className="text-base text-gray-600 mb-8 max-w-md">
              Subscribe to our bi-weekly newsletter and discover how bespoke
              fashion is changing wardrobes across the globe.
            </p>
            <form className="flex flex-col sm:flex-row items-center gap-3 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Right: Image */}
          <div className="flex justify-center">
            <img
              src="/images/Group-43-1.png"
              alt="Knitting machine"
              width={500}
              height={400}
              className="object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(HowItWorks);

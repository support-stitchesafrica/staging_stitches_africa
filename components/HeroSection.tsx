import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-gray-900 to-black text-white py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:space-x-10">
          {/* Left: Text */}
          <div className="flex-1 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Featured Collections at <span className="text-yellow-400">Stitches Africa</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Discover exclusive African fashion curated just for you — where tradition meets modern style.
            </p>
            <Link
              href="/brand"
              className="px-8 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition"
            >
              Explore Brands
            </Link>
          </div>

        {/* RIGHT IMAGES */}
        <div className="flex-1 flex justify-center md:justify-end gap-6 relative">
          {/* First Phone */}
          <div className="relative w-40 sm:w-52 md:w-64">
            <img
              src="/images/PHONE-992x2048.png" // replace with your actual image path
              alt="Phone with registration screen"
              width={300}
              height={600}
              className="object-contain"
            />
            {/* Logo overlay */}
            
          </div>

          {/* Second Phone */}
          <div className="relative w-40 sm:w-52 md:w-64">
            <img
              src="/images/iphone-4.png" // replace with your actual image path
              alt="Phone with wallet screen"
              width={300}
              height={600}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);

import React, { memo } from "react";
import Image from "next/image";

function HeroSectionBrand() {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col-reverse md:flex-row items-center md:items-center gap-10">
        
        {/* LEFT TEXT */}
        <div className="flex-1 text-center md:text-left md:mt-20 lg:mt-32">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
            Discover Popular <br className="hidden sm:block" /> Brands on Stitches Africa
          </h1>
          <p className="mt-4 text-gray-500 text-sm sm:text-base lg:text-lg max-w-md mx-auto md:mx-0">
            Shop from the most loved African fashion brands, bringing you 
            timeless designs and modern styles all in one place.
          </p>
        </div>

        {/* RIGHT IMAGES */}
        <div className="flex-1 flex justify-center md:justify-end gap-4 sm:gap-6 relative">
          {/* First Brand Image */}
          <div className="relative w-28 sm:w-40 md:w-52 lg:w-64">
            <img
              src="/images/bespoke-portrait.png" // replace with your brand image
              alt="Popular African fashion brand showcase"
              width={300}
              height={600}
              className="object-contain"
            />
          </div>

          {/* Second Brand Image */}
          <div className="relative w-28 sm:w-40 md:w-52 lg:w-64">
            <img
              src="/images/ready-portrait.png" // replace with your brand image
              alt="Another fashion brand showcase"
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

export default memo(HeroSectionBrand);

"use client"

import React, {  useEffect, useState , memo } from "react"
import { getAllTailors, TailorBrand } from "@/vendor-services/getAllTailors"

function BrandSlider() {
  const [brands, setBrands] = useState<TailorBrand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBrands = async () => {
      const res = await getAllTailors()
      if (res.success && res.data) {
        const filtered = res.data.filter((b) => b.brandName && b.brand_logo)
        setBrands(filtered)
      }
      setLoading(false)
    }
    fetchBrands()
  }, [])

  if (loading) {
    return <div className="text-center py-6 text-gray-500">Loading brands...</div>
  }

  if (brands.length === 0) {
    return <div className="text-center py-6 text-gray-500">No brands found</div>
  }

  return (
    <div className="w-full overflow-hidden bg-gray-50 py-10">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
        Trusted by Popular Brands
      </h2>

      <div className="relative flex overflow-x-hidden">
        {/* First Loop */}
        <div className="flex animate-slide gap-8 px-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex flex-col items-center min-w-[120px] sm:min-w-[150px] p-3 bg-white rounded-lg shadow"
            >
              <img
                src={brand.brand_logo}
                alt={brand.brandName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full"
              />
              <p className="mt-2 text-sm sm:text-base text-center font-medium text-gray-700">
                {brand.brandName}
              </p>
            </div>
          ))}
        </div>

        {/* Duplicate Loop for Infinite Scroll */}
        <div className="flex animate-slide gap-8 px-4">
          {brands.map((brand) => (
            <div
              key={`${brand.id}-duplicate`}
              className="flex flex-col items-center min-w-[120px] sm:min-w-[150px] p-3 bg-white rounded-lg shadow"
            >
              <img
                src={brand.brand_logo}
                alt={brand.brandName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full"
              />
              <p className="mt-2 text-sm sm:text-base text-center font-medium text-gray-700">
                {brand.brandName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(BrandSlider);

"use client"

import { useEffect, useState } from "react";
import Link from "next/link"
import
{
  Phone,
  Newspaper,
  Star,
  UserPlus,
  BracketsIcon,
  CompassIcon,
} from "lucide-react"
import Footer from "@/components/footer"
import { getAllTailors, TailorBrand } from "@/vendor-services/getAllTailors"
import HeroSectionBrand from "@/components/HeroSectionBrand"
import Image from "next/image"

export default function BrandsPage()
{
  const [brands, setBrands] = useState<TailorBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"Bespoke" | "Ready to Wear">(
    "Bespoke"
  )
  const [visibleCount, setVisibleCount] = useState(15)

  useEffect(() =>
  {
    const fetchBrands = async () =>
    {
      const res = await getAllTailors()
      if (res.success && res.data)
      {
        // filter out brands missing brandName or brand_logo
        const filtered = res.data.filter((b) => b.brandName && b.brand_logo)
        setBrands(filtered)
      }
      setLoading(false)
    }
    fetchBrands()
  }, [])

  // ✅ FIX: since type is now an array, check with includes()
  const filteredBrands = brands.filter((b) =>
    Array.isArray(b.type) ? b.type.includes(activeTab) : b.type === activeTab
  )
  const visibleBrands = filteredBrands.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="hidden md:flex items-center justify-between px-8 border-b border-gray-200">
        {/* Logo */}
        <Link href="/shops" className="flex items-center space-x-2 flex-shrink-0">
          <Image
            src="/Stitches-Africa-Logo-06.png"
            alt="Stitches Africa"
            width={120}
            height={50}
            className=""
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-gray-700 hover:text-black transition-colors"
          >
            About
          </Link>
          <Link
            href="/featured"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Featured
          </Link>
          <Link
            href="/brand"
            className="text-gray-700 hover:text-black transition-colors font-semibold"
          >
            Brands
          </Link>
          <Link
            href="/contact"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Contact Us
          </Link>
          <Link
            href="/news"
            className="text-gray-700 hover:text-black transition-colors"
          >
            News
          </Link>
          <Link
            href="/vendor"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md md:hidden">
        <div className="flex justify-around items-center py-2">
          <Link
            href="/"
            className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
          >
            <img
              src="/Stitches-Africa-Logo-06.png"
              alt="logo"
              className="w-10 h-10"
            />
          </Link>
          <Link
            href="/about"
            className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
          >
            <CompassIcon className="h-5 w-5" />
            <span className="text-xs mt-1">About</span>
          </Link>
          <Link
            href="/featured"
            className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
          >
            <Star className="h-5 w-5" />
            <span className="text-xs mt-1">Featured</span>
          </Link>
          <Link
            href="/brand"
            className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
          >
            <BracketsIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Brands</span>
          </Link>

          <Link
            href="/news"
            className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
          >
            <Newspaper className="h-5 w-5" />
            <span className="text-xs mt-1">News</span>
          </Link>
          <Link
            href="/vendor"
            className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-xs mt-1">Sign Up</span>
          </Link>
        </div>
      </nav>

      <HeroSectionBrand />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-12 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          Popular Brands
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-8 space-x-3 sm:space-x-6">
          {["Bespoke", "Ready to Wear"].map((tab) => (
            <button
              key={tab}
              onClick={() =>
              {
                setActiveTab(tab as "Bespoke" | "Ready to Wear")
                setVisibleCount(15) // reset pagination when tab changes
              }}
              className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium transition ${activeTab === tab
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">
            Loading brands...
          </div>
        ) : visibleBrands.length === 0 ? (
          <div className="flex justify-center py-20 text-gray-500">
            No brands found for this category
          </div>
        ) : (
          <>
            {/* Brand Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
              {visibleBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex flex-col items-center p-4 border rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <img
                    src={brand.brand_logo}
                    alt={brand.brandName}
                    className="w-16 sm:w-20 h-16 sm:h-20 object-contain rounded-full"
                  />
                  <p className="mt-3 text-sm sm:text-base font-medium text-center">
                    {brand.brandName}
                  </p>
                </div>
              ))}
            </div>

            {/* Load More */}
            {filteredBrands.length > visibleCount && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 15)}
                  className="px-5 sm:px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

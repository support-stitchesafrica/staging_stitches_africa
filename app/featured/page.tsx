import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/footer";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import { BracketsIcon, CompassIcon, Menu, Newspaper, Phone, Star, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Featured()
{
  return (
    <div className="min-h-screen bg-white">
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
          <Link href="/" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <img src="/Stitches-Africa-Logo-06.png" alt="logo" className="w-10 h-10" />
          </Link>
          <Link href="/about" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <CompassIcon className="h-5 w-5" />
            <span className="text-xs mt-1">About</span>
          </Link>
          <Link href="/featured" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <Star className="h-5 w-5" />
            <span className="text-xs mt-1">Featured</span>
          </Link>
          <Link href="/brand" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <BracketsIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Brands</span>
          </Link>

          <Link href="/news" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <Newspaper className="h-5 w-5" />
            <span className="text-xs mt-1">News</span>
          </Link>
          <Link href="/vendor" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <UserPlus className="h-5 w-5" />
            <span className="text-xs mt-1">Sign Up</span>
          </Link>
        </div>
      </nav>

      <main >
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <Footer />
      </main>
    </div>
  )
}



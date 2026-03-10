"use client";

import React from "react";
import
{
  Globe,
  ShoppingBag,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  Target,
  BracketsIcon,
  Newspaper,
  Star,
  UserPlus,
  CompassIcon,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/footer";
import Image from "next/image";

export default function StitchesAfricaBrochure()
{
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 font-sans">
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
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center text-center bg-black">
        <img
          src="/images/brand.jpg"
          alt="African Fashion"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 max-w-3xl px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg">
            Seamless Fashion • African Pride • Global Reach
          </h1>
          <p className="mt-4 text-lg text-gray-200">
            Connecting African Creativity with the World
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            Revolutionizing African Fashion in the Diaspora
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* About Section */}
        <section className="grid md:grid-cols-2 mx-auto gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">About Stitches Africa</h2>
            <p className="text-gray-700 mb-4">
              Stitches Africa is an e-commerce platform for bespoke and
              ready-to-wear African fashion items, targeting Africans in the
              diaspora and the Local Market.
            </p>
            <p className="text-gray-700 mb-4">
              We showcase African designers, featuring clothing, accessories,
              and bespoke items made in Africa.
            </p>
            <p className="text-gray-700">
              With AI body measurement tech, customers get precise tailoring for
              a perfect fit.
            </p>
          </div>
          <div>
            <img
              src="/images/bespoke-left.png"
              alt="About Stitches Africa"
              className="w-[200px] h-auto  mx-auto"
            />
          </div>
        </section>

        {/* Highlights */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">Highlights</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: <CheckCircle />, text: "Bespoke craftsmanship" },
              { icon: <Users />, text: "Bridging diaspora access" },
              { icon: <Globe />, text: "Market access for tailors" },
              { icon: <DollarSign />, text: "Earn in foreign currency" },
              { icon: <TrendingUp />, text: "Accurate AI measurements" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white p-4 rounded-xl shadow"
              >
                <div className="text-indigo-600">{item.icon}</div>
                <p className="text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Problem Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <img
            src="/images/PHONE-992x2048.png"
            alt="The Problem"
            className="w-[200px] h-auto "
          />
          <div>
            <h2 className="text-3xl font-bold mb-4">The Problem</h2>
            <p className="text-gray-700">
              African designers struggle to access global markets despite high
              demand. Platforms often prioritize Western brands, limiting
              visibility, growth, and impact of African fashion worldwide.
            </p>
          </div>
        </section>

        {/* Solution Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Our Solution</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "AI-driven body measurements for precision",
              "Showcasing African talent globally",
              "Boost visibility in international markets",
              "Enable artisans to earn foreign income",
              "Access funding via partnerships",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl"
              >
                <Target className="text-indigo-600" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>



      </div>
      <Footer />
    </div>
  );
}

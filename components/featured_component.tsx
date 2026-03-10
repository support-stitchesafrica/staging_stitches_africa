"use client"

import Link from "next/link"
import { BracketsIcon, Newspaper, Phone, Star, UserPlus, CheckCircle2, Sparkles, Rocket } from "lucide-react"
import Footer from "@/components/footer"
import Image from "next/image"

export default function FeaturedComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-black text-white py-24 px-6 text-center">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:space-x-10">
          {/* Left: Text */}
          <div className="flex-1">
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

          {/* Right: Image */}
          <div className="flex-1 mt-10 md:mt-0">
            <img
              src="/images/brand.jpg"
              alt="Featured fashion"
              width={600}
              height={500}
              className="rounded-xl shadow-lg object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* Featured Grid Section */}
      <section className="py-20 px-6 lg:px-16 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
              title: "Unique African Designs",
              desc: "Authentic styles made by top African designers, blending culture and innovation.",
              img: "/images/african-fashion-2.png",
            },
            {
              icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
              title: "Perfect Fit Guarantee",
              desc: "AI-powered measurements ensure tailored precision and comfort every time.",
              img: "/images/african-fashion-5.png",
            },
            {
              icon: <Rocket className="w-8 h-8 text-indigo-500" />,
              title: "Global Reach",
              desc: "Fast worldwide shipping brings African fashion closer to you, wherever you are.",
              img: "/images/african-fashion-7.png",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={item.img}
                alt={item.title}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works as Timeline with Images */}
      <section className="py-20 px-6 lg:px-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-5xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          {[
            { step: "1", title: "Sign Up", desc: "Create your account and set up your profile.", img: "/images/signup.png" },
            { step: "2", title: "Browse & Order", desc: "Explore featured collections and order with ease.", img: "/images/browse.png" },
            { step: "3", title: "AI Measurements", desc: "Enjoy custom-fit outfits powered by AI precision.", img: "/images/measurement.png" },
            { step: "4", title: "Delivery", desc: "Your order arrives at your doorstep, anywhere worldwide.", img: "/images/delivery.png" },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-start gap-6">
              <img
                src={item.img}
                alt={item.title}
                width={200}
                height={150}
                className="rounded-lg shadow-md object-cover"
              />
              <div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Upgrade Your Wardrobe?</h2>
        <p className="text-lg mb-6">
          Join thousands of customers experiencing the best of African fashion.
        </p>
        <Link
          href="/vendor"
          className="px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition"
        >
          Become a Vendor
        </Link>
      </section>

      <Footer />
    </div>
  )
}

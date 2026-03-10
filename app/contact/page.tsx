"use client";

import Footer from "@/components/footer";
import HowItWorks from "@/components/HowItWorks";
import { ArrowRight, BracketsIcon, CompassIcon, Menu, Newspaper, Phone, Star, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FiInstagram } from "react-icons/fi";
import { toast } from "sonner";
import Image from "next/image";

export default function Contact()
{
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
  {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try
    {
      const res = await fetch("/api/contact-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phoneNumber: formData.phone,
          token: localStorage.getItem("tailorToken"), // ✅ pass token
        }),
      })

      const data = await res.json();

      if (res.ok)
      {
        setStatus({ type: "success", message: "Your message has been sent successfully!" });
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", country: "", phone: "", subject: "", message: "" });
      } else
      {
        setStatus({ type: "error", message: data.message || "Something went wrong." });
      }
    } catch (error)
    {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally
    {
      setLoading(false);
    }
  };

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

      {/* Contact Form */}
      <section className="w-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl leading-relaxed text-gray-200">
            If you have questions, please visit our FAQs section. If your question
            was not answered, please use one of the following emails or fill out
            the form below.
          </p>
        </div>
      </section>
      <section className="w-full bg-white py-16 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Get In Touch
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold mb-2">Send A Message</h3>
              <p className="text-gray-500 mb-8">
                Simply complete the form and click send to submit an enquiry
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full border-b border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full border-b border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full border-b border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full border-b border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full border-b border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full border-b border-black focus:outline-none resize-none"
                  ></textarea>
                </div>

                {status && (
                  <p
                    className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {status.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-gray-900 transition-all disabled:opacity-50"
                >
                  <ArrowRight /> {loading ? "Sending..." : "Submit"}
                </button>
              </form>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Email</h3>
                <p className="text-gray-500">
                  Feel free to email us at{" "}
                  <span className="font-semibold">
                    Support@stitchesafrica.com
                  </span>
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Socials</h3>
                <p className="text-gray-500 mb-4">
                  Stay connected and get the latest fashion updates.
                </p>
                <FiInstagram size={24} className="cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <HowItWorks /> */}
      <Footer />
    </div>
  );
}

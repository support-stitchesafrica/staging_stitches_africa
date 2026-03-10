"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CTASection2() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({
    brandName: "",
    email: "",
    phone: "",
    fullName: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.brandName || !form.email || !form.phone || !form.fullName || !form.message) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/press-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send inquiry")
      }

      toast.success("Your press inquiry has been sent successfully!")
      setOpen(false)
      setForm({ brandName: "", email: "", phone: "", fullName: "", message: "" })
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 text-balance">
            IS YOUR BRAND READY TO MOVE CULTURE?
          </h2>

          <div className="grid md:grid-cols-2 gap-12 mt-16">
            {/* Press Inquiry */}
            <div className="text-left">
              <h3 className="text-2xl font-semibold mb-4">Press</h3>
              <p className="text-primary-foreground/80 mb-6">
                Get in touch with our press team for media inquiries, interviews, and partnership opportunities.
              </p>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#E2725B]" size="lg">
                    Press Inquiries
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Press Inquiry</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2">Brand Name</Label>
                      <Input name="brandName" value={form.brandName} onChange={handleChange} />
                    </div>
                    <div>
                      <Label  className="mb-2">Full Name</Label>
                      <Input name="fullName" value={form.fullName} onChange={handleChange} />
                    </div>
                    <div>
                      <Label  className="mb-2">Email</Label>
                      <Input type="email" name="email" value={form.email} onChange={handleChange} />
                    </div>
                    <div>
                      <Label  className="mb-2">Phone Number</Label>
                      <Input name="phone" value={form.phone} onChange={handleChange} />
                    </div>
                    <div>
                      <Label  className="mb-2">Message</Label>
                      <Textarea name="message" value={form.message} onChange={handleChange} />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      className="bg-[#E2725B]"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Inquiry"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Partnerships */}
            <div className="text-left">
              <h3 className="text-2xl font-semibold mb-4">Partnerships</h3>
              <p className="text-primary-foreground/80 mb-6">
                Join our network of designers, brands, and cultural ambassadors to shape the future of African fashion.
              </p>
              <Button onClick={() => router.push(`/vendor/signup`)} size="lg" className="bg-[#E2725B]">
                Partner With Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Gift, Zap, Users } from "lucide-react"

export function NewsletterSection() {
  const benefits = [
    {
      icon: Gift,
      title: "Exclusive Offers",
      description: "Get first access to designer collections and special discounts",
    },
    {
      icon: Zap,
      title: "Fashion Trends",
      description: "Stay updated with the latest African fashion trends and styles",
    },
    {
      icon: Users,
      title: "Community Events",
      description: "Be the first to know about fashion shows and community gatherings",
    },
  ]

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Mail className="w-16 h-16 mx-auto mb-6 text-[#D4AF37]" />
          <h2 className="text-4xl font-bold mb-4 text-balance">Stay Connected with African Fashion</h2>
          <p className="text-xl mb-12 text-primary-foreground/80 text-pretty">
            Join our newsletter to receive exclusive updates, designer spotlights, and fashion inspiration directly to
            your inbox
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#D4AF37] rounded-full mb-4">
                  <benefit.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-primary-foreground/70 text-pretty">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="bg-white text-primary border-white"
              />
              <Button className="bg-[#E2725B] hover:bg-secondary/90 text-black px-8">Subscribe</Button>
            </div>
            <p className="text-sm text-primary-foreground/60 mt-4">We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

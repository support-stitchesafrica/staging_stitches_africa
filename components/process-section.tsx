import { Card, CardContent } from "@/components/ui/card"
import { Download, UserPlus, ShoppingBag } from "lucide-react"

export function ProcessSection() {
  const steps = [
    {
      number: "1",
      icon: <Download className="h-8 w-8" />,
      title: "Download The App",
      description: "Get started by downloading our beautifully designed mobile app from the App Store or Google Play.",
    },
    {
      number: "2",
      icon: <UserPlus className="h-8 w-8" />,
      title: "Create a Free Account",
      description: "Set up your profile and tell us about your style preferences to get personalized recommendations.",
    },
    {
      number: "3",
      icon: <ShoppingBag className="h-8 w-8" />,
      title: "Start Shopping",
      description:
        "Browse authentic African designs, connect with designers, and build your unique fashion collection.",
    },
  ]

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
            THE ECHO: OUR PROCESS THAT BEGINS AND ENDS WITH CULTURE
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="bg-primary-foreground text-primary border-0">
              <CardContent className="p-8 text-center">
                <div className="text-6xl font-bold mb-4 opacity-20">{step.number}</div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-pretty">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

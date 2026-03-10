import { TrendingUp, Users, Globe, Award, ShoppingCart, Star, Package, MapPin } from "lucide-react"

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      number: "100K+",
      label: "Active Community Members",
      description: "Fashion enthusiasts and designers worldwide",
    },
    {
      icon: Globe,
      number: "30+",
      label: "African Countries",
      description: "Represented in our global platform",
    },
    {
      icon: Award,
      number: "2000+",
      label: "Featured Designers",
      description: "Showcasing authentic African fashion",
    },
    {
      icon: TrendingUp,
      number: "98%",
      label: "Customer Satisfaction",
      description: "Based on community feedback and reviews",
    },
    {
      icon: ShoppingCart,
      number: "50K+",
      label: "Products Sold",
      description: "Unique African fashion pieces delivered",
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "Average Rating",
      description: "From thousands of verified customers",
    },
    {
      icon: Package,
      number: "99.5%",
      label: "On-Time Delivery",
      description: "Reliable shipping to 50+ countries",
    },
    {
      icon: MapPin,
      number: "50+",
      label: "Cities Worldwide",
      description: "Where our customers call home",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Our Impact in Numbers
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Building Africa's largest fashion community with authentic connections and meaningful impact across continents
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group hover:bg-background/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#E2725B] rounded-full mb-6 group-hover:bg-accent transition-colors duration-300 mx-auto">
                <stat.icon className="w-10 h-10 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2 text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stat.number}</div>
              <div className="text-xl font-semibold mb-2 text-foreground">{stat.label}</div>
              <p className="text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
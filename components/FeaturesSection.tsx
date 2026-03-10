import { Scissors, Download, Headphones, Menu, Globe, Share2 } from "lucide-react";
import { memo } from "react";

const features = [
  {
    icon: <Scissors className="w-8 h-8 text-black" />,
    title: "Custom Tailoring",
    description: "Get outfits designed to fit your unique style and measurements effortlessly."
  },
  {
    icon: <Download className="w-8 h-8 text-black" />,
    title: "Easy Setup",
    description: "Sign up and start your fashion journey in just a few clicks."
  },
  {
    icon: <Headphones className="w-8 h-8 text-black" />,
    title: "24/7 Support",
    description: "Our dedicated support team is available to assist you at any time."
  },
  {
    icon: <Menu className="w-8 h-8 text-black" />,
    title: "Fast Delivery",
    description: "Enjoy seamless order processing and quick delivery to your doorstep."
  },
  {
    icon: <Globe className="w-8 h-8 text-black" />,
    title: "African-Inspired Designs",
    description: "Explore a variety of styles rooted in rich African culture and heritage."
  },
  {
    icon: <Share2 className="w-8 h-8 text-black" />,
    title: "Social Connect",
    description: "Share your style, get inspired, and connect with other fashion lovers."
  },
];

function FeaturesSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Amazing Features
        </h2>

        {/* Features Grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start text-center sm:text-left">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-gray-500 mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(FeaturesSection);

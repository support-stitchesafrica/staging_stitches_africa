import { Card, CardContent } from "@/components/ui/card";
import { Users, Palette, Globe, Award, Sparkles, Zap, Heart, Shield } from "lucide-react";

export function AboutSection() {
	const features = [
		{
			icon: <Palette className="h-8 w-8" />,
			title: "Authentic African Designs",
			description:
				"Discover genuine African fashion pieces from talented designers across the continent, each telling a unique cultural story with premium craftsmanship.",
		},
		{
			icon: <Users className="h-8 w-8" />,
			title: "Vibrant Community",
			description:
				"Connect with like-minded fashion enthusiasts and share your journey towards exceptional African style and culture in our global community.",
		},
		{
			icon: <Globe className="h-8 w-8" />,
			title: "Global Accessibility",
			description:
				"Access your fashion community anywhere with our beautifully designed mobile app, bringing African style to fashion lovers worldwide.",
		},
		{
			icon: <Award className="h-8 w-8" />,
			title: "Premium Quality",
			description:
				"Every piece is carefully curated to ensure the highest quality and craftsmanship that honors African fashion traditions and exceeds expectations.",
		},
		{
			icon: <Zap className="h-8 w-8" />,
			title: "AI-Powered Styling",
			description:
				"Get personalized recommendations and virtual try-ons with our advanced AI technology that understands your unique style preferences.",
		},
		{
			icon: <Heart className="h-8 w-8" />,
			title: "Ethical Fashion",
			description:
				"Support African artisans and sustainable fashion practices while looking stylish with our carefully vetted ethical vendors.",
		},
		{
			icon: <Shield className="h-8 w-8" />,
			title: "Secure Shopping",
			description:
				"Enjoy peace of mind with our secure payment systems and hassle-free return policy for a worry-free shopping experience.",
		},
		{
			icon: <Sparkles className="h-8 w-8" />,
			title: "Exclusive Collections",
			description:
				"Gain access to limited edition pieces and exclusive collections from top African designers that you won't find anywhere else.",
		},
	];

	return (
		<section id="about" className="py-24 bg-gradient-to-br from-muted/30 to-background">
			<div className="container mx-auto px-6">
				<div className="max-w-4xl mx-auto text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
						Why Choose <span className="italic">Stitches Africa?</span>
					</h2>
					<p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
						Join thousands of fashion enthusiasts discovering authentic African style and connecting with a vibrant community of designers and fashion lovers worldwide.
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
					{features.map((feature, index) => (
						<Card key={index} className="border-0 shadow-lg bg-background hover:shadow-xl transition-all duration-300 group">
							<CardContent className="p-8 text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-6 group-hover:bg-accent transition-colors duration-300">
									{feature.icon}
								</div>
								<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
								<p className="text-muted-foreground text-pretty">
									{feature.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
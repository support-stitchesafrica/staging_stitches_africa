"use client";

import { Button } from "@/components/ui/button";
import { Apple, Play, Sparkles, Users, Palette, Zap, Heart } from "lucide-react";

export default function CTASection() {
	const benefits = [
		{
			icon: <Palette className="h-6 w-6" />,
			title: "Personalized Style Discovery",
			description: "Our AI assistant learns your preferences to recommend pieces that match your unique taste and body type."
		},
		{
			icon: <Zap className="h-6 w-6" />,
			title: "Virtual Try-On Experience",
			description: "See how clothes look on your body before purchasing with our advanced AR fitting technology."
		},
		{
			icon: <Users className="h-6 w-6" />,
			title: "Community Connection",
			description: "Connect with fellow fashion enthusiasts and African designers to share styling tips and inspiration."
		},
		{
			icon: <Heart className="h-6 w-6" />,
			title: "Ethical Fashion Support",
			description: "Every purchase supports African artisans and sustainable fashion practices that make a positive impact."
		}
	];

	return (
		<section className="py-20 bg-gradient-to-br from-background to-muted/30">
			{/* What Stitches Will Do for You Section */}
			<div className="max-w-6xl mx-auto px-8 mb-20">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-2">
						<Sparkles className="text-accent" />
						What Stitches Will Do for You
						<Sparkles className="text-accent" />
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Experience fashion shopping transformed with our unique platform benefits
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
					{benefits.map((benefit, index) => (
						<div key={index} className="bg-white p-6 rounded-xl border border-muted shadow-sm hover:shadow-md transition-shadow">
							<div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-lg mb-4">
								{benefit.icon}
							</div>
							<h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
							<p className="text-muted-foreground text-sm">{benefit.description}</p>
						</div>
					))}
				</div>
			</div>

			{/* Original CTA Section */}
			<div className="max-w-4xl mx-auto px-8 text-center border-t border-muted pt-20">
				<h2 className="text-4xl font-bold mb-6">
					Ready to Discover Your Style?
				</h2>
				<p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
					Join the Stitches Africa community today and start your journey
					towards exceptional African fashion. Download our app and connect with
					designers, fashion lovers, and authentic African style.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<Button
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							window.open(
								"https://apps.apple.com/app/stitches-africa/id6753875161",
								"_blank",
								"noopener"
							);
						}}
						className="flex items-center space-x-2 px-8 py-6 border-2 border-gray-300 text-gray-900 hover:bg-gray-900 hover:text-white bg-white text-lg"
					>
						<img
							src="/images/apple-logo.png"
							alt="apple-store"
							className="w-12 h-5"
						/>
						<div className="text-left">
							<div className="text-xs">Download on the</div>
							<div className="font-semibold">App Store</div>
						</div>
					</Button>
					<Button
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							window.open(
								"https://play.google.com/store/apps/details?id=com.stitchesAfricaLimited.app&pcampaignid=web_share",
								"_blank",
								"noopener"
							);
						}}
						className="flex items-center space-x-2 px-8 py-6 border-2 border-gray-300 text-gray-900 hover:bg-gray-900 hover:text-white bg-white text-lg"
					>
						<img
							src="/images/playstore-log.png"
							alt="play-store"
							className="w-5 h-5"
						/>
						<div className="text-left">
							<div className="text-xs">Get it on</div>
							<div className="font-semibold">Google Play</div>
						</div>
					</Button>
				</div>
			</div>
		</section>
	);
}
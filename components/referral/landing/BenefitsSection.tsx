"use client";

import React from "react";
import { Share2, DollarSign, TrendingUp, Gift } from "lucide-react";

interface BenefitsSectionProps {
	className?: string;
}

export function BenefitsSection({ className = "" }: BenefitsSectionProps) {
	const benefits = [
		{
			icon: DollarSign,
			title: "Earn as You Grow",
			description:
				"Get rewarded for every sign-up and purchase made through your code.",
		},
		{
			icon: Gift,
			title: "Unlock Exciting Perks",
			description:
				"Accumulate points to access gifts, exclusive drops, and other special rewards from 1,000 points upward.",
		},
		{
			icon: TrendingUp,
			title: "Track Your Impact",
			description:
				"Your dashboard keeps you updated on your referral counts, points, and commission rewards in real time.",
		},
		{
			icon: Share2,
			title: "Share Effortlessly",
			description:
				"Post your link anywhere – Instagram, WhatsApp, Twitter, or your bio – and start earning instantly.",
		},
	];

	return (
		<section id="benefits" className={`py-16 md:py-24 bg-white ${className}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12 sm:mb-16">
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 px-4">
						Why Join Our Referral Program?
					</h2>
					<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
						Receive 1 point for each sign-up or app download through your referral code, plus commissions on every purchase that follows. Accumulated points can unlock special gifts, experiences, or other exclusive rewards once you reach 1,000 points.
					</p>
					<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4 mt-6 sm:mt-8">
						Here’s why it’s worth it:
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
					{benefits.map((benefit, index) => (
						<div
							key={index}
							className="group p-6 sm:p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-black hover:shadow-xl transition-all duration-300 animate-fade-in-up"
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className="mb-4 sm:mb-6">
								<div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
									<benefit.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
								</div>
							</div>
							<h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">
								{benefit.title}
							</h3>
							<p className="text-sm sm:text-base text-gray-600">
								{benefit.description}
							</p>
						</div>
					))}
				</div>
				
				<div className="text-center mt-12 sm:mt-16">
					<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
						Join today and start building your reward story with Stitches Africa.
					</p>
				</div>
			</div>
		</section>
	);
}
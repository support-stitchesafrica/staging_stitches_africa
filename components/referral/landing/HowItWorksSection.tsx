/**
 * How It Works Section Component
 * Step-by-step process visualization
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

"use client";

import React, { memo } from "react";
import { UserPlus, Link2, Share2, Gift } from "lucide-react";

interface HowItWorksSectionProps {
	className?: string;
}

export function HowItWorksSection({ className = "" }: HowItWorksSectionProps) {
	const steps = [
		{
			number: 1,
			icon: UserPlus,
			title: "Sign Up & Get Your Code",
			description:
				"Create your free referral account in less than 2 minutes and instantly receive your unique referral link and code. No credit card required.",
		},
		{
			number: 2,
			icon: Share2,
			title: "Share Your Link",
			description:
				"Share your link with friends, family, and followers across any platform — Instagram, WhatsApp, Twitter, group chats, or your bio.",
		},
		{
			number: 3,
			icon: Gift,
			title: "Earn Rewards",
			description:
				"Get 1 point per sign-up or app download, plus commission on every purchase made through your link or code.",
		},
	];

	return (
		<section
			id="how-it-works"
			className={`py-16 md:py-24 bg-gray-50 ${className}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12 sm:mb-16">
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 px-4">
						How It Works
					</h2>
					<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
						Start earning in 3 simple steps:
					</p>
				</div>

				{/* Mobile: Vertical Timeline */}
				<div className="lg:hidden space-y-6 sm:space-y-8">
					{steps.map((step, index) => (
						<div key={index} className="relative pl-10 sm:pl-12">
							{/* Vertical line */}
							{index < steps.length - 1 && (
								<div className="absolute left-5 sm:left-6 top-14 sm:top-16 bottom-0 w-0.5 bg-gray-300"></div>
							)}
							
							{/* Step number circle */}
							<div className="absolute left-0 top-0 w-10 h-10 sm:w-12 sm:h-12 bg-black text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold">
								{step.number}
							</div>
							
							<div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-gray-200">
								<div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
									<step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0" />
									<h3 className="text-lg sm:text-xl font-bold text-black">
										{step.title}
									</h3>
								</div>
								<p className="text-sm sm:text-base text-gray-600">
									{step.description}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Desktop: Horizontal Timeline */}
				<div className="hidden lg:block">
					<div className="relative">
						{/* Horizontal line */}
						<div className="absolute top-12 left-0 right-0 h-0.5 bg-gray-300"></div>

						<div className="grid grid-cols-3 gap-8">
							{steps.map((step, index) => (
								<div key={index} className="relative">
									{/* Step number circle */}
									<div className="relative z-10 w-24 h-24 mx-auto bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
										{step.number}
									</div>

									{/* Arrow */}
									{index < steps.length - 1 && (
										<div className="absolute top-12 right-0 transform translate-x-1/2 z-0">
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
											>
												<path
													d="M5 12h14m-7-7l7 7-7 7"
													stroke="#D1D5DB"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</div>
									)}

									<div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-black transition-colors">
										<div className="flex justify-center mb-4">
											<step.icon className="w-8 h-8 text-black" />
										</div>
										<h3 className="text-xl font-bold text-black mb-3 text-center">
											{step.title}
										</h3>
										<p className="text-gray-600 text-center text-sm">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export const MemoizedHowItWorksSection = memo(HowItWorksSection);
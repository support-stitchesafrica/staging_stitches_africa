/**
 * Hero Section Component
 * Main landing section with headline, CTA, and illustration
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
	className?: string;
}

export function HeroSection({ className = "" }: HeroSectionProps) {
	return (
		<section
			className={`pt-24 pb-16 md:pt-32 md:pb-24 bg-gray-50 text-gray-900 ${className}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-12 items-center">
					{/* Left side - Content */}
					<div className="space-y-6 sm:space-y-8 animate-fade-in">
						<div className="space-y-3 sm:space-y-4">
							<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
								Join the Stitches Africa Referral Program
							</h1>
							<p className="text-lg sm:text-xl md:text-2xl text-gray-600">
								Earn rewards and commissions every time your community shops
								through your referral code.
							</p>
							<p className="text-base sm:text-lg text-gray-500">
								Share the love, grow your influence, and get rewarded for every
								sign-up or purchase made through you.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
							<Link href="/referral/signup" className="w-full sm:w-auto">
								<Button
									size="lg"
									className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group"
								>
									Start Earning Now
									<ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
								</Button>
							</Link>
							<Link href="/referral/login" className="w-full sm:w-auto">
								<Button
									size="lg"
									variant="outline"
									className="w-full sm:w-auto border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-black text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
								>
									Login
								</Button>
							</Link>
						</div>
					</div>

					{/* Right side - Illustration */}
					<div className="hidden lg:block">
						<HeroIllustration />
					</div>
				</div>
			</div>
		</section>
	);
}

export const MemoizedHeroSection = memo(HeroSection);

function HeroIllustration() {
	return (
		<svg
			viewBox="0 0 600 500"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="w-full h-auto"
		>
			{/* People sharing and earning illustration */}
			<g className="animate-float">
				{/* Person 1 */}
				<circle cx="150" cy="150" r="40" stroke="black" strokeWidth="3" />
				<path d="M150 190 L150 280" stroke="black" strokeWidth="3" />
				<path d="M150 220 L120 260" stroke="black" strokeWidth="3" />
				<path d="M150 220 L180 260" stroke="black" strokeWidth="3" />

				{/* Person 2 */}
				<circle cx="450" cy="150" r="40" stroke="black" strokeWidth="3" />
				<path d="M450 190 L450 280" stroke="black" strokeWidth="3" />
				<path d="M450 220 L420 260" stroke="black" strokeWidth="3" />
				<path d="M450 220 L480 260" stroke="black" strokeWidth="3" />

				{/* Connection line */}
				<path
					d="M190 150 L410 150"
					stroke="#9CA3AF"
					strokeWidth="2"
					strokeDasharray="5,5"
					className="animate-dash"
				/>

				{/* Share icon in middle */}
				<circle cx="300" cy="150" r="30" fill="black" />
				<path
					d="M300 135 L315 150 L300 165 M285 150 L315 150"
					stroke="white"
					strokeWidth="3"
					strokeLinecap="round"
				/>
			</g>

			{/* Money symbols */}
			<g className="animate-pulse-slow">
				<text x="250" y="350" fill="black" fontSize="48" fontWeight="bold">
					$
				</text>
				<text x="320" y="380" fill="black" fontSize="48" fontWeight="bold">
					$
				</text>
				<text x="280" y="420" fill="black" fontSize="48" fontWeight="bold">
					$
				</text>
			</g>
		</svg>
	);
}

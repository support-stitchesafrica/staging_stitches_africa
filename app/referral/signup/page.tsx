/**
 * Referral Program Sign-Up Page
 * Enhanced split layout with illustration
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

"use client";

import React from "react";
import Link from "next/link";
import { SignUpForm } from "@/components/referral/auth/SignUpForm";
import { ReferralAuthProvider } from "@/contexts/ReferralAuthContext";
import { AuthDebugger } from "@/components/referral/auth/AuthDebugger";
import { ArrowLeft } from "lucide-react";

export default function ReferralSignUpPage() {
	return (
		<ReferralAuthProvider>
			<div className="min-h-screen flex flex-col lg:flex-row">
				{/* Left Column - Form */}
				<div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white py-8 lg:py-0">
					<div className="mx-auto w-full max-w-sm lg:w-96">
						{/* Back to home link */}
						<Link
							href="/referral"
							className="inline-flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 transition-colors"
						>
							<ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
							Back to home
						</Link>

						<SignUpForm />
					</div>
				</div>

				{/* Right Column - Illustration */}
				<div className="hidden lg:block relative flex-1 bg-black">
					<div className="absolute inset-0 flex items-center justify-center p-12">
						<div className="max-w-md text-center space-y-8">
							{/* Illustration */}
							<SignUpIllustration />

							{/* Text Content */}
							<div className="space-y-4">
								<h2 className="text-3xl font-bold text-white">
									Start Earning Today!
								</h2>
								<p className="text-lg text-gray-300">
									Join thousands of referrers earning rewards by sharing
									Stitches Africa with their network.
								</p>
							</div>

							{/* Benefits */}
							<div className="space-y-4 pt-8 text-left">
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center mt-0.5">
										<svg
											className="w-4 h-4 text-black"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div>
										<p className="text-white font-medium">
											1 Point per Referral
										</p>
										<p className="text-sm text-gray-400">
											Instant rewards for every sign-up
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center mt-0.5">
										<svg
											className="w-4 h-4 text-black"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div>
										<p className="text-white font-medium">5% Commission</p>
										<p className="text-sm text-gray-400">
											Earn on every purchase they make
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center mt-0.5">
										<svg
											className="w-4 h-4 text-black"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div>
										<p className="text-white font-medium">
											Unlimited Potential
										</p>
										<p className="text-sm text-gray-400">
											No cap on referrals or earnings
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<AuthDebugger />
		</ReferralAuthProvider>
	);
}

/**
 * Sign-Up Illustration Component
 * SVG illustration for the sign-up page
 * Requirements: 10.2, 16.1, 16.2, 16.3
 */
function SignUpIllustration() {
	return (
		<svg
			viewBox="0 0 400 300"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="w-full h-auto"
		>
			{/* Registration/Growth illustration */}
			<g className="animate-float">
				{/* Central user icon */}
				<circle
					cx="200"
					cy="120"
					r="30"
					stroke="white"
					strokeWidth="3"
					fill="none"
				/>
				<path d="M200 150 L200 180" stroke="white" strokeWidth="3" />
				<path d="M200 165 L175 195" stroke="white" strokeWidth="3" />
				<path d="M200 165 L225 195" stroke="white" strokeWidth="3" />

				{/* Connected users (network) */}
				<circle
					cx="100"
					cy="80"
					r="15"
					stroke="white"
					strokeWidth="2"
					fill="none"
					opacity="0.7"
				/>
				<line
					x1="130"
					y1="100"
					x2="175"
					y2="110"
					stroke="white"
					strokeWidth="2"
					strokeDasharray="3,3"
					opacity="0.5"
				/>

				<circle
					cx="300"
					cy="80"
					r="15"
					stroke="white"
					strokeWidth="2"
					fill="none"
					opacity="0.7"
				/>
				<line
					x1="270"
					y1="100"
					x2="225"
					y2="110"
					stroke="white"
					strokeWidth="2"
					strokeDasharray="3,3"
					opacity="0.5"
				/>

				<circle
					cx="120"
					cy="200"
					r="15"
					stroke="white"
					strokeWidth="2"
					fill="none"
					opacity="0.7"
				/>
				<line
					x1="145"
					y1="195"
					x2="175"
					y2="175"
					stroke="white"
					strokeWidth="2"
					strokeDasharray="3,3"
					opacity="0.5"
				/>

				<circle
					cx="280"
					cy="200"
					r="15"
					stroke="white"
					strokeWidth="2"
					fill="none"
					opacity="0.7"
				/>
				<line
					x1="255"
					y1="195"
					x2="225"
					y2="175"
					stroke="white"
					strokeWidth="2"
					strokeDasharray="3,3"
					opacity="0.5"
				/>
			</g>

			{/* Growth arrow */}
			<g className="animate-pulse-slow">
				<path
					d="M50 250 L100 220 L150 230 L200 200 L250 210 L300 180 L350 170"
					stroke="white"
					strokeWidth="3"
					fill="none"
					opacity="0.8"
				/>
				<path d="M350 170 L340 165 L345 180" fill="white" opacity="0.8" />
			</g>

			{/* Floating coins/rewards */}
			<g className="animate-pulse-slow">
				<circle cx="80" cy="50" r="8" fill="white" opacity="0.6" />
				<text
					x="80"
					y="55"
					fill="black"
					fontSize="10"
					textAnchor="middle"
					fontWeight="bold"
				>
					$
				</text>

				<circle cx="320" cy="240" r="8" fill="white" opacity="0.6" />
				<text
					x="320"
					y="245"
					fill="black"
					fontSize="10"
					textAnchor="middle"
					fontWeight="bold"
				>
					$
				</text>

				<circle cx="350" cy="100" r="6" fill="white" opacity="0.5" />
				<text
					x="350"
					y="104"
					fill="black"
					fontSize="8"
					textAnchor="middle"
					fontWeight="bold"
				>
					$
				</text>
			</g>
		</svg>
	);
}

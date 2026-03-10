"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { ArrowRight, Users, DollarSign, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function ReferAndEarnBanner() {
	const router = useRouter();
	const { t } = useLanguage();

	return (
		<section className="py-20 md:py-28 bg-white">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
					{/* Left Side - Content */}
					<div className="space-y-10">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-sm font-medium text-gray-700">
								{t.referral.badge}
							</span>
						</div>

						{/* Main Heading */}
						<div className="space-y-4">
							<h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 leading-tight tracking-tight">
								{t.referral.title.split(" & ")[0]} &<br />
								<span className="font-normal">
									{t.referral.title.split(" & ")[1] || "Earn"}
								</span>
							</h1>
							<p className="text-xl md:text-2xl text-gray-600 font-light max-w-lg">
								{t.referral.subtitle}
							</p>
						</div>

						{/* Benefits */}
						<div className="grid grid-cols-3 gap-6 py-8">
							<div className="text-center space-y-3">
								<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
									<DollarSign className="w-6 h-6 text-gray-700" />
								</div>
								<div>
									<div className="text-2xl font-light text-gray-900">$25</div>
									<div className="text-sm text-gray-600">
										{t.referral.perReferral}
									</div>
								</div>
							</div>

							<div className="text-center space-y-3">
								<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
									<Users className="w-6 h-6 text-gray-700" />
								</div>
								<div>
									<div className="text-2xl font-light text-gray-900">
										{t.referral.unlimited}
									</div>
									<div className="text-sm text-gray-600">
										{t.referral.referrals}
									</div>
								</div>
							</div>

							<div className="text-center space-y-3">
								<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
									<Zap className="w-6 h-6 text-gray-700" />
								</div>
								<div>
									<div className="text-2xl font-light text-gray-900">
										{t.referral.instant}
									</div>
									<div className="text-sm text-gray-600">
										{t.referral.payouts}
									</div>
								</div>
							</div>
						</div>

						{/* CTA Button */}
						<div className="pt-4">
							<button
								onClick={() => router.push("/referral")}
								className="group inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-medium text-lg hover:bg-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
							>
								{t.referral.cta}
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</button>
						</div>

						{/* Footer Text */}
						<div className="pt-8 space-y-2">
							<p className="text-gray-500 text-sm">stitchesafrica.com</p>
							<p className="text-gray-400 text-sm">#TogetherWeGrow</p>
						</div>
					</div>

					{/* Right Side - Phone Image */}
					<div className="flex justify-center lg:justify-end">
						<div className="relative">
							{/* Phone Container */}
							<div className="relative w-72 md:w-80 lg:w-96">
								{/* Subtle background glow */}
								<div className="absolute inset-0 bg-gray-100 rounded-3xl blur-3xl opacity-30 scale-110"></div>

								{/* Phone Frame */}
								<div className="relative bg-gray-900 rounded-3xl p-2 shadow-2xl">
									<div className="bg-black rounded-2xl overflow-hidden">
										<Image
											src="/images/PHONE-992x2048.png"
											alt="Stitches Africa App"
											width={450}
											height={750}
											className="w-full h-auto object-contain"
											priority
										/>
									</div>
								</div>

								{/* Floating Elements - Minimal */}
								<div className="absolute -top-4 -right-4 bg-black text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg">
									New
								</div>
								<div className="absolute -bottom-4 -left-4 bg-white text-black text-xs font-medium px-3 py-2 rounded-full shadow-lg border border-gray-200">
									$25 reward
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Section - How it works */}
				<div className="mt-24 pt-16 border-t border-gray-200">
					<div className="text-center space-y-12">
						<h2 className="text-3xl md:text-4xl font-light text-gray-900">
							{t.referral.howItWorks}
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
									<span className="text-2xl font-light text-gray-700">1</span>
								</div>
								<h3 className="text-lg font-medium text-gray-900">
									{t.referral.step1Title}
								</h3>
								<p className="text-gray-600 text-sm leading-relaxed">
									{t.referral.step1Desc}
								</p>
							</div>

							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
									<span className="text-2xl font-light text-gray-700">2</span>
								</div>
								<h3 className="text-lg font-medium text-gray-900">
									{t.referral.step2Title}
								</h3>
								<p className="text-gray-600 text-sm leading-relaxed">
									{t.referral.step2Desc}
								</p>
							</div>

							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
									<span className="text-2xl font-light text-gray-700">3</span>
								</div>
								<h3 className="text-lg font-medium text-gray-900">
									{t.referral.step3Title}
								</h3>
								<p className="text-gray-600 text-sm leading-relaxed">
									{t.referral.step3Desc}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default memo(ReferAndEarnBanner);

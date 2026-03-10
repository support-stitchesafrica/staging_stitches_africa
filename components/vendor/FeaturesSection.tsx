"use client";

import { memo } from "react";
// components/FeaturesSection.tsx

import { Scissors, Ruler, Headphones } from "lucide-react";
import Image from "next/image";

function FeaturesSections() {
	return (
		<section className="py-20 bg-gray-50 text-black">
			<div className="max-w-7xl mx-auto px-6 lg:px-12">
				{/* Heading */}
				<h2 className="text-center text-3xl sm:text-4xl font-extrabold mb-16">
					What Stitches Will Do for You
				</h2>

				{/* Main content */}
				<div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12">
					{/* Left Column */}
					<div className="space-y-10">
						<div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white">
									<Scissors className="w-5 h-5" />
								</div>
								<h3 className="font-semibold text-lg">Tailored Fashion</h3>
							</div>
							<p className="text-sm text-gray-600">
								Get custom-made outfits designed to fit your unique style and
								preferences.
							</p>
						</div>

						<div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
									<span className="font-bold text-lg">A</span>
								</div>
								<h3 className="font-semibold text-lg">
									African-Inspired Designs
								</h3>
							</div>
							<p className="text-sm text-gray-600">
								Explore a variety of styles inspired by rich African culture and
								heritage.
							</p>
						</div>
					</div>

					{/* Center Image */}
					<div className="flex justify-center">
						<Image
							src="/images/PHONE-992x2048.png"
							alt="Phone mockup"
							width={280}
							height={560}
							className="object-contain drop-shadow-2xl"
							priority
						/>
					</div>

					{/* Right Column */}
					<div className="space-y-10">
						<div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
									<Ruler className="w-5 h-5" />
								</div>
								<h3 className="font-semibold text-lg">AI Measurement</h3>
							</div>
							<p className="text-sm text-gray-600">
								Experience precision fitting with our AI-powered measurement
								system for perfect outfits.
							</p>
						</div>

						<div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
									<Headphones className="w-5 h-5" />
								</div>
								<h3 className="font-semibold text-lg">24/7 Support</h3>
							</div>
							<p className="text-sm text-gray-600">
								Get assistance whenever you need it with our dedicated support
								team.
							</p>
						</div>
					</div>
				</div>

				{/* Button */}
				<div className="mt-12 text-center">
					<button className="px-6 py-3 rounded-full border border-black font-medium text-sm hover:bg-black hover:text-white transition">
						More Features
					</button>
				</div>
			</div>
		</section>
	);
}

export default memo(FeaturesSection);

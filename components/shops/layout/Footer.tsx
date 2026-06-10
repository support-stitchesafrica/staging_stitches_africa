"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FooterSocialLinks } from "./FooterSocialLinks";

export const Footer: React.FC = () => {
	const { t } = useLanguage();

	return (
		<footer className="bg-white border-t border-gray-200 text-gray-800">
			<div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
					{/* Company Info */}
					<div className="space-y-4 sm:col-span-2 lg:col-span-1">
						<div className="flex justify-center sm:justify-start">
							<Image
								src="/Stitches-Africa-Logo-06.png"
								alt="Stitches Africa"
								width={160}
								height={60}
								className="h-12 sm:h-16 w-auto"
								priority
							/>
						</div>
						<p className="text-gray-600 leading-relaxed text-sm sm:text-base text-center sm:text-left">
							{t.footer.description}
						</p>
						<FooterSocialLinks />
					</div>

					{/* Quick Links */}
					<div className="space-y-4 text-center sm:text-left">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900">
							{t.footer.quickLinks}
						</h3>
						<ul className="space-y-2 text-sm sm:text-base">
							<li>
								<Link
									href="/shops/products"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t.footer.allProducts}
								</Link>
							</li>
							<li>
								<Link
									href="/shops/products?type=bespoke"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t.footer.bespokeCollection}
								</Link>
							</li>
							<li>
								<Link
									href="/shops/products?type=ready-to-wear"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t.header.readyToWear}
								</Link>
							</li>
							
						</ul>
					</div>

					{/* Customer Service */}
					<div className="space-y-4 text-center sm:text-left">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900">
							{t.footer.customerService}
						</h3>
						<ul className="space-y-2 text-sm sm:text-base">
							<li>
								<Link
									href="/shops/vendors"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t.footer.ourVendors}
								</Link>
							</li>
							<li>
								<Link
									href="/shops/about"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t.footer.aboutUs}
								</Link>
							</li>
							<li>
								<Link
									href="/discover"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t.footer.discover}
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact Info */}
					<div className="space-y-4 text-center sm:text-left">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900">
							{t.footer.getInTouch}
						</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-center sm:justify-start space-x-3">
								<Mail size={16} className="text-gray-500 flex-shrink-0" />
								<span className="text-gray-600 text-sm sm:text-base break-all">
									support@stitchesafrica.com
								</span>
							</div>
							<div className="flex items-center justify-center sm:justify-start space-x-3">
								<Phone size={16} className="text-gray-500 flex-shrink-0" />
								<span className="text-gray-600 text-sm sm:text-base">
									+234 (0) 123-456-789
								</span>
							</div>
							<div className="flex items-start justify-center sm:justify-start space-x-3">
								<MapPin
									size={16}
									className="text-gray-500 mt-1 flex-shrink-0"
								/>
								<span className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
									Lagos, Nigeria
									<br />
									West Africa
								</span>
							</div>
						</div>

						{/* Newsletter */}
						<div className="mt-6">
							<h4 className="font-medium mb-3 text-gray-900">
								{t.footer.stayUpdated}
							</h4>
							<form className="flex flex-col sm:flex-row gap-2">
								<input
									type="email"
									placeholder={t.footer.emailPlaceholder}
									className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md sm:rounded-l-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
								/>
								<button
									type="submit"
									className="px-4 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md transition-colors text-sm font-medium"
								>
									{t.footer.subscribe}
								</button>
							</form>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-gray-200 mt-8 sm:mt-12 pt-6 sm:pt-8">
					<div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
						<div className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
							{t.footer.copyright}
						</div>
						<div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
							{/* <Link
								href="/shops/privacy"
								className="text-gray-600 hover:text-gray-900 transition-colors"
							>
								{t.footer.privacy}
							</Link> */}
							<Link
								href="/shops/terms"
								className="text-gray-600 hover:text-gray-900 transition-colors"
							>
								{t.footer.terms}
							</Link>
							{/* <Link
								href="/shops/cookies"
								className="text-gray-600 hover:text-gray-900 transition-colors"
							>
								{t.footer.cookies}
							</Link> */}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};
